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
    default: 0.05
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
  }
})
</script>

<template>
  <div
    class="checkers-card"
    :class="[
      `checkers-card--${variant}`,
      padding
    ]"
  >
    <!-- Checkers background pattern -->
    <div
      class="absolute inset-0 bg-center pointer-events-none rounded-lg"
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

    <!-- Content -->
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Base do CheckersCard */
.checkers-card {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
}

/* Variante Azul */
.checkers-card--blue {
  background-color: rgb(29 78 216);
  box-shadow: 0px 0.5px 0px 2px rgb(30 58 138);
}

/* Variante Amarela */
.checkers-card--yellow {
  background-color: #ffca4a;
  box-shadow: 0px 0.5px 0px 2px #a86b00;
}

/* Variante Vermelha */
.checkers-card--red {
  background-color: #ff4a4a;
  box-shadow: 0px 0.5px 0px 2px #b81a1a;
}

/* Variante Verde */
.checkers-card--green {
  background-color: #5cd63c;
  box-shadow: 0px 0.5px 0px 2px #1a7a0a;
}

/* Variante Laranja */
.checkers-card--orange {
  background-color: #ff9933;
  box-shadow: 0px 0.5px 0px 2px #cc6600;
}

/* Variante Cinza */
.checkers-card--gray {
  background-color: #8a8a8a;
  box-shadow: 0px 0.5px 0px 2px #4a4a4a;
}
</style>
