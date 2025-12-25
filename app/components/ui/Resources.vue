<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRunStore = useCurrentRunStore();
</script>

<template>
  <div class="w-full h-10 absolute mt-6 top-0 left-0 flex items-center justify-between text-white">
    <!-- Notches -->
    <div class="flex justify-between w-full translate-all duration-300">
      <!-- Notch Esquerdo -->
      <div
        class="bg-white/10 px-4 py-2 flex items-center justify-between gap-2 rounded-r-full cursor-pointer active:scale-90 active:-translate-x-1.25 transition-transform"
        @click="currentRunStore.gamePause()"
      >
        <!-- Text -->
        <span></span>

        <!-- Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="5.0" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
        </svg>
      </div>

      <!-- Notch Direito -->
      <div class="bg-white/10 px-4 py-1 flex items-center justify-between gap-2 rounded-l-full cursor-pointer">
        <!-- Icon -->
        <SvgCoinIcon :size="25" />

        <!-- Text -->
        <span class="font-bold">{{ currentRunStore.currentGold }}</span>
      </div>
    </div>
  </div>
</template>
