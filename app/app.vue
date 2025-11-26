<script setup lang="ts">
import { TresLeches, useControls } from '@tresjs/leches';

useControls('fpsgraph');
</script>

<template>
  <div class="game-root">
    <NuxtPage />

    <ClientOnly>
      <TresLeches />
    </ClientOnly>
  </div>
</template>