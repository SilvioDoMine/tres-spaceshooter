<script setup lang="ts">
import { buildRaider, disposeModel } from '~/utils/spaceModels'
const props=defineProps<{enemy:any,baseStats:any,setVisualMeshRef:Function}>()
const seed=[...String(props.enemy.id)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,17)
const hull=buildRaider(seed)
const size=computed(()=>props.baseStats[props.enemy.type].size)
const engine=shallowRef();let time=0
useLoop().onBeforeRender(({delta})=>{
 time+=Math.min(delta,.1);
 if(engine.value&&!props.enemy.elementState?.freeze)engine.value.scale.z=.9+Math.sin(time*18+seed)*.12;
})
onUnmounted(()=>disposeModel(hull))
</script>
<template>
 <TresGroup :ref="setVisualMeshRef(enemy.id)" :name="`enemy-visual-${enemy.id}`">
  <TresGroup :scale="size"><primitive :object="hull" />
   <TresGroup :position="[0,.015,.7]" ref="engine">
    <TresMesh v-for="side in [-1,1]" :key="side" :position="[side*.28,0,.2]" :rotation="[-Math.PI/2,0,0]">
     <TresConeGeometry :args="[.065,.4,10]" /><TresMeshBasicMaterial color="#ff9955" :transparent="true" :opacity=".7" :depth-write="false" :blending="2" />
    </TresMesh>
   </TresGroup>
  </TresGroup>
 </TresGroup>
</template>
