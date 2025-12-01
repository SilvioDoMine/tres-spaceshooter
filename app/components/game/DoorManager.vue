<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRun = useCurrentRunStore();

const isDoorActive = currentRun.isDoorActive;
const doorPosition = currentRun.doorPosition;
const doorSize = currentRun.doorSize;
</script>

<template>
  <TresMesh
    v-if="currentRun.isDoorActive"
    :position="[doorPosition.x, doorPosition.y, doorPosition.z]"
    name="Door"
  >
    <TresBoxGeometry :args="[1, 1, 1]" />
    <TresMeshStandardMaterial color="blue" />
  </TresMesh>
</template>