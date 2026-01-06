<script setup lang="js">
import BgStarField from '~/components/lobby/backgrounds/BgStarField.vue';

const currentRun = useCurrentRunStore();

const stageWidth = ref(1);
const stageHeight = ref(1);

// Determine atmosphere color based on chapter
const atmosphereColor = computed(() => {
  // If no level config or chapter, default to white
  return '#ffffff';
});

// Determine galaxy opacity based on chapter
const galaxyOpacity = computed(() => {
  const chapter = currentRun.levelConfig?.chapter || 1;
  return chapter > 1 ? 0.6 : 0;
});

// Determine level/chapter for effects
const level = computed(() => {
  return currentRun.levelConfig?.chapter || 1;
});

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
      
      <!-- Unified Dynamic Background -->
      <!-- Rotated back to upright since GameWorld is rotated -90deg X -->
      <TresGroup :rotation="[0, 0, 0]">
         <BgStarField 
          :atmosphereColor="atmosphereColor" 
          :galaxyOpacity="galaxyOpacity" 
          :level="level"
        />
      </TresGroup>

    </TresMesh>

    <TresAmbientLight :intensity="0.6" color="#ffffff" />
    <TresDirectionalLight :intensity="1.5" :position="[5, 10, 7.5]" color="#ffffff" />
  </TresGroup>
</template>