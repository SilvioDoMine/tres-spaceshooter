<script setup lang="ts">
import { TresLeches, useControls } from '@tresjs/leches';
import { useCurrentRunStore } from '~/stores/currentRun';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { useTweakpaneStore } from './stores/useTweakpaneStore';
import { Pane } from 'tweakpane';


// useControls('fpsgraph');
const paneContainer = ref<HTMLElement | null>(null);
const tweakpaneStore = useTweakpaneStore();
const enemyManager = useEnemyManager();
const currentRunStore = useCurrentRunStore();

// watchOnce(paneContainer, (newVal) => {
//   console.log('Pane container changed:', newVal);
// }, { immediate: true });

// onMounted(async () => {
//   await nextTick();

//   if (! paneContainer.value) {
//     console.log('Pane container not found');
//     return;
//   }

//   console.log('Creating Tweakpane in container:', paneContainer.value);

//   console.log('Tweakpane container:', document.getElementById('paneContainer'));
  
//   const pane = tweakpaneStore.createPane(
//     document.getElementById('paneContainer'),
//     {
//       title: 'Game Controls',
//       expanded: true,
//     }
//   );

//   console.log('Tweakpane created:', pane.value);

//   // // Example: read only value
//   const myValue = ref(42);

//   const folder = pane.value.addFolder({
//     title: 'Player',
//     expanded: true,
//   });

//   folder.addBinding(myValue, 'value', {
//     label: 'Position',
//     interval: 500,
//     readonly: true,
//   });

//   folder.addBinding(currentRunStore.playerPosition, 'value', {
//     label: 'Player Position',
//     interval: 500,
//     readonly: true,
//   });

//   const paneEnemies = pane.value.addFolder({
//     title: 'Enemies',
//     expanded: true,
//   });

//   console.log(enemyManager.activeEnemies.value);

//   // enemy manager store active enemies quantity
//   paneEnemies.addBinding(enemyManager.activeEnemies.value, 'length', {
//     label: 'Active Enemies',
//     interval: 500,
//     readonly: true,
//   });

// });
</script>

<template>
  <div class="game-root">
    <NuxtPage />

    <ClientOnly>
      <div id="paneContainer" ref="paneContainer" class="absolute top-4 right-4 z-50" />
      <!-- <TresLeches /> -->
    </ClientOnly>
  </div>
</template>