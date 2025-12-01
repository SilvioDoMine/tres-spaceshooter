<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRunStore = useCurrentRunStore();
</script>

<template>
    <div :class="currentRunStore.isGameOver ? '' : 'hidden'" class="absolute z-50 inset-0 p-4 text-white bg-black/50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h2 class="text-2xl font-bold mb-4">Game Over</h2>
            <p class="mb-6">The game has ended. You can try again or quit.</p>
            <div class="flex justify-between">
                <button
                    class="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition"
                    @click="currentRunStore.gameStart()"
                >
                    Try again
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