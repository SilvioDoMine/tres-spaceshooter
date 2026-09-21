import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const { buildPrecacheManifest, writePrecacheManifest, isGameAsset } = await import('../scripts/precache-manifest.mjs');

function fakeBuild(files) {
  const dir = mkdtempSync(join(tmpdir(), 'precache-'));
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

test('separa o shell dos assets pesados do jogo', () => {
  const dir = fakeBuild({
    'index.html': '<html></html>',
    '_nuxt/app.CafeBabe.js': 'console.log(1)',
    'icons/icon-192.png': 'png',
    'images/ship.png': 'png',
    'models/kestrel.glb': 'glb',
    'sounds/laser.wav': 'wav',
    'fonts/Poppins.json': '{}',
  });

  const manifest = buildPrecacheManifest(dir, { version: '1.2.3' });

  assert.equal(manifest.version, '1.2.3');
  assert.deepEqual(manifest.shell.map(f => f.url).sort(), ['/_nuxt/app.CafeBabe.js', '/icons/icon-192.png', '/index.html']);
  assert.deepEqual(manifest.assets.map(f => f.url).sort(), ['/fonts/Poppins.json', '/images/ship.png', '/models/kestrel.glb', '/sounds/laser.wav']);
  assert.ok(manifest.shell.every(f => f.rev.length === 12 && f.size > 0));
});

test('sw.js e o próprio manifesto ficam de fora do cache', () => {
  const dir = fakeBuild({ 'sw.js': 'self', 'precache-manifest.json': '{}', 'robots.txt': 'ok' });
  const manifest = buildPrecacheManifest(dir);

  assert.deepEqual(manifest.shell.map(f => f.url), ['/robots.txt']);
  assert.deepEqual(manifest.assets, []);
});

test('o rev muda com o conteúdo e a revisão acompanha', () => {
  const before = buildPrecacheManifest(fakeBuild({ 'images/ship.png': 'v1' }));
  const after = buildPrecacheManifest(fakeBuild({ 'images/ship.png': 'v2' }));

  assert.notEqual(before.assets[0].rev, after.assets[0].rev);
  assert.notEqual(before.revision, after.revision);
});

test('mesmos arquivos geram a mesma revisão (deploy sem mudanças não rebaixa nada)', () => {
  const files = { 'index.html': 'a', 'images/ship.png': 'b' };
  assert.equal(buildPrecacheManifest(fakeBuild(files)).revision, buildPrecacheManifest(fakeBuild(files)).revision);
});

test('grava o manifesto e carimba a revisão no sw.js publicado', () => {
  const dir = fakeBuild({ 'sw.js': "const BUILD = '__BUILD_REVISION__';", 'index.html': 'a' });
  const manifest = writePrecacheManifest(dir, { version: '9.9.9' });

  const written = JSON.parse(readFileSync(join(dir, 'precache-manifest.json'), 'utf8'));
  assert.equal(written.version, '9.9.9');

  const sw = readFileSync(join(dir, 'sw.js'), 'utf8');
  assert.equal(sw.includes('__BUILD_REVISION__'), false);
  assert.ok(sw.includes(`9.9.9-${manifest.revision}`));
});

test('isGameAsset reconhece as pastas pré-carregadas pela tela de loading', () => {
  assert.equal(isGameAsset('/models/kestrel.glb'), true);
  assert.equal(isGameAsset('/_nuxt/app.js'), false);
  assert.equal(isGameAsset('/icons/icon-192.png'), false);
});
