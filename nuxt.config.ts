import tailwindcss from "@tailwindcss/vite";
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writePrecacheManifest } from './scripts/precache-manifest.mjs';

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

function appVersion() {
  return process.env.NUXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || 'DEBUG';
}

// Força atualização obrigatória sem depender de um major bump. Vazio = o padrão
// vale (o major da própria versão), ver scripts/precache-manifest.mjs.
function appMinVersion() {
  return process.env.APP_MIN_VERSION || undefined;
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
      appVersion: appVersion(),
      // Chave pública VAPID do servidor de push. Vazia = sem Web Push;
      // a permissão de notificação continua servindo para avisos locais do jogo.
      pushPublicKey: process.env.NUXT_PUBLIC_PUSH_PUBLIC_KEY || '',
      // Endpoint que recebe a inscrição de push do jogador (POST JSON). Opcional.
      pushSubscribeUrl: process.env.NUXT_PUBLIC_PUSH_SUBSCRIBE_URL || '',
    },
  },
  routeRules: {
    // O sw.js e o manifesto precisam ser revalidados a cada abertura: em cache
    // (o Cloudflare guardava os dois por 4h), o jogador continuaria com o service
    // worker antigo e a versão nova demoraria a chegar.
    '/sw.js': { headers: { 'cache-control': 'no-cache, must-revalidate' } },
    '/precache-manifest.json': { headers: { 'cache-control': 'no-cache, must-revalidate' } },
  },
  hooks: {
    // Lista para o service worker tudo que foi publicado, com hash por arquivo.
    // Roda depois que o Nitro copia public/ e o build do client para .output/public.
    'nitro:build:public-assets': (nitro) => {
      const manifest = writePrecacheManifest(nitro.options.output.publicDir, {
        version: appVersion(),
        minVersion: appMinVersion(),
      });
      const total = [...manifest.shell, ...manifest.assets].reduce((sum, file) => sum + file.size, 0);
      console.log(`[pwa] precache-manifest: ${manifest.shell.length} do shell + ${manifest.assets.length} assets (${(total / 1024 / 1024).toFixed(1)} MB)`);
      console.log(`[pwa] versão ${manifest.version} — obrigatória a partir de ${manifest.minVersion ?? '(nenhuma)'}`);
    },
  },
  extends: [
    'nuxt-unified-confetti',
  ],
})

