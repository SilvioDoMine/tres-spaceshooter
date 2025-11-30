<script setup lang="ts">
import PlayerCharacter from '~/components/game/PlayerCharacter.vue';

// Page metadata
useHead({
  title: 'Home',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' }
  ]
})
</script>

<template>
  <TresCanvas
    clear-color="#820420"
    window-size
  >
    <PlayerCharacter />
  </TresCanvas>

  <!-- Button start game hud absolute -->
  <div class="absolute top-4 left-4 z-10">
    <NuxtLink to="/">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Finalizar
      </button>
    </NuxtLink>
  </div>
</template>
