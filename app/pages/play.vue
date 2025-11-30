<script setup lang="ts">
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
    clear-color="#020420"
    window-size
  >
    <GameOrchestrator>
      <GameDoorManager />
      <GamePlayerCharacter />
      <GameEnemyManager />
      
      <GameWorld />
      <!-- <OrbitControls /> -->
    </GameOrchestrator>
  </TresCanvas>

  <!-- Button start game hud absolute -->
  <div class="absolute top-4 left-4 z-10">
    <NuxtLink to="/">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Voltar
      </button>
    </NuxtLink>
  </div>

  <!-- Leches -->
  <!-- <TresLeches /> -->

  <!-- Hud -->
  <!-- <UiVirtualJoystick /> -->
</template>
