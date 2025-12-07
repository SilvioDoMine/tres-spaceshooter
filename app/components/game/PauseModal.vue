<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRunStore = useCurrentRunStore();
</script>

<template>
    <div :class="currentRunStore.isPaused && currentRunStore.menuPauseState === 'general' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'" class="absolute z-50 translate-all duration-500 inset-0 p-4 text-white bg-black/50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h2 class="text-2xl font-bold mb-4">Game Paused</h2>
            <p class="mb-6">The game is currently paused. You can resume or quit the game.</p>
            <div class="flex justify-between">
                <button
                    class="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition"
                    @click="currentRunStore.gameResume(currentRunStore.levelConfig)"
                >
                    Resume
                </button>
                <NuxtLink to="/">
                    <button
                        class="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
                    >
                        Quit
                    </button>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>