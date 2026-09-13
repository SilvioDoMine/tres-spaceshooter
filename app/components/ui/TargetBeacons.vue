<script setup lang="ts">
import { useHeartStore } from '~/stores/useHeartStore'
type Kind='hostile'|'portal'|'heart'
const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}))
const run=useCurrentRunStore()
const enemies=useEnemyManagerStore()
const hearts=useHeartStore()
const markers=ref<{id:string,x:number,y:number,angle:number,label:string,kind:Kind}[]>([])
let frame=0
function update(){
 const targets:{id:string,p:{x:number,z:number},label:string,kind:Kind}[]=enemies.activeEnemies.filter(e=>e.state!=='dying').map(e=>({id:e.id,p:e.position,label:'HOSTIL',kind:'hostile'}))
 // Cura só aponta quando dá para coletar (mesma regra do useHeartStore.update: vivo e abaixo da vida máxima).
 // Corações ficam depois dos inimigos para sobreviverem ao corte dos 12 marcadores
 if(run.currentHealth>0 && run.currentHealth<run.maxHealth)hearts.hearts.forEach(h=>targets.push({id:`heart-${h.id}`,p:h,label:'CURA',kind:'heart'}))
 if(run.isDoorActive && run.doorPosition)targets.push({id:'portal',p:run.doorPosition,label:'PORTAL',kind:'portal'})
 markers.value=targets.flatMap(t=>{
 const x=(t.p.x-view.value.x)/(view.value.width/2),y=(t.p.z-view.value.z)/(view.value.height/2)
 if(Math.abs(x)<.85 && Math.abs(y)<.78)return []
 const scale=Math.max(Math.abs(x)/.85,Math.abs(y)/.78,1)
 return [{id:t.id,x:50+x/scale*50,y:50+y/scale*50,angle:Math.atan2(y,x)*180/Math.PI,label:t.label,kind:t.kind}]
 }).slice(-12)
}
// Atualiza a cada frame (câmera e inimigos também se movem por frame); um intervalo fixo deixava os marcadores aos saltos
function tick(){update();frame=requestAnimationFrame(tick)}
onMounted(()=>{frame=requestAnimationFrame(tick)})
onUnmounted(()=>cancelAnimationFrame(frame))
</script>
<template>
 <div class="beacons" aria-label="Direções dos alvos fora da tela">
  <div v-for="m in markers" :key="m.id" class="beacon" :class="m.kind" :style="{left:m.x+'%',top:m.y+'%'}">
   <span :style="{transform:`rotate(${m.angle}deg)`}">➤</span><small>{{m.label}}</small>
  </div>
 </div>
</template>
<style scoped>
.beacons{position:fixed;inset:0;pointer-events:none;z-index:12}.beacon{position:absolute;transform:translate(-50%,-50%);color:#ff9b6e;text-align:center;text-shadow:0 0 10px currentColor}.beacon.portal{color:#6cffff}.beacon.heart{color:#ff3b5c}.beacon i{display:block;font-style:normal;font-size:12px;line-height:12px;margin-top:2px;animation:beacon-beat 1.2s ease-in-out infinite}@keyframes beacon-beat{0%,60%,100%{transform:scale(1)}30%{transform:scale(1.35)}}.beacon span{display:block;font-size:22px;line-height:22px}.beacon small{font:8px monospace;letter-spacing:1px;display:block;margin-top:5px}
</style>

