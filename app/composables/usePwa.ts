/**
 * Instalação do jogo como aplicativo, service worker e armazenamento do save.
 *
 * - `canInstall` liga o botão "Instalar" (Android/desktop, evento beforeinstallprompt).
 * - `needsManualInstall` marca o iOS, onde a instalação é manual: Compartilhar →
 *   Adicionar à Tela de Início. Só instalado o Safari abre em tela cheia.
 * - `persisted` diz se o navegador prometeu não apagar o progresso sozinho.
 *   No iOS o Safari limpa dados de sites pouco usados; instalado, o save fica.
 * - O service worker é registrado só em produção (em dev atrapalharia o HMR).
 */

const installEvent = ref<BeforeInstallPromptEvent | null>(null);
const installed = ref(false);
const standalone = ref(false);
const iosDevice = ref(false);
const updateReady = ref(false);
const persisted = ref<boolean | null>(null);
const precacheTotal = ref(0);
const precacheLoaded = ref(0);
const precacheDone = ref(false);
const registration = shallowRef<ServiceWorkerRegistration | null>(null);
let started = false;
// Uma troca de versão por carregamento: evita cair num ciclo de reloads.
let applying = false;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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
    try {
      await registration.value?.update();
    } catch {
      // Offline: fica para a próxima checagem.
    }
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

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          // Com um controller ativo, "installed" significa versão nova esperando a troca.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) updateReady.value = true;
        });
      });
    })
    .catch(error => console.warn('[pwa] service worker não registrado', error));
}
