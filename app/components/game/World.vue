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
      <!-- <TresPlaneGeometry :args="[stageWidth, stageHeight]" />
      <TresMeshStandardMaterial wireframe color="transparent" /> -->
            <Stars
        :size="1"
        :rotation="[0, Math.PI / 4, 0]"
        :count="5000"
      />
      <Stars
        :size="0.5"
        :rotation="[0, Math.PI / 4, 0]"
        :count="5000"
      />

    </TresMesh>

    <!-- Fumaça nas bordas do mapa -->
    <GameMapBoundarySmoke
      :map-width="stageWidth"
      :map-height="stageHeight"
      color="#33ff33"
    />

    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :intensity="1" :position="[5, 10, 7.5]" />
  </TresGroup>
</template>