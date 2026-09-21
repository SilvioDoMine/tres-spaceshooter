/**
 * Service worker do Hyfight Spaceshooter.
 *
 * - Instala o shell (HTML, JS, CSS, ícones) e serve tudo cache-first, então o
 *   jogo abre offline e sem esperar rede depois da primeira visita.
 * - Os ~25 MB de imagens, modelos, sons e fontes entram no cache enquanto a
 *   tela de loading os baixa; o app manda PRECACHE_ALL no fim para completar
 *   o que faltar. Nada é baixado duas vezes.
 * - Entre deploys só volta à rede o arquivo cujo `rev` mudou no
 *   precache-manifest.json (gerado no build por scripts/precache-manifest.mjs).
 */

// Trocado no build pela revisão do precache-manifest (scripts/precache-manifest.mjs).
// É o que faz o navegador enxergar um service worker novo a cada deploy: sem isso,
// um sw.js byte a byte idêntico nunca reinstala e o cache nunca se atualiza.
const BUILD = '__BUILD_REVISION__';

const CACHE_NAME = 'spaceshooter-v1';
const MANIFEST_URL = '/precache-manifest.json';
// Entrada sintética dentro do cache com o mapa url -> rev do que já está guardado.
const INDEX_URL = '/__precache-index';
// Resposta de navegação (o shell HTML da SPA) guardada sob a raiz.
const SHELL_URL = '/';
const BATCH_SIZE = 6;

/** Fila: install e PRECACHE_ALL nunca mexem no índice ao mesmo tempo. */
let queue = Promise.resolve();
function serial(task) {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

async function readIndex(cache) {
  try {
    const response = await cache.match(INDEX_URL);
    return response ? await response.json() : {};
  } catch {
    return {};
  }
}

async function writeIndex(cache, index) {
  await cache.put(INDEX_URL, new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json' } }));
}

async function fetchManifest() {
  const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`manifesto ${response.status}`);
  return response.json();
}

/**
 * Baixa e guarda os arquivos que faltam ou mudaram de rev.
 * Um arquivo quebrado não derruba o lote inteiro: fica para a próxima tentativa.
 */
async function precache(files, { onProgress } = {}) {
  const cache = await caches.open(CACHE_NAME);
  const index = await readIndex(cache);

  const pending = [];
  for (const file of files) {
    const cached = index[file.url] === file.rev && (await cache.match(file.url));
    if (!cached) pending.push(file);
  }

  let done = 0;
  const report = () => onProgress?.({ loaded: done, total: pending.length });
  report();

  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    const batch = pending.slice(start, start + BATCH_SIZE);
    await Promise.all(batch.map(async (file) => {
      try {
        const response = await fetch(file.url, { cache: 'reload', credentials: 'same-origin' });
        if (response.ok) {
          await cache.put(file.url, response.clone());
          index[file.url] = file.rev;
        }
      } catch {
        // Offline ou arquivo indisponível: tenta de novo na próxima abertura.
      }
      done += 1;
      report();
    }));
    await writeIndex(cache, index);
  }

  await writeIndex(cache, index);
  return pending.length;
}

/** Tira do cache o que saiu do manifesto (assets de builds antigos). */
async function dropStale(manifest) {
  const cache = await caches.open(CACHE_NAME);
  const index = await readIndex(cache);
  const valid = new Set([...manifest.shell, ...manifest.assets].map(file => file.url));
  valid.add(SHELL_URL);
  valid.add(INDEX_URL);

  for (const request of await cache.keys()) {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || valid.has(url.pathname)) continue;
    await cache.delete(request);
    delete index[url.pathname];
  }
  await writeIndex(cache, index);
}

async function cacheShellDocument() {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(SHELL_URL, { cache: 'reload', credentials: 'same-origin' });
    if (response.ok) await cache.put(SHELL_URL, response.clone());
  } catch {
    // Sem rede na instalação: o fetch handler guarda o shell na primeira navegação online.
  }
}

self.addEventListener('install', (event) => {
  console.info(`[sw] instalando build ${BUILD}`);
  event.waitUntil(serial(async () => {
    try {
      const manifest = await fetchManifest();
      await cacheShellDocument();
      await precache(manifest.shell);
    } catch {
      // Sem manifesto (dev, deploy a meio caminho) o SW ainda funciona como cache de runtime.
    }
    // Primeira instalação: assume o controle na hora. Com uma versão antiga rodando,
    // espera o app pedir (SKIP_WAITING) para não trocar os chunks debaixo da partida.
    if (!self.registration.active) await self.skipWaiting();
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(serial(async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    try {
      await dropStale(await fetchManifest());
    } catch {
      // Sem manifesto não dá para saber o que é obsoleto: mantém tudo.
    }
    await self.clients.claim();
  }));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === MANIFEST_URL) return;

  // Navegação: rede primeiro (pega deploy novo), shell do cache quando offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(SHELL_URL, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(SHELL_URL, { cacheName: CACHE_NAME });
        if (cached) return cached;
        throw new Error('offline');
      }
    })());
    return;
  }

  // Demais arquivos: cache primeiro; o que vier da rede já fica guardado
  // (é assim que a tela de loading preenche o cache sem baixar nada duas vezes).
  event.respondWith((async () => {
    const cached = await caches.match(request, { cacheName: CACHE_NAME });
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  const source = event.source;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Chamado quando a tela de loading termina: completa o que ela não baixou.
  if (data.type === 'PRECACHE_ALL') {
    event.waitUntil(serial(async () => {
      try {
        const manifest = await fetchManifest();
        const files = [...manifest.shell, ...manifest.assets];
        await precache(files, {
          onProgress: ({ loaded, total }) => source?.postMessage({ type: 'PRECACHE_PROGRESS', loaded, total }),
        });
        source?.postMessage({ type: 'PRECACHE_DONE', version: manifest.version });
      } catch (error) {
        source?.postMessage({ type: 'PRECACHE_FAILED', reason: String(error) });
      }
    }));
  }
});

/**
 * Notificações enviadas pelo servidor (Web Push).
 * Sem payload — ou com payload inválido — mostra um aviso genérico.
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || 'Hyfight Spaceshooter';
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || 'Sua nave está pronta para decolar.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    tag: payload.tag || 'spaceshooter',
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if (client.url === target && 'focus' in client) return client.focus();
    }
    const existing = clientList[0];
    if (existing && 'focus' in existing) {
      await existing.focus();
      if ('navigate' in existing) await existing.navigate(target);
      return;
    }
    await self.clients.openWindow(target);
  })());
});
