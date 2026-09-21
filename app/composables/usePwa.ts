/**
 * Instalação do jogo como aplicativo, service worker e armazenamento do save.
 *
 * - `canInstall` liga o botão "Instalar" (Android/desktop, evento beforeinstallprompt).
 * - `needsManualInstall` marca o iOS, onde a instalação é manual: Compartilhar →
 *   Adicionar à Tela de Início. Só instalado o Safari abre em tela cheia.
 * - `persisted` diz se o navegador prometeu não apagar o progresso sozinho.
 *   No iOS o Safari limpa dados de sites pouco usados; instalado, o save fica.
 * - `updateInstalling` marca a versão nova enquanto ela baixa: a tela de loading
 *   espera por ela (app.vue) para a troca caber ali, sem um segundo carregamento.
 * - `updateRequired` marca o release que não pode esperar momento conveniente
 *   (major bump, ou APP_MIN_VERSION no build) — ver plugins/pwa.client.ts.
 * - O service worker é registrado só em produção (em dev atrapalharia o HMR).
 */

const MANIFEST_URL = '/precache-manifest.json';
/** Quanto a tela de loading espera por uma versão nova antes de liberar o jogo. */
const INSTALL_HOLD_MS = 5000;

const installEvent = ref<BeforeInstallPromptEvent | null>(null);
const installed = ref(false);
const standalone = ref(false);
const iosDevice = ref(false);
const updateReady = ref(false);
const updateInstalling = ref(false);
const persisted = ref<boolean | null>(null);
const precacheTotal = ref(0);
const precacheLoaded = ref(0);
const precacheDone = ref(false);
const registration = shallowRef<ServiceWorkerRegistration | null>(null);
// Versão publicada no servidor e a partir de qual versão ela é obrigatória,
// lidas do precache-manifest.json.
const publishedVersion = ref<string | null>(null);
const minVersion = ref<string | null>(null);
let started = false;
// Uma troca de versão por carregamento: evita cair num ciclo de reloads.
let applying = false;
let installTimer: ReturnType<typeof setTimeout> | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function parseVersion(value: string | null | undefined) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value ?? '');
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/** true quando `version` é anterior a `floor`. Fora do formato vX.Y.Z (DEBUG), nunca. */
function isOlderThan(version: string | null, floor: string | null) {
  const current = parseVersion(version);
  const required = parseVersion(floor);
  if (!current || !required) return false;
  for (let part = 0; part < 3; part += 1) {
    if (current[part] !== required[part]) return current[part]! < required[part]!;
  }
  return false;
}

/** Versão publicada e piso de compatibilidade. O JSON é pequeno e sai sem cache. */
async function readManifest() {
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    publishedVersion.value = data.version ?? null;
    minVersion.value = data.minVersion ?? null;
  } catch {
    // Offline ou dev sem manifesto: fica para a próxima checagem.
  }
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches
    // Safari iOS não implementa display-mode: usa esta flag própria.
    || (navigator as { standalone?: boolean }).standalone === true;
}

function detectIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS se apresenta como Mac; o toque é o que o denuncia.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function usePwa() {
  const canInstall = computed(() => Boolean(installEvent.value) && !standalone.value);
  const needsManualInstall = computed(() => iosDevice.value && !standalone.value && !installEvent.value);
  const precacheProgress = computed(() => (precacheTotal.value ? precacheLoaded.value / precacheTotal.value : 0));

  // Release major (ou APP_MIN_VERSION no build) quebrou a compatibilidade com o
  // que está rodando aqui: a troca deixa de esperar um momento conveniente.
  // A versão em execução é lida agora (useRuntimeConfig precisa do contexto Nuxt),
  // não dentro do computed.
  const runningVersion = useAppVersion();
  const updateRequired = computed(() => isOlderThan(runningVersion, minVersion.value));

  /** Chamado uma vez pelo plugin pwa.client.ts. */
  function setup() {
    if (started || typeof window === 'undefined') return;
    started = true;

    iosDevice.value = detectIos();
    standalone.value = detectStandalone();
    installed.value = standalone.value;

    for (const query of ['(display-mode: standalone)', '(display-mode: fullscreen)']) {
      window.matchMedia(query).addEventListener('change', () => { standalone.value = detectStandalone(); });
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      // Segura o banner nativo para abrir no nosso botão, no momento certo.
      event.preventDefault();
      installEvent.value = event as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      installEvent.value = null;
      installed.value = true;
    });

    requestPersistentStorage();
    registerServiceWorker();
    // Em dev não há manifesto publicado (nem service worker) para consultar.
    if (!import.meta.dev) readManifest();
  }

  /** Abre o diálogo de instalação do navegador. Devolve true se o jogador aceitou. */
  async function install() {
    const event = installEvent.value;
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    installEvent.value = null;
    return outcome === 'accepted';
  }

  /**
   * Aplica a versão nova já baixada e recarrega o jogo.
   * Chamado sozinho pelo plugin num momento seguro; o toast só existe para
   * avisar quem está no meio de uma partida.
   */
  function applyUpdate() {
    const waiting = registration.value?.waiting;
    if (!waiting || applying) return;
    applying = true;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /** Pergunta ao servidor se saiu versão nova (o navegador só checa de vez em quando). */
  async function checkForUpdate() {
    await Promise.all([
      // Erro aqui é offline; o manifesto continua valendo a tentativa.
      registration.value?.update().catch(() => {}),
      readManifest(),
    ]);
  }

  /**
   * Pede ao navegador que o save não seja apagado por limpeza automática.
   * Chrome decide sozinho (sem diálogo); Safari concede ao app instalado.
   */
  async function requestPersistentStorage() {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null;
    try {
      persisted.value = await navigator.storage.persisted?.() ?? false;
      if (!persisted.value) persisted.value = await navigator.storage.persist();
      return persisted.value;
    } catch {
      return null;
    }
  }

  /** Espaço já usado e cota do navegador, em bytes. */
  async function storageEstimate() {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
    try {
      return await navigator.storage.estimate();
    } catch {
      return null;
    }
  }

  /**
   * Manda o service worker completar o download do jogo (o que a tela de loading
   * não cobriu). Chamado quando o preload termina, para o jogo abrir offline.
   */
  async function precacheAll() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      (navigator.serviceWorker.controller || reg.active)?.postMessage({ type: 'PRECACHE_ALL' });
    } catch {
      // Sem service worker (dev ou navegador sem suporte): o jogo roda online.
    }
  }

  return {
    canInstall,
    needsManualInstall,
    isStandalone: readonly(standalone),
    isInstalled: readonly(installed),
    isIos: readonly(iosDevice),
    updateReady: readonly(updateReady),
    updateInstalling: readonly(updateInstalling),
    updateRequired,
    publishedVersion: readonly(publishedVersion),
    persisted: readonly(persisted),
    precacheProgress,
    precacheDone: readonly(precacheDone),
    setup,
    install,
    applyUpdate,
    checkForUpdate,
    requestPersistentStorage,
    storageEstimate,
    precacheAll,
  };
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Em dev, tira da frente qualquer service worker de um build de produção rodado
  // na mesma origem: senão ele serviria o jogo antigo do cache e mataria o HMR.
  if (import.meta.dev) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister())).catch(() => {});
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'PRECACHE_PROGRESS') {
      precacheTotal.value = data.total;
      precacheLoaded.value = data.loaded;
    }
    if (data.type === 'PRECACHE_DONE') precacheDone.value = true;
  });

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      registration.value = reg;
      if (reg.waiting && navigator.serviceWorker.controller) updateReady.value = true;
      // O registro pode chegar com uma versão nova já baixando (aba reaberta logo
      // depois do deploy): a tela de loading espera por ela.
      watchInstalling(reg.installing);

      reg.addEventListener('updatefound', () => watchInstalling(reg.installing));
    })
    .catch(error => console.warn('[pwa] service worker não registrado', error));
}

/**
 * Acompanha a versão nova enquanto ela baixa.
 *
 * `updateInstalling` segura a tela de loading (app.vue) para a troca caber dentro
 * dela, em vez de recarregar o jogo logo depois de o jogador chegar ao lobby —
 * dois carregamentos seguidos. O teto de tempo existe porque a instalação pode
 * demorar ou nunca terminar, e abrir o jogo não pode ficar refém disso.
 */
function watchInstalling(worker: ServiceWorker | null) {
  // Sem controller é a primeira instalação: não há troca de versão a esperar.
  if (!worker || !navigator.serviceWorker.controller) return;

  const settle = () => {
    updateInstalling.value = false;
    if (installTimer) clearTimeout(installTimer);
    installTimer = null;
  };

  const check = () => {
    // Com um controller ativo, "installed" significa versão nova esperando a troca.
    if (worker.state === 'installed') updateReady.value = true;
    if (worker.state !== 'installing') settle();
  };

  if (worker.state === 'installing') {
    updateInstalling.value = true;
    if (installTimer) clearTimeout(installTimer);
    installTimer = setTimeout(settle, INSTALL_HOLD_MS);
  }

  worker.addEventListener('statechange', check);
  check();
}
