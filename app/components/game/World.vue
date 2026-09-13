<script setup lang="js">
import GameStreamingDebris from './StreamingDebris.vue';
import BgStarField from '~/components/lobby/backgrounds/BgStarField.vue';

const currentRun = useCurrentRunStore();
const deepSpace=shallowRef();
useLoop().onBeforeRender(()=>{if(deepSpace.value){const p=currentRun.getPlayerPosition();deepSpace.value.position.set(p.x,0,p.z)}});

const stageWidth = ref(1);
const stageHeight = ref(1);

// Determine atmosphere color based on chapter
const atmosphereColor = computed(() => {
  return currentRun.levelConfig?.theme?.atmosphere ?? '#432097';
});

// Determine galaxy opacity based on chapter
const galaxyOpacity = computed(() => {
  const chapter = currentRun.levelConfig?.chapter || 1;
  return currentRun.levelConfig?.theme?.galaxyOpacity ?? (chapter > 1 ? 0.5 : 0.35);
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
    <TresMesh ref="deepSpace" :rotation="[-Math.PI / 2, 0, 0]" name="GameWorld">
      <TresPlaneGeometry :args="[stageWidth, stageHeight]" />
      <TresMeshBasicMaterial :visible="false" />
      
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

    <GameOrbitalScenery /><GameStreamingDebris />

    <GameImpactEffects />
<TresAmbientLight :intensity="0.5" color="#7586da" />
    <TresDirectionalLight :intensity="2.5" :position="[5, 10, 7.5]" color="#ffe0b5" />
    <TresDirectionalLight :intensity="1.8" :position="[-8,5,-4]" color="#496dff" />
  </TresGroup>
</template>




