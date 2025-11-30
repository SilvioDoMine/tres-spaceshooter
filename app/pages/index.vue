<script setup lang="ts">
import { LEVEL_1 } from '~/games/levels/LevelOneConfig';

// Page metadata
useHead({
  title: 'Home',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' }
  ]
})

const currentRunStore = useCurrentRunStore();

function startGame() {
  console.log('Iniciando o jogo...');

  currentRunStore.initializeLevel(LEVEL_1);
}
</script>

<template>
  <TresCanvas
    clear-color="#420420"
    window-size
  >
    <TheExperience />
  </TresCanvas>

  <!-- Button start game hud absolute -->
  <div class="absolute top-4 left-4 z-10">
    <NuxtLink to="/play">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        @click="startGame"
      >
        Iniciar jogo
      </button>
    </NuxtLink>
  </div>
</template>
