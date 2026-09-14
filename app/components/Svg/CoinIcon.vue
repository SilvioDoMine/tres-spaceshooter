<script setup lang="ts">
// Ouro (moeda comum): tablete de ouro quadrado de cantos bem arredondados, com espessura, chanfro, miolo rebaixado e brilho.
withDefaults(defineProps<{ size?: number; sparkle?: boolean }>(), { size: 40, sparkle: false });

// Ids únicos por instância: vários ícones na tela não podem dividir os mesmos gradientes
const uid = useId();
const id = (name: string) => `coin-${uid}-${name}`;
</script>

<template>
  <svg class="coin-icon" xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <!-- Tablete girado 45°: nos gradientes, a diagonal (0,0)→(1,1) do quadrado vira a vertical da tela -->
    <defs>
      <linearGradient :id="id('top')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff480" />
        <stop offset="0.45" stop-color="#ffd519" />
        <stop offset="1" stop-color="#ffb300" />
      </linearGradient>
      <linearGradient :id="id('side')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.5" stop-color="#f29100" />
        <stop offset="1" stop-color="#b85a00" />
      </linearGradient>
      <linearGradient :id="id('bevel')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d98000" />
        <stop offset="0.55" stop-color="#f5b000" />
        <stop offset="1" stop-color="#fff39a" />
      </linearGradient>
      <linearGradient :id="id('face')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f2a900" />
        <stop offset="1" stop-color="#ffd21a" />
      </linearGradient>
    </defs>

    <!-- Sombra de apoio -->
    <ellipse cx="32" cy="60" rx="18" ry="2.6" fill="#3a1a00" opacity="0.3" />

    <!-- Contorno escuro da silhueta inteira (tampa + espessura) -->
    <g fill="#6e3200" stroke="#6e3200" stroke-width="5" stroke-linejoin="round">
      <rect x="-22" y="-22" width="44" height="44" rx="13" transform="translate(32 29) rotate(45)" />
      <rect x="-22" y="-22" width="44" height="44" rx="13" transform="translate(32 34) rotate(45)" />
      <rect x="6.3" y="29" width="51.4" height="5" />
    </g>

    <!-- Espessura: lateral mais escura aparecendo embaixo -->
    <rect x="-22" y="-22" width="44" height="44" rx="13" transform="translate(32 34) rotate(45)" :fill="`url(#${id('side')})`" />
    <rect x="6.3" y="29" width="51.4" height="5" fill="#f29100" />

    <g transform="translate(32 29) rotate(45)">
      <!-- Tampa -->
      <rect x="-22" y="-22" width="44" height="44" rx="13" :fill="`url(#${id('top')})`" />

      <!-- Rebaixo do miolo: chanfro escuro em cima e claro embaixo -->
      <rect x="-14" y="-14" width="28" height="28" rx="8" :fill="`url(#${id('bevel')})`" />
      <rect x="-10.5" y="-10.5" width="22" height="22" rx="6" :fill="`url(#${id('face')})`" />

      <!-- Reflexos na ponta de cima -->
      <path d="M-18.5 6 V-8 Q-18.5 -18.5 -8 -18.5 H6" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8" />
      <circle cx="11" cy="-18.5" r="1.5" fill="#fff" opacity="0.75" />
    </g>

    <!-- Estrelinha de brilho -->
    <path
      v-if="sparkle"
      class="coin-icon__sparkle"
      d="M52 3 L53.4 7.6 L58 9 L53.4 10.4 L52 15 L50.6 10.4 L46 9 L50.6 7.6 Z"
      fill="#fff"
    />
  </svg>
</template>

<style scoped>
.coin-icon {
  display: inline-block;
  flex-shrink: 0;
  overflow: visible;
}
.coin-icon__sparkle {
  transform-origin: 52px 9px;
  animation: coin-sparkle 2.4s ease-in-out infinite;
}
@keyframes coin-sparkle {
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
  .coin-icon__sparkle {
    animation: none;
    opacity: 0.8;
  }
}
</style>
