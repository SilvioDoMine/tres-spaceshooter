<script setup lang="ts">
import { emitImpact } from '~/utils/combatEffects'
const run=useCurrentRunStore()
const projectiles=useProjectileStore()
if(!import.meta.dev)await navigateTo('/')
function shot(){projectiles.spawnProjectile('player',{x:-3,y:0,z:3},{x:0,z:-1},'preview','player')}
</script>
<template>
 <main style="height:100dvh;background:#071226">
  <TresCanvas clear-color="#071226" :dpr="[1,1.5]">
   <TresPerspectiveCamera :position="[0,30,0]" :look-at="[0,0,0]" :fov="30" />
   <TresAmbientLight :intensity="2" />
   <GameImpactEffects /><GameProjectileManager /><GameVfxPreviewLoop />
  </TresCanvas>
  <UiDamageFeedback />
  <div style="position:fixed;top:15px;left:15px;display:flex;gap:12px;color:white;z-index:20">
   <button @click="shot">Disparo</button>
   <button @click="emitImpact(0,0,false)">Impacto</button>
   <button @click="emitImpact(0,0,true)">Explosão</button>
   <button @click="emitImpact(0,0,false,'player')">Dano</button>
   <NuxtLink to="/play/1">Jogar</NuxtLink>
  </div>
 </main>
</template>
