/**
 * useMobileGestureLock - Bloqueia gestos nativos do navegador mobile
 *
 * Previne:
 * - Pull to refresh
 * - Overscroll bounce
 * - Zoom com pinch (mas permite cliques normais)
 *
 * PERMITE:
 * - Cliques e taps normais
 * - Interação com botões, inputs, etc
 * - Scroll dentro de elementos com classe .allow-scroll
 *
 * Compatível com Android e iOS
 */

import { onMounted, onUnmounted } from 'vue';

export function useMobileGestureLock() {
  let touchStartY = 0;

  /**
   * Previne pull to refresh e overscroll bounce
   * MAS permite taps/cliques normais
   */
  const preventPullToRefresh = (e: TouchEvent) => {
    const target = e.target as HTMLElement;

    // Permite scroll em elementos com .allow-scroll
    if (target.closest('.allow-scroll')) {
      return;
    }

    // Se é um movimento (touchmove), bloqueia
    if (e.type === 'touchmove') {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;

      // Previne pull to refresh (arrastar para baixo no topo)
      if (scrollY <= 0 && deltaY > 0) {
        e.preventDefault();
      }
    }
  };

  /**
   * Guarda posição inicial do touch
   */
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }

    // Previne zoom com pinch (2+ dedos)
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  onMounted(() => {
    if (import.meta.server) return;

    // Previne pull to refresh e overscroll
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
  });

  onUnmounted(() => {
    if (import.meta.server) return;

    document.removeEventListener('touchmove', preventPullToRefresh);
    document.removeEventListener('touchstart', handleTouchStart);
  });

  return {};
}
