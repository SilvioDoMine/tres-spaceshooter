<script setup lang="js">
const currentRun = useCurrentRunStore();

const stageWidth = ref(1);
const stageHeight = ref(1);

watch(
  () => currentRun.currentStage,
  (newStage) => {
    if (newStage) {
      stageWidth.value = newStage.width || 1;
      stageHeight.value = newStage.height || 1;
      console.log('Updated stage dimensions:', stageWidth.value, stageHeight.value);
    }
  },
  { immediate: true }
);
</script>

<template>
  <TresGroup>
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]" name="GameWorld">
      <TresPlaneGeometry :args="[stageWidth, stageHeight]" />
      <TresMeshStandardMaterial wireframe color="transparent" />
      <Stars />
      <Stars :size="2" :count="1500" :depth="600" />

    </TresMesh>

    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :intensity="1" :position="[5, 10, 7.5]" />
  </TresGroup>
</template>