/**
 * Permissão de notificação e inscrição em Web Push.
 *
 * A permissão precisa partir de um toque do jogador (botão nas Configurações).
 * No iPhone/iPad só existe com o jogo instalado na tela de início (iOS 16.4+).
 *
 * A inscrição de push só acontece com `NUXT_PUBLIC_PUSH_PUBLIC_KEY` (chave VAPID
 * pública) definida no build; sem ela a permissão serve para avisos locais
 * disparados pelo próprio jogo. Havendo `NUXT_PUBLIC_PUSH_SUBSCRIBE_URL`, a
 * inscrição é enviada para esse endpoint.
 */

const STORAGE_KEY = 'pwaNotifications';

const enabled = ref(readFlag(STORAGE_KEY, false));
const permission = ref<NotificationPermission>('default');
const subscribed = ref(false);
const busy = ref(false);

function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/** Converte a chave VAPID (base64url) para o formato que o PushManager aceita. */
function decodeVapidKey(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const config = useRuntimeConfig().public;
  const publicKey = String(config.pushPublicKey || '');
  const subscribeUrl = String(config.pushSubscribeUrl || '');
  const { isIos, isStandalone } = usePwa();

  // No iOS a API de notificação nem aparece fora do app instalado.
  const requiresInstall = computed(() => isIos.value && !isStandalone.value);

  function sync() {
    if (!supportsNotifications()) return;
    permission.value = Notification.permission;
    if (permission.value !== 'granted') {
      subscribed.value = false;
      return;
    }
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager?.getSubscription())
      .then(sub => { subscribed.value = Boolean(sub); })
      .catch(() => { subscribed.value = false; });
  }

  /** Pede a permissão e, com chave VAPID configurada, inscreve para push. */
  async function enable() {
    if (!supportsNotifications() || busy.value) return false;
    busy.value = true;
    try {
      permission.value = await Notification.requestPermission();
      if (permission.value !== 'granted') {
        setEnabledFlag(false);
        return false;
      }

      setEnabledFlag(true);
      await subscribeToPush();
      return true;
    } catch {
      return false;
    } finally {
      busy.value = false;
    }
  }

  /** Cancela a inscrição. A permissão em si só o navegador revoga. */
  async function disable() {
    setEnabledFlag(false);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager?.getSubscription();
      await sub?.unsubscribe();
    } catch {
      // Sem inscrição ativa não há o que cancelar.
    }
    subscribed.value = false;
  }

  async function subscribeToPush() {
    if (!publicKey) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(publicKey),
      });
      subscribed.value = true;

      if (subscribeUrl) {
        await fetch(subscribeUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
      }
    } catch (error) {
      console.warn('[pwa] inscrição de push falhou', error);
    }
  }

  /** Aviso local do próprio jogo (não passa por servidor). */
  async function notify(title: string, options: NotificationOptions = {}) {
    if (!supportsNotifications() || Notification.permission !== 'granted') return false;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', ...options });
    return true;
  }

  function setEnabledFlag(value: boolean) {
    enabled.value = value;
    writeFlag(STORAGE_KEY, value);
  }

  return {
    supported: supportsNotifications(),
    requiresInstall,
    permission: readonly(permission),
    enabled: readonly(enabled),
    subscribed: readonly(subscribed),
    busy: readonly(busy),
    canUsePush: Boolean(publicKey),
    sync,
    enable,
    disable,
    notify,
  };
}
