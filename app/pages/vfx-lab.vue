<script setup lang="ts">
import { emitImpact } from '~/utils/combatEffects'
import { emitElementalFx } from '~/utils/elementalStatus'
const run=useCurrentRunStore()
const projectiles=useProjectileStore()
if(!import.meta.dev)await navigateTo('/')
function shot(elements?:any){projectiles.spawnProjectile('player',{x:-3,y:0,z:3},{x:0,z:-1},'preview','player',1,0,0,[],{elements})}
const fire={fire:{burn:.15,duration:3}},ice={ice:{damage:.35,shatter:.35,duration:1.5}},lightning={lightning:{bonus:.25,chains:2,range:11}}
function chain(){emitElementalFx({kind:'chain',points:[{x:-5,z:1},{x:-1,z:-2},{x:4,z:0}]})}
</script>
<template>
 <main style="height:100dvh;background:#071226">
  <TresCanvas clear-color="#071226" :dpr="[1,1.5]">
   <TresPerspectiveCamera :position="[0,30,0]" :look-at="[0,0,0]" :fov="30" />
   <TresAmbientLight :intensity="2" />
   <GameImpactEffects /><GameProjectileManager /><GameElementalEffects /><GameVfxPreviewLoop />
  </TresCanvas>
  <UiDamageFeedback />
  <div style="position:fixed;top:15px;left:15px;display:flex;flex-wrap:wrap;gap:12px;color:white;z-index:20">
   <button @click="shot()">Disparo</button>
   <button @click="shot(fire)">Fogo</button>
   <button @click="shot(ice)">Gelo</button>
   <button @click="shot(lightning)">Raio</button>
   <button @click="shot({...fire,...ice})">Vapor</button>
   <button @click="shot({...fire,...lightning})">Raio de fogo</button>
   <button @click="shot({...ice,...lightning})">Raio glacial</button>
   <button @click="shot({...fire,...ice,...lightning})">Tempestade</button>
   <button @click="chain">Cadeia</button>
   <button @click="emitElementalFx({kind:'freeze',x:0,z:0,size:1})">Congelar</button>
   <button @click="emitElementalFx({kind:'shatter',x:0,z:0,size:1})">Quebrar gelo</button>
   <button @click="emitImpact(0,0,false)">Impacto</button>
   <button @click="emitImpact(0,0,true)">Explosão</button>
   <button @click="emitImpact(0,0,true,'hit',false,3)">Explosão grande</button>
   <button @click="emitImpact(0,0,true,'hit',false,4.5)">Explosão de chefe</button>
   <button @click="emitImpact(0,0,false,'player')">Dano</button>
   <NuxtLink to="/play/1">Jogar</NuxtLink>
  </div>
 </main>
</template>
