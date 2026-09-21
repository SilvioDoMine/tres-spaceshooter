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
 *
 * Cada resposta guardada leva o seu `rev` no header `x-precache-rev`. É assim que
 * o service worker sabe o que já está em dia sem manter um índice à parte: um
 * índice separado só era escrito pelo precache, nunca pelo fetch handler, então
 * o que a tela de loading baixava aparecia como ausente e era baixado de novo.
 */

// Trocado no build pela revisão do precache-manifest (scripts/precache-manifest.mjs).
// É o que faz o navegador enxergar um service worker novo a cada deploy: sem isso,
// um sw.js byte a byte idêntico nunca reinstala e o cache nunca se atualiza.
const BUILD = '__BUILD_REVISION__';

const CACHE_NAME = 'spaceshooter-v1';
const MANIFEST_URL = '/precache-manifest.json';
// Revisão do arquivo, carimbada na resposta guardada.
const REV_HEADER = 'x-precache-rev';
// Resposta de navegação (o shell HTML da SPA) guardada sob a raiz.
const SHELL_URL = '/';
const BATCH_SIZE = 6;

/** Fila: install, activate e PRECACHE_ALL nunca mexem no cache ao mesmo tempo. */
let queue = Promise.resolve();
function serial(task) {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

/** url -> rev do manifesto deste build, para o fetch handler carimbar o que guarda. */
let revs = null;
let manifestPromise = null;

/**
 * Manifesto do build, buscado uma vez por vida do service worker.
 * Um erro não fica memoizado: offline agora não impede tentar de novo depois.
 */
function manifest() {
  manifestPromise ??= (async () => {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`manifesto ${response.status}`);
    const data = await response.json();
    revs = new Map([...data.shell, ...data.assets].map(file => [file.url, file.rev]));
    return data;
  })().catch((error) => {
    manifestPromise = null;
    throw error;
  });
  return manifestPromise;
}

async function revFor(pathname) {
  if (!revs) {
    try {
      await manifest();
    } catch {
      return null;
    }
  }
  return revs?.get(pathname) ?? null;
}

/** Guarda a resposta com o `rev` carimbado no header. */
async function cachePut(cache, key, response, rev) {
  const headers = new Headers(response.headers);
  if (rev) headers.set(REV_HEADER, rev);
  const init = { status: response.status, statusText: response.statusText, headers };

  let copy;
  try {
    // Stream: os modelos e sons são grandes e a tela de loading baixa tudo de uma vez.
    copy = new Response(response.body, init);
  } catch {
    // Navegador que não aceita stream no construtor de Response.
    copy = new Response(await response.blob(), init);
  }
  await cache.put(key, copy);
}

/**
 * Baixa e guarda os arquivos que faltam ou mudaram de rev.
 * Um arquivo quebrado não derruba o lote inteiro: fica para a próxima tentativa.
 *
 * `onlyMissing` pula o que já está guardado mesmo com rev diferente: na instalação
 * de uma versão nova o service worker antigo ainda serve a sessão aberta, e
 * sobrescrever um arquivo ali trocaria o asset debaixo de quem está jogando.
 */
async function precache(files, { onProgress, onlyMissing = false } = {}) {
  const cache = await caches.open(CACHE_NAME);

  const pending = [];
  for (const file of files) {
    const cached = await cache.match(file.url);
    if (!cached) pending.push(file);
    else if (!onlyMissing && cached.headers.get(REV_HEADER) !== file.rev) pending.push(file);
  }

  let done = 0;
  const report = () => onProgress?.({ loaded: done, total: pending.length });
  report();

  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    const batch = pending.slice(start, start + BATCH_SIZE);
    await Promise.all(batch.map(async (file) => {
      try {
        const response = await fetch(file.url, { cache: 'reload', credentials: 'same-origin' });
        if (response.ok) await cachePut(cache, file.url, response, file.rev);
      } catch {
        // Offline ou arquivo indisponível: tenta de novo na próxima abertura.
      }
      done += 1;
      report();
    }));
  }

  return pending.length;
}

/**
 * Tira do cache o que saiu do manifesto (assets de builds antigos) e o que
 * continua no manifesto com conteúdo novo.
 *
 * A segunda parte é o que faz o deploy valer já nesta sessão: cache-first, um
 * `/models/x.glb` redesenhado mantendo o mesmo caminho seria servido velho até
 * o PRECACHE_ALL do fim da tela de loading — tarde demais, o jogo já o carregou.
 */
async function dropStale(data) {
  const cache = await caches.open(CACHE_NAME);
  const expected = new Map([...data.shell, ...data.assets].map(file => [file.url, file.rev]));

  for (const request of await cache.keys()) {
    const url = new URL(request.url);
    // O shell de navegação é guardado sob a raiz e revalidado a cada abertura.
    if (url.origin !== self.location.origin || url.pathname === SHELL_URL) continue;

    const rev = expected.get(url.pathname);
    if (rev === undefined) {
      await cache.delete(request);
      continue;
    }

    const cached = await cache.match(request);
    if (cached?.headers.get(REV_HEADER) !== rev) await cache.delete(request);
  }
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
      const data = await manifest();
      await cacheShellDocument();

      // Primeira instalação: só o shell. Os assets do jogo estão sendo baixados
      // agora mesmo pela tela de loading e o fetch handler já os guarda — pedi-los
      // aqui dobraria os ~25 MB.
      // Atualização: o cache já tem os assets, então isto é só o delta de arquivos
      // novos do release. Os que mudaram saem no activate, depois da troca.
      const updating = Boolean(self.registration.active);
      await precache(updating ? [...data.shell, ...data.assets] : data.shell, { onlyMissing: true });
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
      await dropStale(await manifest());
    } catch {
      // Sem manifesto não dá para saber o que é obsoleto: mantém tudo.
    }
    await self.clients.claim();
  }));
});

/** Guarda o que veio da rede, fora do caminho da resposta (não atrasa o jogo). */
function keepCopy(key, pathname, response) {
  (async () => {
    try {
      const rev = await revFor(pathname);
      const cache = await caches.open(CACHE_NAME);
      await cachePut(cache, key, response, rev);
    } catch {
      // Cota estourada ou manifesto indisponível: o arquivo volta pela rede.
    }
  })();
}

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

  // Demais arquivos: cache primeiro; o que vier da rede já fica guardado com o
  // seu rev (é assim que a tela de loading preenche o cache sem baixar nada
  // duas vezes). O que estava desatualizado já saiu do cache no activate.
  event.respondWith((async () => {
    const cached = await caches.match(request, { cacheName: CACHE_NAME });
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type === 'basic') keepCopy(request, url.pathname, response.clone());
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
        const current = await manifest();
        const files = [...current.shell, ...current.assets];
        await precache(files, {
          onProgress: ({ loaded, total }) => source?.postMessage({ type: 'PRECACHE_PROGRESS', loaded, total }),
        });
        source?.postMessage({ type: 'PRECACHE_DONE', version: current.version });
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
