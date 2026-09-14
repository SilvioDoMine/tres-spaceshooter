<script setup lang="ts">
import { Vector3 } from 'three'
import { separatedPosition } from '~/utils/sceneryMotion'
import { buildStation, disposeModel } from '~/utils/spaceModels'
const station=buildStation()
onUnmounted(()=>disposeModel(station))
import { sceneryVolumes } from '~/utils/sceneryVolumes'
import GameDerelictCruiser from './DerelictCruiser.vue'
const scenery = shallowRef()
const run = useCurrentRunStore()
useGameLoop().onBeforeRender(({delta})=>{
 if(!scenery.value)return
 station.rotation.z+=Math.min(delta,.1)*.008
 const p=run.getPlayerPosition()
 // Each landmark remains stationary until its entire silhouette leaves the view.
 const bodies=scenery.value.children.map(object=>({object,position:object.position,radius:object.name==='saturn-landmark'?21:object.name==='wreck-landmark'?7:13}))
 bodies.forEach((body)=>{
   const object=body.object
   const radius=object.name==='saturn-landmark'?21:object.name==='wreck-landmark'?7:13
   let x=object.position.x,z=object.position.z
   if(object.name==='wreck-landmark' && run.isPlaying){x+=Math.min(delta,.1)*.12;object.rotation.y+=Math.min(delta,.1)*.015}
   const limit=radius+35
   const dx=object.position.x-p.x,dz=object.position.z-p.z,d=Math.hypot(dx,dz)
   if(d>limit){const step=Math.min(d-limit,Math.min(delta,.1)*1.5);x-=dx/d*step;z-=dz/d*step}
   const next=separatedPosition(body,x,z,bodies)
   object.position.x=next.x;object.position.z=next.z
   sceneryVolumes.set(object.uuid,{center:object.getWorldPosition(new Vector3()),radius})
 })
})
onUnmounted(()=>sceneryVolumes.clear())
// Background geometry is kept below combat space and never affects collisions.
const rocks = Array.from({ length: 48 }, (_, i) => ({
  position: [Math.sin(i*2.399)* (24+i*.72), -9-(i%5)*2, Math.cos(i*2.399)*(24+i*.72)] as [number,number,number],
  scale: [1+(i%4)*.4,.65+(i%3)*.3,1+(i%5)*.35] as [number,number,number],
  rotation: [i*.7,i*.3,i*.9] as [number,number,number],
}))
</script>
<template>
  <TresGroup ref="scenery" name="Orbital ruins">
    <TresGroup name="wreck-landmark" :position="[-25,-8,-22]" :rotation="[.12,.7,.08]"><GameDerelictCruiser /></TresGroup>
    <TresGroup name="saturn-landmark" :position="[18,-60,-17]"><GameSaturn /></TresGroup>
    <TresGroup name="station-landmark" :position="[-18,-16,13]" :rotation="[.18,.3,.2]">
      <primitive :object="station" />
    </TresGroup>
  </TresGroup>
</template>


