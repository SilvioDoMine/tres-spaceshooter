<script setup>
defineProps({
  /**
   * Variante de cor do card
   */
  variant: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'yellow', 'red', 'green', 'orange', 'gray'].includes(value)
  },
  /**
   * Opacidade do padrão de xadrez (0 a 1)
   */
  checkersOpacity: {
    type: Number,
    default: 0.07
  },
  /**
   * Tamanho de cada quadrado do xadrez (em pixels)
   */
  checkersSize: {
    type: Number,
    default: 50
  },
  /**
   * Cor do padrão (RGB)
   */
  checkersColor: {
    type: String,
    default: '255,255,255'
  },
  /**
   * Padding do card
   */
  padding: {
    type: String,
    default: 'p-1'
  },
  /**
   * Título do header (opcional)
   */
  header: {
    type: String,
    default: null
  }
})
</script>

<template>
  <!-- Card colorido no estilo das cartas de habilidade: contorno escuro, sombra dura, brilho no topo -->
  <div
    class="checkers-card"
    :class="[
      `checkers-card--${variant}`,
      padding
    ]"
  >
    <!-- Checkers background pattern -->
    <div
      class="absolute inset-0 bg-center pointer-events-none"
      :style="{
        backgroundImage: `
          linear-gradient(135deg, rgba(${checkersColor}, ${checkersOpacity}) 25%, transparent 25%),
          linear-gradient(225deg, rgba(${checkersColor}, ${checkersOpacity}) 25%, transparent 25%),
          linear-gradient(315deg, rgba(${checkersColor}, ${checkersOpacity}) 25%, transparent 25%),
          linear-gradient(45deg, rgba(${checkersColor}, ${checkersOpacity}) 25%, transparent 25%)
        `,
        backgroundSize: `${checkersSize}px ${checkersSize}px`
      }"
    />

    <span class="checkers-card__shine" aria-hidden="true"></span>

    <!-- Header (opcional) -->
    <div
      v-if="header || $slots.header"
      class="checkers-card__header relative z-10 px-3 py-2"
    >
      <slot name="header">
        <p class="title-text text-white">{{ header }}</p>
      </slot>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Base do CheckersCard: a cor vem das variáveis de cada variante */
.checkers-card {
  --from: #5fb8ff;
  --to: #2a74db;
  --outline: #173f7d;

  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 3px solid var(--outline);
  background: linear-gradient(180deg, var(--from), var(--to) 85%);
  box-shadow:
    0 4px 0 var(--outline),
    inset 0 2px 0 rgba(255, 255, 255, 0.45),
    inset 0 -5px 0 rgba(0, 0, 0, 0.12);
}

/* Brilho oval do canto */
.checkers-card__shine {
  position: absolute;
  z-index: 11;
  top: 5px;
  left: 8px;
  width: 16px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  rotate: -30deg;
  pointer-events: none;
}

/* Faixa do header com o contorno da variante embaixo */
.checkers-card__header {
  background: rgba(0, 0, 0, 0.18);
  border-bottom: 2px solid rgba(0, 0, 0, 0.18);
}

.checkers-card--yellow {
  --from: #ffdf73;
  --to: #f3a91f;
  --outline: #8a5300;
}

.checkers-card--red {
  --from: #ff8a78;
  --to: #dc3e33;
  --outline: #6e1414;
}

.checkers-card--green {
  --from: #7fe46a;
  --to: #34a526;
  --outline: #1f5f19;
}

.checkers-card--orange {
  --from: #ffd257;
  --to: #f08a14;
  --outline: #7a4006;
}

.checkers-card--gray {
  --from: #c9d0db;
  --to: #8e97a6;
  --outline: #3c4352;
}
</style>
