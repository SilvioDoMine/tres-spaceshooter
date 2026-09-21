/**
 * Mantém a tela acesa enquanto o jogo está aberto (Screen Wake Lock API).
 *
 * O navegador solta o bloqueio sozinho quando a aba vai para segundo plano,
 * então ele é pedido de novo toda vez que o jogo volta a ficar visível.
 * Suporte: Chrome/Android e Safari iOS 16.4+.
 */

const STORAGE_KEY = 'pwaWakeLock';

const enabled = ref(readFlag(STORAGE_KEY, true));
const active = ref(false);
let sentinel: WakeLockSentinel | null = null;
let listening = false;

function supportsWakeLock() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

async function acquire() {
  if (!supportsWakeLock() || !enabled.value || sentinel || document.visibilityState !== 'visible') return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    active.value = true;
    sentinel.addEventListener('release', () => {
      sentinel = null;
      active.value = false;
    });
  } catch {
    // Bateria baixa ou permissão negada pelo sistema: o jogo segue normalmente.
    active.value = false;
  }
}

async function release() {
  active.value = false;
  const current = sentinel;
  sentinel = null;
  try {
    await current?.release();
  } catch {
    // Já liberado pelo navegador.
  }
}

export function useWakeLock() {
  /** Liga os listeners globais. Chamado uma vez pelo plugin pwa.client.ts. */
  function setup() {
    if (listening || !supportsWakeLock()) return;
    listening = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') acquire();
    });
    acquire();
  }

  function setEnabled(value: boolean) {
    enabled.value = value;
    writeFlag(STORAGE_KEY, value);
    if (value) acquire();
    else release();
  }

  return {
    supported: supportsWakeLock(),
    enabled: computed({ get: () => enabled.value, set: setEnabled }),
    active: readonly(active),
    setup,
    setEnabled,
  };
}
