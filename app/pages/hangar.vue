<script setup lang="ts">
const appearance=useShipAppearance()
const paints=[{name:'Patrulha',color:'#17a2ad',exhaust:'#27c7ff'},{name:'Solar',color:'#e99426',exhaust:'#ff973f'},{name:'Nebulosa',color:'#8652d2',exhaust:'#af7aff'},{name:'Resgate',color:'#d83e52',exhaust:'#55ffcc'}]
const choose=(p:typeof paints[number])=>{appearance.value.color=p.color;appearance.value.exhaust=p.exhaust}
useHead({title:'Hangar · Kestrel-07'})
</script>
<template>
 <main class="hangar">
  <header><NuxtLink to="/" class="game-button">‹ Voltar</NuxtLink><h1>Hangar</h1><span class="owned">1 nave disponível</span></header>
  <section class="showcase" aria-label="Prévia 3D da Kestrel-07">
   <TresCanvas :dpr="[1, 1.5]" clear-color="#091324">
    <TresPerspectiveCamera :position="[2.6,2.8,3.4]" :look-at="[0,0,0]" />
    <TresAmbientLight :intensity="1" color="#b9dcf5" />
    <TresDirectionalLight :position="[3,6,4]" :intensity="3" />
    <TresDirectionalLight :position="[-4,2,-3]" :intensity="2" color="#50cddd" />
    <GameKestrelShip /><OrbitControls :enable-pan="false" :min-distance="2" :max-distance="6" />
   </TresCanvas>
   <div class="ship-name"><span>INTERCEPTADORA</span><h2>Kestrel-07</h2><p>Arraste para girar • Use dois dedos para aproximar</p></div>
  </section>
  <section class="deck allow-scroll">
   <div class="fleet"><button class="ship-card selected"><span>🚀</span><b>Kestrel-07</b><small>Equipada</small></button><div class="future"><span>✦</span><b>Sua frota começa aqui</b><small>Espaço reservado para futuras naves</small></div></div>
   <div class="customize"><h3>Personalizar nave</h3><div class="paint-list"><button v-for="p in paints" :key="p.name" @click="choose(p)" :aria-pressed="appearance.color===p.color" :class="{active:appearance.color===p.color}"><i :style="{background:p.color}" />{{p.name}}</button></div>
    <div class="controls"><label>Pintura<input v-model="appearance.color" type="color" aria-label="Cor da pintura" /></label><label>Cor do propulsor<input v-model="appearance.exhaust" type="color" aria-label="Cor do propulsor" /></label><label>Acabamento<select v-model.number="appearance.finish"><option :value=".1">Fosco</option><option :value=".4">Acetinado</option><option :value=".8">Metálico</option></select></label><label>Chama<input v-model.number="appearance.power" type="range" min=".65" max="1.5" step=".05" aria-label="Tamanho visual da chama" /></label><label class="toggle"><input v-model="appearance.thrusters" type="checkbox" /> Motores animados</label></div>
    <p class="saved">✓ Alterações aplicadas à sua nave no jogo</p>
   </div>
  </section>
 </main>
</template>
<style scoped>
.hangar{height:100dvh;background:#091324;color:white;font-family:'Fredoka One',sans-serif;display:flex;flex-direction:column}header{height:76px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:linear-gradient(#24456b,#132d4c);border-bottom:3px solid #35638a}h1{font:34px 'Lilita One';text-shadow:0 3px #17375e;margin:0}.game-button{padding:10px 22px;border-radius:12px;background:linear-gradient(#76c8ff,#3289d3);border:3px solid #2563a1;box-shadow:0 4px #164572;color:white;text-decoration:none;font-family:'Lilita One';font-size:20px}.owned{font-size:12px;color:#b4d6ed}.showcase{position:relative;flex:1;min-height:180px}.ship-name{position:absolute;bottom:10px;left:0;right:0;text-align:center;pointer-events:none;text-shadow:0 2px 3px #000}.ship-name span{font-size:10px;color:#91bed8;letter-spacing:2px}h2{font:32px 'Lilita One';margin:0}p{font-size:11px;color:#a9c8e0;margin:5px 0}.deck{display:grid;grid-template-columns:240px 1fr;gap:20px;padding:18px 24px 24px;background:linear-gradient(#24446a,#12283f);border-top:4px solid #416d96;box-shadow:0 -6px 30px #0005;max-height:44dvh;overflow:auto}.fleet{display:flex;gap:12px}.ship-card{width:110px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;border:3px solid #e1a938;border-radius:14px;background:linear-gradient(#397db5,#214874);box-shadow:0 4px #96691f;color:white;padding:10px}.ship-card span{font-size:30px}.ship-card b{font:16px 'Lilita One'}.ship-card small{background:#7cc953;color:#224614;padding:3px 10px;border-radius:8px;font-size:10px}.future{align-self:center;display:flex;flex-direction:column;gap:7px;color:#8aaac7;font-size:11px}.future span{font-size:24px}.future small{font:11px sans-serif;line-height:1.4}h3{font:22px 'Lilita One';color:#ffe09a;margin:0 0 10px}.paint-list{display:flex;gap:8px;flex-wrap:wrap}.paint-list button{display:flex;align-items:center;gap:6px;padding:7px 12px;color:#dfedff;background:#153452;border:2px solid #426689;border-radius:10px;font-size:12px;cursor:pointer}.paint-list button.active{border-color:#ffce68;background:#315275}.paint-list i{width:15px;height:15px;border-radius:50%;border:2px solid #fff8}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin-top:14px}.controls label{display:flex;align-items:center;gap:8px;font:12px 'Fredoka One'}.controls input[type=color]{width:30px;height:26px;border:0;background:none}.controls select{background:#102b47;border:1px solid #4b789d;color:white;border-radius:6px;padding:5px}.controls input[type=range]{width:85px;accent-color:#ffc75b}.toggle input{accent-color:#77d34d}.saved{color:#9ddc92;margin-top:12px}@media(max-width:650px){header{padding:10px 12px;height:64px}h1{font-size:28px}.owned{display:none}.deck{display:flex;flex-direction:column;gap:14px;padding:12px;max-height:45dvh}.fleet{min-height:76px}.ship-card{width:135px;display:grid;grid-template-columns:25px 1fr;padding:6px}.ship-card span{font-size:23px}.ship-card small{grid-column:2}.future{max-width:160px}.future span{display:none}.ship-name p{font-size:10px}h2{font-size:26px}.paint-list button{padding:6px 9px}.controls{gap:10px}.showcase{min-height:210px}}

.controls input[type=color]{width:44px;height:44px}.controls select{min-height:44px}.controls input[type=range]{height:44px}.paint-list button{min-height:44px}.toggle{min-height:44px}.toggle input{width:22px;height:22px}.deck{flex-shrink:0;min-height:0;padding-bottom:max(16px,env(safe-area-inset-bottom))}
@media(max-height:500px) and (orientation:landscape){.hangar{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:58px minmax(0,1fr)}header{grid-column:1 / -1;height:58px}.showcase{min-height:0}.deck{max-height:none;border-top:0;border-left:3px solid #416d96;display:flex;flex-direction:column;padding:12px;gap:12px}.fleet{min-height:76px}.ship-name span{display:none}.ship-name h2{font-size:22px}.ship-name p{font-size:9px}.owned{display:none}}
</style>
