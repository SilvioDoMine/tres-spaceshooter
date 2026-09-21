<script setup lang="ts">
// O Hyfight Spaceshooter é jogado em pé. Em celular e tablet deitados, este
// aviso cobre a tela até o aparelho voltar ao retrato (onde o navegador não
// deixa travar a orientação de verdade, este é o bloqueio).
const { blocked } = useOrientationGuard();
</script>

<template>
  <Transition name="orientation-fade">
    <div v-if="blocked" class="orientation-guard" role="alertdialog" aria-label="Gire o aparelho">
      <svg class="orientation-guard__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" stroke-width="1.6" />
        <path d="M10 19.2h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <path d="M3.6 8.4A9 9 0 0 1 6 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <path d="M2.4 5.6v3.2h3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M20.4 15.6A9 9 0 0 1 18 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <path d="M21.6 18.4v-3.2h-3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <p class="orientation-guard__title title-text">Gire o aparelho</p>
      <p class="orientation-guard__text">O Hyfight Spaceshooter só voa no modo retrato.</p>
    </div>
  </Transition>
</template>

<style scoped>
.orientation-guard {
  position: fixed;
  inset: 0;
  /* Acima da tela de loading (9999) para valer mesmo durante o carregamento */
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: #000814;
  color: #cfe6ff;
}

.orientation-guard__icon {
  width: 64px;
  height: 64px;
  color: #7cc7ff;
  animation: orientation-nudge 2.2s ease-in-out infinite;
}

.orientation-guard__title {
  font-size: 22px;
  color: #fff;
}

.orientation-guard__text {
  font-size: 15px;
  color: rgba(207, 230, 255, 0.75);
}

@keyframes orientation-nudge {
  0%, 55%, 100% { transform: rotate(0deg); }
  70%, 85% { transform: rotate(-90deg); }
}

@media (prefers-reduced-motion: reduce) {
  .orientation-guard__icon { animation: none; }
}

.orientation-fade-enter-active,
.orientation-fade-leave-active {
  transition: opacity 0.25s ease;
}

.orientation-fade-enter-from,
.orientation-fade-leave-to {
  opacity: 0;
}
</style>
