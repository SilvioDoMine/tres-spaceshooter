<script setup lang="js">
import GameStreamingDebris from './StreamingDebris.vue';
import BgStarField from '~/components/lobby/backgrounds/BgStarField.vue';
import { LEVELS } from '~/games/levels/index.js';

const currentRun = useCurrentRunStore();
const props=defineProps({chapter:Number});
const chapterId=computed(()=>props.chapter ?? currentRun.levelConfig?.chapter ?? 1);
const deepSpace=shallowRef();
useLoop().onBeforeRender(()=>{if(deepSpace.value){const p=currentRun.getPlayerPosition();deepSpace.value.position.set(p.x,0,p.z)}});

const stageWidth = ref(1);
const stageHeight = ref(1);

// O tema vem do capítulo pedido, não do run: a prévia do cenário monta este
// componente sem nenhuma partida carregada.
const theme = computed(() => LEVELS[chapterId.value]?.theme ?? currentRun.levelConfig?.theme);

const atmosphereColor = computed(() => theme.value?.atmosphere ?? '#432097');

const galaxyOpacity = computed(() => theme.value?.galaxyOpacity ?? (chapterId.value > 1 ? 0.5 : 0.35));

// Determine level/chapter for effects
const level = computed(() => {
  return chapterId.value;
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

    <GameNebulaShipyard v-if="chapterId===2" />
    <GameFleetCommand v-else-if="chapterId===3" />
    <GameFrontierScenery v-else-if="chapterId >= 4" :chapter="chapterId" />
    <template v-else><GameOrbitalScenery /><GameStreamingDebris /></template>

    <GameImpactEffects />
<TresAmbientLight :intensity="0.5" color="#7586da" />
    <TresDirectionalLight :intensity="2.5" :position="[5, 10, 7.5]" color="#ffe0b5" />
    <TresDirectionalLight :intensity="1.8" :position="[-8,5,-4]" color="#496dff" />
  </TresGroup>
</template>




