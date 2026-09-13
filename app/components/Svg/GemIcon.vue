<script setup lang="ts">
// Gema (moeda premium): esmeralda lapidada em facetas, com contorno escuro, reflexo e brilho.
withDefaults(defineProps<{ size?: number; sparkle?: boolean }>(), { size: 40, sparkle: true });

// Ids únicos por instância: vários ícones na tela não podem dividir os mesmos gradientes
const uid = useId();
const id = (name: string) => `gem-${uid}-${name}`;
</script>

<template>
  <svg class="gem-icon" xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient :id="id('table')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#b9ffc4" />
        <stop offset="0.55" stop-color="#5cf27a" />
        <stop offset="1" stop-color="#27c64e" />
      </linearGradient>
      <linearGradient :id="id('left')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3ee063" />
        <stop offset="1" stop-color="#16a03d" />
      </linearGradient>
      <linearGradient :id="id('right')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#22b84a" />
        <stop offset="1" stop-color="#0c7a2f" />
      </linearGradient>
      <linearGradient :id="id('bottom')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#13953a" />
        <stop offset="1" stop-color="#075c24" />
      </linearGradient>
      <radialGradient :id="id('glow')" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#9dffb0" stop-opacity="0.55" />
        <stop offset="1" stop-color="#9dffb0" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Brilho suave atrás -->
    <circle cx="32" cy="33" r="31" :fill="`url(#${id('glow')})`" />

    <!-- Sombra de apoio -->
    <ellipse cx="32" cy="57" rx="17" ry="3.2" fill="#03230d" opacity="0.35" />

    <!-- Silhueta com contorno escuro (hexágono de pé, topo mais largo) -->
    <path
      d="M20 8 H44 L58 22 L32 56 L6 22 Z"
      fill="#063d18"
      stroke="#063d18"
      stroke-width="5"
      stroke-linejoin="round"
    />

    <!-- Coroa: facetas superiores -->
    <path d="M20 8 L26 20 H6 Z" :fill="`url(#${id('left')})`" />
    <path d="M44 8 L38 20 H58 Z" :fill="`url(#${id('right')})`" />
    <path d="M20 8 H44 L38 20 H26 Z" :fill="`url(#${id('table')})`" />

    <!-- Pavilhão: facetas inferiores -->
    <path d="M6 22 H26 L32 56 Z" :fill="`url(#${id('left')})`" />
    <path d="M26 22 H38 L32 56 Z" :fill="`url(#${id('bottom')})`" />
    <path d="M38 22 H58 L32 56 Z" :fill="`url(#${id('right')})`" />

    <!-- Cintura (linha entre coroa e pavilhão) -->
    <path d="M6 21 H58 V23 H6 Z" fill="#8dff9f" opacity="0.55" />

    <!-- Arestas claras das facetas -->
    <path d="M26 20 L32 56 M38 20 L32 56 M20 8 L26 20 M44 8 L38 20" stroke="#c9ffd2" stroke-width="0.9" opacity="0.5" fill="none" />

    <!-- Reflexos -->
    <path d="M22.5 10.5 H33 L30 16 H25.3 Z" fill="#fff" opacity="0.85" />
    <path d="M10 24 H18 L25 44 Z" fill="#fff" opacity="0.28" />
    <circle cx="40" cy="12.5" r="1.6" fill="#fff" opacity="0.7" />

    <!-- Estrelinha de brilho -->
    <path
      v-if="sparkle"
      class="gem-icon__sparkle"
      d="M51 5 L52.4 9.6 L57 11 L52.4 12.4 L51 17 L49.6 12.4 L45 11 L49.6 9.6 Z"
      fill="#fff"
    />
  </svg>
</template>

<style scoped>
.gem-icon {
  display: inline-block;
  flex-shrink: 0;
  overflow: visible;
}
.gem-icon__sparkle {
  transform-origin: 51px 11px;
  animation: gem-sparkle 2.4s ease-in-out infinite;
}
@keyframes gem-sparkle {
  0%,
  60%,
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
  75% {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .gem-icon__sparkle {
    animation: none;
    opacity: 0.8;
  }
}
</style>
