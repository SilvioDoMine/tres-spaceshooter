<script setup>
const names={1:'Órbita',2:'Estaleiro na nebulosa',3:'Comando da frota'}
const chapter=ref(3),freeCamera=ref(false)
const x=ref(0),z=ref(0)
const move=(dx,dz)=>{x.value+=dx;z.value+=dz}
useHead({title:'Prévia do cenário'})
</script>
<template>
 <main class="scenery-preview">
  <TresCanvas :key="`${chapter}-${freeCamera}`" clear-color="#000814" :dpr="[1,1.5]" window-size>
   <TresPerspectiveCamera :position="freeCamera?[0,35,12]:[x,52,z]" :look-at="freeCamera?[0,0,0]:[x,0,z]" :fov="freeCamera?55:25" :far="600" />
   <GameWorld :chapter="chapter" /><TresGroup :position="[x,0,z]"><GameKestrelShip /></TresGroup>
   <OrbitControls v-if="freeCamera" :target="[0,-15,0]" :min-distance="25" :max-distance="100" />
  </TresCanvas>
  <header><NuxtLink to="/">← Lobby</NuxtLink><h1>Capítulo {{chapter}} · {{names[chapter]}}</h1>
   <p>Câmera da partida • nave em escala real • não altera seu progresso</p>
   <nav aria-label="Selecionar cenário">
    <button v-for="id in [1,2,3]" :key="id" :aria-pressed="chapter===id" @click="chapter=id">Capítulo {{id}} · {{names[id]}}</button>
   </nav>
      <nav aria-label="Câmera da prévia"><button @click="freeCamera=!freeCamera">{{freeCamera?'Usar câmera da partida':'Inspecionar em 3D'}}</button><button @click="x=0;z=0">Voltar ao spawn</button></nav>
   <nav v-if="!freeCamera" aria-label="Deslocamento de inspeção"><button @click="move(-10,0)">← 10 m</button><button @click="move(10,0)">10 m →</button><button @click="move(0,-10)">↑ 10 m</button><button @click="move(0,10)">↓ 10 m</button></nav>
   <p class="selection">Exibindo somente o capítulo {{chapter}}</p>
  </header>
 </main>
</template>
<style scoped>
.scenery-preview{position:fixed;inset:0;background:#000814}header{position:absolute;top:18px;left:18px;padding:16px 22px;background:#071725dd;border:1px solid #337c86;border-radius:12px;color:#def7fa;font-family:system-ui;max-width:calc(100vw - 36px)}h1{font-size:20px;margin:10px 0}p{font-size:12px;color:#a3c6ce}a{color:#88dfde}button{margin-top:10px;border:1px solid #4da9ae;background:#173d49;color:white;padding:10px;border-radius:6px;cursor:pointer}
</style>
<style scoped>
nav{display:flex;flex-wrap:wrap;gap:8px}button[aria-pressed="true"]{background:#207c87;border-color:#8aeeed;box-shadow:inset 0 -3px #8aeeed}button:hover{border-color:#b4ffff}.selection{margin-bottom:0;color:#8aeeed}
</style>
