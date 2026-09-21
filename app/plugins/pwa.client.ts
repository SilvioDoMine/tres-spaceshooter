/**
 * Liga as peças do app instalável assim que o jogo sobe:
 * service worker, armazenamento persistente do save, tela acesa e retrato.
 *
 * Quando a tela de loading termina, pede ao service worker para fechar o que
 * faltar do download — daí em diante o jogo abre offline.
 */

export default defineNuxtPlugin(() => {
  const pwa = usePwa();
  pwa.setup();

  useWakeLock().setup();
  useFullscreen().setup();
  usePushNotifications().sync();

  const { done } = useAssetPreloader();
  watch(done, (ready) => {
    if (ready) pwa.precacheAll();
  }, { immediate: true });
});
