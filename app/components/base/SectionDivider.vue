<script setup lang="js">
const props = defineProps({
  /** Texto do separador (opcional) */
  text: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div
    v-if="text"
    class="relative w-full flex items-center justify-center gap-3 mt-3 py-3 sm:gap-2"
  >
    <!-- Linha esquerda -->
    <div class="flex-1 h-0.5 bg-linear-to-r from-transparent via-white/30 to-transparent"></div>

    <!-- Seta esquerda -->
    <span class="text-xl text-white/80 leading-none sm:text-lg" style="text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)"></span>

    <!-- Texto central -->
    <h3 class="text-lg title-text font-normal text-white whitespace-nowrap tracking-wide sm:text-base">
      {{ text }}
    </h3>

    <!-- Seta direita -->
    <span class="text-xl text-white/80 leading-none sm:text-lg" style="text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)"></span>

    <!-- Linha direita -->
    <div class="flex-1 h-0.5 bg-linear-to-r from-transparent via-white/30 to-transparent"></div>
  </div>
</template>
