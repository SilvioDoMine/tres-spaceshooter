import tailwindcss from "@tailwindcss/vite";
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Pastas de public/ que a tela de loading baixa inteiras antes de liberar o jogo
const PRELOAD_DIRS = ['images', 'models', 'sounds', 'fonts'];
const PRELOAD_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg|glb|gltf|bin|json|wav|mp3|ogg)$/i;

function listPreloadAssets() {
  const publicDir = fileURLToPath(new URL('./public', import.meta.url));
  const assets: { url: string; size: number }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const full = join(dir, name);
      const stats = statSync(full);
      if (stats.isDirectory()) walk(full);
      else if (PRELOAD_EXTENSIONS.test(name)) {
        assets.push({ url: encodeURI('/' + relative(publicDir, full).split(sep).join('/')), size: stats.size });
      }
    }
  };
  for (const dir of PRELOAD_DIRS) {
    try { walk(join(publicDir, dir)); } catch { /* pasta ausente */ }
  }
  return assets;
}

// `import manifest from 'virtual:asset-manifest'` => lista de assets gerada no build
function assetManifestPlugin() {
  const id = 'virtual:asset-manifest';
  const resolvedId = '\0' + id;
  return {
    name: 'asset-manifest',
    resolveId: (source: string) => (source === id ? resolvedId : undefined),
    load: (moduleId: string) => (moduleId === resolvedId ? `export default ${JSON.stringify(listPreloadAssets())}` : undefined),
  };
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@tresjs/nuxt', '@nuxt/devtools', '@pinia/nuxt'],
  compatibilityDate: '2025-11-01',
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss(), assetManifestPlugin()]
  },
  devtools: { enabled: false },
  ssr: false,
  runtimeConfig: {
    public: {
      // Preenchido no build pelo Dockerfile a partir do build arg APP_VERSION,
      // que o workflow Release & Deploy grava no Coolify antes de cada deploy.
      // Sem nenhuma das duas (dev local sem .env), vira 'DEBUG'.
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || 'DEBUG',
    },
  },
  extends: [
    'nuxt-unified-confetti',
  ],
})

