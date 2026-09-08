<script setup lang="ts">
const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}))
const run=useCurrentRunStore()
const enemies=useEnemyManagerStore()
const markers=ref<{id:string,x:number,y:number,angle:number,label:string,portal:boolean}[]>([])
let timer:ReturnType<typeof setInterval>
function update(){
 const targets=enemies.activeEnemies.filter(e=>e.state!=='dying').map(e=>({id:e.id,p:e.position,label:'HOSTIL',portal:false}))
 if(run.isDoorActive && run.doorPosition)targets.push({id:'portal',p:run.doorPosition,label:'PORTAL',portal:true})
 markers.value=targets.flatMap(t=>{
 const x=(t.p.x-view.value.x)/(view.value.width/2),y=(t.p.z-view.value.z)/(view.value.height/2)
 if(Math.abs(x)<.85 && Math.abs(y)<.78)return []
 const scale=Math.max(Math.abs(x)/.85,Math.abs(y)/.78,1)
 return [{id:t.id,x:50+x/scale*50,y:50+y/scale*50,angle:Math.atan2(y,x)*180/Math.PI,label:t.label,portal:t.portal}]
 }).slice(-12)
}
onMounted(()=>{timer=setInterval(update,100)})
onUnmounted(()=>clearInterval(timer))
</script>
<template>
 <div class="beacons" aria-label="Direções dos alvos fora da tela">
  <div v-for="m in markers" :key="m.id" class="beacon" :class="{portal:m.portal}" :style="{left:m.x+'%',top:m.y+'%'}">
   <span :style="{transform:`rotate(${m.angle}deg)`}">➤</span><small>{{m.label}}</small>
  </div>
 </div>
</template>
<style scoped>
.beacons{position:fixed;inset:0;pointer-events:none;z-index:12}.beacon{position:absolute;transform:translate(-50%,-50%);color:#ff9b6e;text-align:center;text-shadow:0 0 10px currentColor}.beacon.portal{color:#6cffff}.beacon span{display:block;font-size:22px;line-height:22px}.beacon small{font:8px monospace;letter-spacing:1px;display:block;margin-top:5px}
</style>

