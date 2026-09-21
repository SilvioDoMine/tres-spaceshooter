/**
 * Liga as peças do app instalável assim que o jogo sobe:
 * service worker, armazenamento persistente do save, tela acesa e retrato.
 *
 * Quando a tela de loading termina, pede ao service worker para fechar o que
 * faltar do download — daí em diante o jogo abre offline.
 *
 * Atualização: o jogo se atualiza sozinho, sem o jogador pedir. A troca espera
 * um momento seguro (fora de partida, sem modal aberto e com o preload pronto),
 * para não recarregar no meio de uma run nem durante a abertura de um baú.
 */

import { modalStack } from '~/composables/useModal';

/** De quanto em quanto tempo perguntar ao servidor se saiu versão nova. */
const UPDATE_CHECK_MS = 15 * 60 * 1000;

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

  const router = useRouter();

  // Recarregar aqui custaria a partida em andamento ou a animação de um baú
  const safeToReload = computed(() =>
    done.value
    && modalStack.value.length === 0
    && !router.currentRoute.value.path.startsWith('/play'),
  );

  watchEffect(() => {
    if (pwa.updateReady.value && safeToReload.value) pwa.applyUpdate();
  });

  // Quem deixa o jogo aberto por horas também recebe a versão nova:
  // procura por atualização ao voltar para o jogo e de tempos em tempos.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pwa.checkForUpdate();
  });
  setInterval(() => pwa.checkForUpdate(), UPDATE_CHECK_MS);
});
