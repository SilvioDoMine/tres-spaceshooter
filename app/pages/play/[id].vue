<script setup lang="js">
import { LEVEL_1 } from '~/games/levels/LevelOneConfig';

// Page metadata
useHead({
  title: 'Home',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' }
  ]
})

const route = useRoute();
const currentRunStore = useCurrentRunStore();


const levels = {
  1: LEVEL_1,
};

onMounted(async () => {
  await nextTick();

  const currentId = Number(route.params.id);

  if (! Number.isInteger(currentId) ) {
    console.error('Invalid level id:', route.params.id );
    navigateTo('/');
    return;
  }

  if (!levels[currentId]) {
    console.error('Level not found:', route.params.id );
    navigateTo('/');
    return;
  }

  // Inicia uma nova partida ao montar a página
  currentRunStore.initializeLevel(levels[route.params.id ]);
});

onUnmounted(() => {
  console.log('Play page unmounted');

  currentRunStore.endRun();
});
</script>

<template>
  <div>
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

    <!-- Modals -->
    <GamePauseModal />

    <!-- Leches -->
    <!-- <TresLeches /> -->

    <!-- Hud -->
    <!-- <UiVirtualJoystick /> -->
  </div>
</template>
