<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRunStore = useCurrentRunStore();
</script>

<template>
  <div class="w-full h-10 absolute mt-6 top-0 left-0 flex items-center justify-between text-white">
    <!-- Notches -->
    <div class="flex justify-between w-full translate-all duration-300">
      <div class="relative">
        <!-- Notch Esquerdo -->
        <div
          class="bg-black/45 backdrop-blur-sm px-4 py-2 flex items-center justify-between gap-2 rounded-r-full cursor-pointer active:scale-90 active:-translate-x-1.25 transition-transform"
          @click="currentRunStore.gamePause()"
        >
          <!-- Text -->
          <span></span>

          <!-- Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="5.0" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
          </svg>
        </div>

        <!-- Fast Game: só em capítulo já concluído; cada toque 1x → 2x → 3x → 1x -->
        <button
          v-if="currentRunStore.fastGameAvailable"
          type="button"
          class="absolute top-full left-0 mt-2 min-w-14 bg-black/45 backdrop-blur-sm pl-4 pr-3 py-1 flex items-center rounded-r-full cursor-pointer active:scale-90 active:-translate-x-1.25 transition-transform"
          :class="currentRunStore.preferredGameSpeed > 1 ? 'text-yellow-300' : 'text-white'"
          :aria-label="`Velocidade do jogo ${currentRunStore.preferredGameSpeed}x`"
          @click="currentRunStore.cycleGameSpeed()"
        >
          <span class="title-text text-lg">{{ currentRunStore.preferredGameSpeed }}x</span>
        </button>
      </div>

      <!-- Notch Direito -->
      <div class="bg-black/45 backdrop-blur-sm px-4 py-1 flex items-center justify-between gap-2 rounded-l-full cursor-pointer">
        <!-- Icon -->
        <SvgCoinIcon :size="25" />

        <!-- Text -->
        <span class="title-text text-lg">{{ currentRunStore.currentGold }}</span>
      </div>
    </div>
  </div>
</template>
