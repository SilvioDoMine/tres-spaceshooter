/**
 * Lista o que o service worker precisa guardar para o jogo abrir offline.
 *
 * Roda no build (hook `nitro:build:public-assets` do nuxt.config) varrendo a
 * pasta publicada e grava `precache-manifest.json` ao lado do sw.js.
 *
 * Cada arquivo leva um `rev` (hash do conteúdo): entre dois deploys o service
 * worker rebaixa só o que mudou de rev, em vez de jogar os ~25 MB fora.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Pastas de assets pesados do jogo: o resto é o "shell" (HTML, JS, CSS, ícones). */
export const DATA_DIRS = ['images', 'models', 'sounds', 'fonts'];

/** Arquivos que nunca entram no cache (o próprio SW e o manifesto). */
const SKIP = new Set(['sw.js', 'precache-manifest.json']);

export const MANIFEST_FILE = 'precache-manifest.json';

function walk(dir, publicDir, out) {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, publicDir, out);
      continue;
    }
    const rel = relative(publicDir, full).split(sep).join('/');
    if (SKIP.has(rel)) continue;
    out.push({
      url: encodeURI('/' + rel),
      rev: createHash('md5').update(readFileSync(full)).digest('hex').slice(0, 12),
      size: stats.size,
    });
  }
}

/** true quando o arquivo é um asset de jogo (baixado pela tela de loading), não parte do shell. */
export function isGameAsset(url) {
  return DATA_DIRS.some(dir => url.startsWith(`/${dir}/`));
}

/**
 * Versão mínima que o jogador pode continuar jogando. Abaixo dela o app se
 * atualiza mesmo no meio de uma partida (ver app/plugins/pwa.client.ts).
 *
 * O padrão é o major da própria versão: scripts/next-version.sh já promove a
 * major todo commit marcado `feat!:`, `BREAKING CHANGE` ou `[major]`, então é lá
 * que se declara "este release quebra o save/balanceamento". APP_MIN_VERSION
 * força o mesmo efeito sem um major bump.
 */
export function minVersionFor(version, override) {
  if (override) return override;
  const match = /^v(\d+)\.\d+\.\d+$/.exec(version || '');
  // Build sem tag (dev local): nada é obrigatório.
  return match ? `v${match[1]}.0.0` : null;
}

/**
 * @param {string} publicDir pasta publicada (.output/public)
 * @param {{ version?: string, minVersion?: string }} [options]
 */
export function buildPrecacheManifest(publicDir, options = {}) {
  const files = [];
  walk(publicDir, publicDir, files);

  const shell = files.filter(file => !isGameAsset(file.url));
  const assets = files.filter(file => isGameAsset(file.url));
  const version = options.version || 'DEBUG';

  return {
    version,
    minVersion: minVersionFor(version, options.minVersion),
    // Muda sempre que qualquer arquivo muda: é o nome do cache do service worker.
    revision: createHash('md5').update(files.map(f => `${f.url}:${f.rev}`).join('\n')).digest('hex').slice(0, 12),
    shell,
    assets,
  };
}

/**
 * Gera e grava o manifesto dentro da pasta publicada e carimba a revisão no sw.js.
 *
 * O carimbo importa: o navegador só reinstala o service worker quando o arquivo
 * muda: sem ele, um deploy novo nunca atualizaria o cache.
 */
export function writePrecacheManifest(publicDir, options = {}) {
  const manifest = buildPrecacheManifest(publicDir, options);
  writeFileSync(join(publicDir, MANIFEST_FILE), JSON.stringify(manifest));

  const swPath = join(publicDir, 'sw.js');
  try {
    const source = readFileSync(swPath, 'utf8');
    writeFileSync(swPath, source.replace('__BUILD_REVISION__', `${manifest.version}-${manifest.revision}`));
  } catch {
    // Sem sw.js publicado não há o que carimbar.
  }

  return manifest;
}
