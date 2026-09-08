<script setup lang="ts">
import { LEVEL_1 } from '~/games/levels/LevelOneConfig'
const run=useCurrentRunStore(),dilation=useSpatialDilation()
if(!import.meta.dev)await navigateTo('/')
onMounted(()=>run.gameStart(LEVEL_1))
function position(offset:number){const s=dilation.state.value;run.setPlayerPosition(s.centerX+s.startRadius+offset,0,s.centerZ);run.setMoveVector(1,0,0)}
</script>
<template>
 <main v-if="true" style="height:100dvh">
  <TresCanvas clear-color="#071226" :dpr="[1,1.5]">
   <GameOrchestrator><GamePlayerCharacter /><GameWorld /></GameOrchestrator>
  </TresCanvas>
  <UiSpatialDilation /><UiDamageFeedback />
  <nav style="position:fixed;top:8px;left:8px;color:white;background:#102638;z-index:30;display:flex;gap:12px;flex-wrap:wrap">
   <button @click="position(10)">Zona de alerta</button>
   <button @click="position(24)">Zona crítica</button>
   <button @click="run.setMoveVector(-1,0,0)">Retornar</button>
   <button @click="run.nextStage()">Próxima sala</button>
   <output>{{ dilation.state.value.phase }} · HP {{ Math.round(run.currentHealth) }}</output>
  </nav>
 </main>
</template>
