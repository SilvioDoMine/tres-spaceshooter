/**
 * Testa public/sw.js num service worker de mentira.
 *
 * O que está coberto é o que quebrou em produção sem ninguém ver: um asset que
 * muda de conteúdo mantendo o caminho continuava sendo servido velho, e os ~26 MB
 * da primeira visita eram baixados duas vezes (tela de loading + PRECACHE_ALL).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const SOURCE = readFileSync(fileURLToPath(new URL('../public/sw.js', import.meta.url)), 'utf8');
const ORIGIN = 'https://jogo.test';

/** Deixa as promessas soltas do sw.js (keepCopy) terminarem. */
const settle = () => new Promise(resolve => setTimeout(resolve, 10));

function absolute(key) {
  return new URL(typeof key === 'string' ? key : key.url, ORIGIN).href;
}

/** Cache Storage o suficiente para o que o sw.js usa. */
function createCaches() {
  const stores = new Map();

  const openStore = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      match: async key => entries.get(absolute(key))?.clone(),
      put: async (key, response) => { entries.set(absolute(key), response); },
      delete: async (key) => entries.delete(absolute(key)),
      keys: async () => [...entries.keys()].map(url => ({ url })),
    };
  };

  return {
    stores,
    api: {
      open: async name => openStore(name),
      keys: async () => [...stores.keys()],
      delete: async (name) => stores.delete(name),
      match: async (key, { cacheName } = {}) => stores.get(cacheName)?.get(absolute(key))?.clone(),
    },
  };
}

/**
 * Sobe o service worker sobre um "servidor" (url -> conteúdo) e devolve os
 * gatilhos de install/activate/fetch/message mais a contagem de downloads.
 */
function boot({ server, caches, active = false }) {
  const listeners = new Map();
  const fetched = [];

  const self = {
    location: { origin: ORIGIN },
    registration: { active: active ? {} : null, showNotification: async () => {} },
    clients: { claim: async () => {}, matchAll: async () => [] },
    skipWaiting: async () => {},
    addEventListener: (type, handler) => listeners.set(type, handler),
  };

  const fetchMock = async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url, ORIGIN);
    fetched.push(url.pathname);
    const body = server.get(url.pathname);
    // Fora do servidor = sem rede: o fetch de um service worker rejeita, não devolve 404.
    if (body === undefined) throw new TypeError('failed to fetch');
    const response = new Response(body, { status: 200, headers: { 'content-type': 'application/octet-stream' } });
    // O sw.js só guarda resposta `basic` (mesma origem); em Node o padrão é 'default'.
    Object.defineProperty(response, 'type', { value: 'basic' });
    return response;
  };

  new Function('self', 'caches', 'fetch', 'console', SOURCE)(self, caches, fetchMock, {
    info: () => {}, warn: () => {}, error: () => {},
  });

  const lifecycle = async (type) => {
    const pending = [];
    await listeners.get(type)({ waitUntil: promise => pending.push(promise) });
    await Promise.all(pending);
  };

  return {
    fetched,
    install: () => lifecycle('install'),
    activate: () => lifecycle('activate'),
    /** Devolve o corpo entregue à página, como ela o receberia. */
    request: async (pathname, mode = 'no-cors') => {
      let answer;
      const pending = [];
      await listeners.get('fetch')({
        request: { url: `${ORIGIN}${pathname}`, method: 'GET', mode },
        respondWith: promise => { answer = promise; },
        waitUntil: promise => pending.push(promise),
      });
      const response = await answer;
      await Promise.all(pending);
      await settle();
      return response.text();
    },
    message: async (data) => {
      const pending = [];
      const posted = [];
      await listeners.get('message')({
        data,
        source: { postMessage: value => posted.push(value) },
        waitUntil: promise => pending.push(promise),
      });
      await Promise.all(pending);
      return posted;
    },
  };
}

/** Servidor com um manifesto coerente com os arquivos declarados. */
function createServer(files, { version = 'v1.0.0' } = {}) {
  const rev = value => `rev-${value.length}-${value.charCodeAt(0)}`;
  const entry = url => ({ url, rev: rev(files[url]), size: files[url].length });

  const shell = Object.keys(files).filter(url => !url.startsWith('/images/')).map(entry);
  const assets = Object.keys(files).filter(url => url.startsWith('/images/')).map(entry);

  const server = new Map(Object.entries(files));
  server.set('/', '<html>shell</html>');
  server.set('/precache-manifest.json', JSON.stringify({ version, minVersion: null, revision: version, shell, assets }));
  return server;
}

const FIRST_BUILD = {
  '/index.html': '<html>v1</html>',
  '/_nuxt/app.js': 'código v1',
  '/images/nave.png': 'pixels v1',
  '/images/hud.png': 'hud igual nos dois builds',
};

test('a primeira instalação guarda o shell e deixa os assets para a tela de loading', async () => {
  const server = createServer(FIRST_BUILD);
  const { api } = createCaches();
  const sw = boot({ server, caches: api });

  await sw.install();

  assert.ok(sw.fetched.includes('/_nuxt/app.js'), 'o shell entra no cache na instalação');
  // Os ~26 MB estão sendo baixados agora mesmo pela tela de loading: pedi-los aqui
  // dobraria o download da primeira visita.
  assert.equal(sw.fetched.includes('/images/nave.png'), false);
});

test('o que a tela de loading baixa fica guardado com o seu rev e não é baixado de novo', async () => {
  const server = createServer(FIRST_BUILD);
  const { api } = createCaches();
  const sw = boot({ server, caches: api });

  await sw.install();
  await sw.activate();

  // A tela de loading baixando os assets do jogo.
  assert.equal(await sw.request('/images/nave.png'), 'pixels v1');
  assert.equal(await sw.request('/images/hud.png'), 'hud igual nos dois builds');

  const before = sw.fetched.filter(url => url.startsWith('/images/')).length;
  assert.equal(before, 2);

  // PRECACHE_ALL no fim do preload: só completa o que faltou, não rebaixa nada.
  const posted = await sw.message({ type: 'PRECACHE_ALL' });
  assert.equal(sw.fetched.filter(url => url.startsWith('/images/')).length, before);
  assert.ok(posted.some(message => message.type === 'PRECACHE_DONE'));
});

test('um asset que mudou de conteúdo vale já na sessão seguinte à troca', async () => {
  const stores = createCaches();
  const first = createServer(FIRST_BUILD);
  const sw = boot({ server: first, caches: stores.api });

  await sw.install();
  await sw.activate();
  await sw.request('/images/nave.png');
  await sw.request('/images/hud.png');
  await sw.message({ type: 'PRECACHE_ALL' });

  // Deploy novo: a nave foi redesenhada, o HUD não mudou.
  const second = createServer({ ...FIRST_BUILD, '/images/nave.png': 'pixels v2 (arte nova)' }, { version: 'v1.0.1' });
  const next = boot({ server: second, caches: stores.api, active: true });

  await next.install();
  await next.activate();

  // Cache-first entregava o desenho velho até o fim do loading — quando o jogo
  // já o havia carregado na memória. Agora a entrada sai do cache no activate.
  assert.equal(await next.request('/images/nave.png'), 'pixels v2 (arte nova)');
  // E o que não mudou continua no cache, sem voltar à rede.
  assert.equal(await next.request('/images/hud.png'), 'hud igual nos dois builds');
  assert.equal(next.fetched.includes('/images/hud.png'), false);
});

test('a instalação de uma versão nova não troca os assets debaixo de quem está jogando', async () => {
  const stores = createCaches();
  const first = createServer(FIRST_BUILD);
  const sw = boot({ server: first, caches: stores.api });

  await sw.install();
  await sw.activate();
  await sw.request('/images/nave.png');

  const second = createServer(
    { ...FIRST_BUILD, '/images/nave.png': 'pixels v2 (arte nova)', '/images/chefe.png': 'inimigo novo' },
    { version: 'v1.0.1' },
  );
  const next = boot({ server: second, caches: stores.api, active: true });

  // Só o install: a versão antiga continua controlando a página aberta.
  await next.install();

  assert.equal(await sw.request('/images/nave.png'), 'pixels v1', 'a sessão em andamento segue com o asset que carregou');
  assert.ok(next.fetched.includes('/images/chefe.png'), 'mas o que é só novo já entra no cache');
});

test('assets que saíram do manifesto deixam o cache na troca de versão', async () => {
  const stores = createCaches();
  const first = createServer(FIRST_BUILD);
  const sw = boot({ server: first, caches: stores.api });

  await sw.install();
  await sw.activate();
  await sw.request('/images/nave.png');
  await sw.message({ type: 'PRECACHE_ALL' });

  const remaining = { ...FIRST_BUILD };
  delete remaining['/images/nave.png'];
  const second = createServer(remaining, { version: 'v1.0.1' });
  const next = boot({ server: second, caches: stores.api, active: true });

  await next.install();
  await next.activate();

  const cached = [...stores.stores.get('spaceshooter-v1').keys()];
  assert.equal(cached.includes(`${ORIGIN}/images/nave.png`), false);
  assert.ok(cached.includes(`${ORIGIN}/images/hud.png`));
});

test('navegação vai à rede e cai no shell guardado quando não há rede', async () => {
  const server = createServer(FIRST_BUILD);
  const { api } = createCaches();
  const sw = boot({ server, caches: api });

  await sw.install();
  assert.equal(await sw.request('/', 'navigate'), '<html>shell</html>');

  // Sem rede: o shell sai do servidor e o cache responde no lugar.
  server.delete('/');
  server.delete('/lobby');
  assert.equal(await sw.request('/lobby', 'navigate'), '<html>shell</html>');
});
