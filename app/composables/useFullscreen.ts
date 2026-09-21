/**
 * Tela cheia e trava de orientação em retrato.
 *
 * Android/desktop: Fullscreen API + screen.orientation.lock('portrait').
 * iPhone: o Safari não expõe a Fullscreen API para a página — lá a tela cheia
 * só existe com o jogo instalado na tela de início (manifest display: standalone),
 * e o retrato é garantido pelo aviso de girar o aparelho (useOrientationGuard).
 *
 * Entrar em tela cheia exige gesto do jogador, então a preferência salva é
 * reaplicada no primeiro toque depois de abrir o jogo.
 */

const STORAGE_KEY = 'pwaFullscreen';

const enabled = ref(readFlag(STORAGE_KEY, false));
const isFullscreen = ref(false);
let listening = false;

type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
type FullscreenDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };

function supportsFullscreen() {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement as FullscreenElement;
  return typeof root.requestFullscreen === 'function' || typeof root.webkitRequestFullscreen === 'function';
}

function currentFullscreenElement() {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement || doc.webkitFullscreenElement || null;
}

/** Trava em retrato. Só vale onde a API existe (Android) e com a tela em fullscreen ou instalada. */
async function lockPortrait() {
  const orientation = typeof screen !== 'undefined' ? screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> } : null;
  if (!orientation?.lock) return false;
  try {
    await orientation.lock('portrait');
    return true;
  } catch {
    // Safari e Firefox recusam: o aviso de girar o aparelho cobre esses casos.
    return false;
  }
}

async function enterFullscreen() {
  if (!supportsFullscreen() || currentFullscreenElement()) return false;
  const root = document.documentElement as FullscreenElement;
  try {
    await (root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen!());
    await lockPortrait();
    return true;
  } catch {
    return false;
  }
}

async function exitFullscreen() {
  const doc = document as FullscreenDocument;
  if (!currentFullscreenElement()) return;
  try {
    await (doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.());
  } catch {
    // Alguns navegadores já saíram sozinhos (ex.: ao trocar de app).
  }
}

export function useFullscreen() {
  /** Liga os listeners globais. Chamado uma vez pelo plugin pwa.client.ts. */
  function setup() {
    if (listening || typeof document === 'undefined') return;
    listening = true;

    const sync = () => { isFullscreen.value = Boolean(currentFullscreenElement()); };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    sync();

    // Instalado na tela de início já abre sem barras: só falta travar o retrato.
    lockPortrait();

    if (enabled.value && supportsFullscreen()) {
      document.addEventListener('pointerdown', () => { enterFullscreen(); }, { once: true });
    }
  }

  function setEnabled(value: boolean) {
    enabled.value = value;
    writeFlag(STORAGE_KEY, value);
    if (value) enterFullscreen();
    else exitFullscreen();
  }

  return {
    supported: supportsFullscreen(),
    enabled: computed({ get: () => enabled.value, set: setEnabled }),
    isFullscreen: readonly(isFullscreen),
    setup,
    setEnabled,
    enterFullscreen,
    exitFullscreen,
    lockPortrait,
  };
}
