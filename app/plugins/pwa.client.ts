/**
 * Liga as peças do app instalável assim que o jogo sobe:
 * service worker, armazenamento persistente do save, tela acesa e retrato.
 *
 * Quando a tela de loading termina, pede ao service worker para fechar o que
 * faltar do download — daí em diante o jogo abre offline.
 *
 * Atualização: o jogo se atualiza sozinho, sem o jogador pedir. O momento
 * preferido é a própria tela de loading — ali não existe partida para perder e a
 * troca não custa um segundo carregamento. Passado isso, espera sair da partida
 * e fechar os modais. Release marcado como incompatível não espera nada.
 */

import { modalStack } from '~/composables/useModal';

/** De quanto em quanto tempo perguntar ao servidor se saiu versão nova. */
const UPDATE_CHECK_MS = 15 * 60 * 1000;

/** Quanto o aviso de atualização obrigatória fica na tela antes do reinício. */
const REQUIRED_UPDATE_DELAY_MS = 4000;

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
  const inMatch = computed(() => router.currentRoute.value.path.startsWith('/play'));

  // Na tela de loading não há estado de jogo: trocar ali é de graça e evita que o
  // jogador carregue os ~25 MB para ser recarregado logo depois. Fora dela,
  // recarregar custaria a partida em andamento ou a animação de um baú.
  const safeToReload = computed(() =>
    !done.value
    || (modalStack.value.length === 0 && !inMatch.value),
  );

  // Um agendamento só: o watchEffect reavalia a cada navegação e modal aberto.
  let forcing = false;

  watchEffect(() => {
    if (!pwa.updateReady.value) return;
    if (safeToReload.value) {
      pwa.applyUpdate();
      return;
    }
    // Versão incompatível com a que está rodando: entra mesmo no meio da partida,
    // depois do aviso do AppUpdateToast.
    if (pwa.updateRequired.value && !forcing) {
      forcing = true;
      setTimeout(() => pwa.applyUpdate(), REQUIRED_UPDATE_DELAY_MS);
    }
  });

  // Sair da partida é o momento natural de buscar versão nova: é quando ela
  // poderia entrar sem atrapalhar nada.
  watch(inMatch, (playing, wasPlaying) => {
    if (wasPlaying && !playing) pwa.checkForUpdate();
  });

  // Quem deixa o jogo aberto por horas também recebe a versão nova:
  // procura por atualização ao voltar para o jogo e de tempos em tempos.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pwa.checkForUpdate();
  });
  setInterval(() => pwa.checkForUpdate(), UPDATE_CHECK_MS);
});
