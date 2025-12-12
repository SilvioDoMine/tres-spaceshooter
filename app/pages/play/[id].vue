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
  currentRunStore.gameStart(levels[route.params.id ]);
});

onUnmounted(() => {
  console.log('Play page unmounted');

  // currentRunStore.endRun();
});
</script>

<template>
  <div class="relative w-full h-screen">
    <TresCanvas
      clear-color="#020420"
      window-size
    >
      <GameOrchestrator>
        <GameDoorManager />
        <GamePlayerCharacter />
        <GameEnemyManager />
        <GameProjectileManager />
        
        <GameWorld />
        <!-- <OrbitControls /> -->
      </GameOrchestrator>
    </TresCanvas>

    <!-- Modals -->
    <GamePauseModal />
    <GameOverModal />
    <GameVictoryModal />
    <GameSkillSelectModal />

    <!-- Leches -->
    <!-- <TresLeches /> -->

    <!-- Hud -->
    <ClientOnly>
      <UiVirtualJoystick />
      <UiResources />
      <UiLevel />
    </ClientOnly>
  </div>
</template>
