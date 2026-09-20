<script setup lang="ts">
// Experiência (EXP): orbe de energia azul com contorno escuro, estrela de nível no miolo, reflexo e brilho.
withDefaults(defineProps<{ size?: number; sparkle?: boolean }>(), { size: 40, sparkle: true });

// Ids únicos por instância: vários ícones na tela não podem dividir os mesmos gradientes
const uid = useId();
const id = (name: string) => `exp-${uid}-${name}`;
</script>

<template>
  <svg class="exp-icon" xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient :id="id('orb')" cx="0.36" cy="0.28" r="0.78">
        <stop offset="0" stop-color="#d8f4ff" />
        <stop offset="0.3" stop-color="#6fc4ff" />
        <stop offset="0.68" stop-color="#2f7ef0" />
        <stop offset="1" stop-color="#1338a8" />
      </radialGradient>
      <linearGradient :id="id('label')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="0.55" stop-color="#dff2ff" />
        <stop offset="1" stop-color="#8fd4ff" />
      </linearGradient>
      <radialGradient :id="id('glow')" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#8fd8ff" stop-opacity="0.55" />
        <stop offset="1" stop-color="#8fd8ff" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Brilho suave atrás -->
    <circle cx="32" cy="31" r="31" :fill="`url(#${id('glow')})`" />

    <!-- Sombra de apoio -->
    <ellipse cx="32" cy="60" rx="18" ry="2.8" fill="#04123a" opacity="0.35" />

    <!-- Orbe com contorno escuro -->
    <circle cx="32" cy="31" r="26.5" fill="#102a6b" stroke="#102a6b" stroke-width="5" />
    <circle cx="32" cy="31" r="26.5" :fill="`url(#${id('orb')})`" />

    <!-- Aro interno de energia -->
    <circle cx="32" cy="31" r="22.5" fill="none" stroke="#bfe8ff" stroke-width="1.3" opacity="0.35" />

    <!-- Estrela de fundo, bem fraca, só para dar profundidade atrás do texto -->
    <path
      d="M32 10 Q34.8 25.5 51.5 31 Q34.8 36.5 32 52 Q29.2 36.5 12.5 31 Q29.2 25.5 32 10 Z"
      fill="#dff2ff"
      opacity="0.22"
    />

    <!-- Reflexos do vidro do orbe (acima do texto, para não competir com a leitura) -->
    <ellipse cx="22" cy="16.5" rx="9" ry="5" fill="#fff" opacity="0.5" transform="rotate(-32 22 16.5)" />
    <circle cx="44" cy="15.5" r="1.9" fill="#fff" opacity="0.6" />
    <path d="M11.5 37 Q16 50 29 55" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.22" />

    <!-- EXP: contorno escuro grosso por baixo do preenchimento (paint-order) para ler em qualquer tamanho.
         textLength trava a largura, então não estoura o orbe se a fonte do jogo ainda não carregou. -->
    <text
      class="exp-icon__label"
      x="32"
      y="39.5"
      text-anchor="middle"
      textLength="39"
      lengthAdjust="spacingAndGlyphs"
      font-size="23"
      :fill="`url(#${id('label')})`"
      stroke="#102a6b"
      stroke-width="6"
      stroke-linejoin="round"
      paint-order="stroke"
    >EXP</text>

    <!-- Estrelinha de brilho -->
    <path
      v-if="sparkle"
      class="exp-icon__sparkle"
      d="M52 4 L53.4 8.6 L58 10 L53.4 11.4 L52 16 L50.6 11.4 L46 10 L50.6 8.6 Z"
      fill="#fff"
    />
  </svg>
</template>

<style scoped>
.exp-icon {
  display: inline-block;
  flex-shrink: 0;
  overflow: visible;
}
.exp-icon__label {
  font-family: 'Lilita One', 'Fredoka One', sans-serif;
  letter-spacing: -0.5px;
}
.exp-icon__sparkle {
  transform-origin: 52px 10px;
  animation: exp-sparkle 2.4s ease-in-out infinite;
}
@keyframes exp-sparkle {
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
  .exp-icon__sparkle {
    animation: none;
    opacity: 0.8;
  }
}
</style>
