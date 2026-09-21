/**
 * Retrato obrigatório em celular e tablet — dentro ou fora do app instalado.
 *
 * Onde o navegador deixa, a orientação é travada de verdade (useFullscreen →
 * lockPortrait). Onde não deixa (Safari em especial), o jogo cobre a tela com o
 * aviso de girar o aparelho enquanto estiver deitado.
 *
 * A consulta exige ponteiro grosso e sem hover para não pegar desktop nem
 * notebook com touch, onde a janela larga é legítima.
 */

const QUERY = '(orientation: landscape) and (pointer: coarse) and (hover: none)';

const blocked = ref(false);
let media: MediaQueryList | null = null;

export function useOrientationGuard() {
  onMounted(() => {
    if (media) {
      blocked.value = media.matches;
      return;
    }
    media = window.matchMedia(QUERY);
    blocked.value = media.matches;
    media.addEventListener('change', (event) => {
      blocked.value = event.matches;
      // Voltou ao retrato: tenta prender nele (funciona em tela cheia no Android).
      if (!event.matches) useFullscreen().lockPortrait();
    });
  });

  return { blocked: readonly(blocked) };
}
