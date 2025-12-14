<script setup lang="ts">
import { useCurrentRunStore } from '~/stores/currentRunStore';

// Meta tags para prevenir zoom e gestos mobile
useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent'
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes'
    }
  ]
});

// Ativa bloqueio de gestos mobile
useMobileGestureLock();

const currentRunStore = useCurrentRunStore();
currentRunStore.initializePermanentState();

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
  </div>
</template>

<style>
/* Cor de fundo para dead zones no mobile (iPhone, etc) */
html,
body {
  background-color: #020420;
  margin: 0;
  padding: 0;
}

/* Suporte para safe area no iOS */
.game-root {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
</style>