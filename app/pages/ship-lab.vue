<script setup lang="ts">
import { EQUIPMENT_ITEMS, EQUIPMENT_SLOTS, SLOT_ORDER } from '~/data/equipment'
useHead({title:'Kestrel-07 · Inspeção do modelo'})
const empty=()=>Object.fromEntries([...SLOT_ORDER.map(slot=>[slot,'']),...['front_shot','diagonal_shot','back_shot'].map(id=>[id,0])])
const preview=ref<Record<string,string|number>>(empty())
const view=ref('Perspectiva')
const views:Record<string,number[]>={Perspectiva:[-2,1.8,-2.8],Superior:[0,3.3,.001],Inferior:[0,-3.3,.001],Lateral:[3.3,.1,0],Traseira:[0,.2,3.3]}
function preset(which:number){
  const next:Record<string,string|number>=empty()
  if(which)for(const slot of SLOT_ORDER)next[slot]=EQUIPMENT_ITEMS.filter(i=>i.slot===slot)[which-1].id
  preview.value=next
}
</script>
<template>
  <main class="model-lab">
    <header><NuxtLink to="/hangar">← Hangar</NuxtLink><h1>Kestrel-07 / novo interceptor</h1><p>Prévia independente — não altera seu inventário.</p></header>
    <section class="stage">
      <TresCanvas clear-color="#091827" :dpr="[1,1.5]">
        <TresPerspectiveCamera :key="view" :position="views[view]" :look-at="[0,0,-.1]" :fov="38" />
        <TresAmbientLight color="#b3cbdc" :intensity="1.2" />
        <TresDirectionalLight :position="[-3,5,-4]" :intensity="2.5" color="#fff1dd" />
        <TresDirectionalLight :position="[4,2,3]" :intensity="1.5" color="#82cbef" />
        <GameKestrelShip :preview="preview" />
        <OrbitControls :key="view" :enable-pan="false" :min-distance="1.8" :max-distance="5" />
      </TresCanvas>
    </section>
    <aside>
      <label>Vista<select v-model="view"><option v-for="(_,name) in views" :key="name">{{name}}</option></select></label>
      <div class="presets"><button @click="preset(0)">Casco básico</button><button @click="preset(1)">Kit Plasma</button><button @click="preset(2)">Kit Iônico</button></div>
      <label v-for="slot in SLOT_ORDER" :key="slot">{{EQUIPMENT_SLOTS[slot].label}}<select v-model="preview[slot]"><option value="">Integrado / tampa</option><option v-for="item in EQUIPMENT_ITEMS.filter(i=>i.slot===slot)" :key="item.id" :value="item.id">{{item.name}}</option></select></label>
      <label v-for="(title,key) in {front_shot:'Tiro frontal',diagonal_shot:'Diagonais / laterais',back_shot:'Tiro traseiro'}" :key="key">{{title}}<select v-model.number="preview[key]"><option :value="0">Sem carta</option><option :value="1">Nível 1</option><option :value="2">Nível 2</option></select></label>
    </aside>
  </main>
</template>
<style scoped>
.model-lab{position:fixed;inset:0;background:#091827;color:#e5f2f5;display:grid;grid-template-columns:1fr 270px;grid-template-rows:auto 1fr;font-family:system-ui}.model-lab header{grid-column:1/-1;padding:14px 24px;border-bottom:1px solid #254455}.model-lab h1{font-size:20px;margin:8px 0}.model-lab p{font-size:12px;color:#9ab8c5;margin:0}.model-lab a{color:#5fd8ef}.stage{position:relative;min-height:0}.model-lab aside{padding:18px;overflow:auto;border-left:1px solid #254455}.model-lab label{display:block;font-size:12px;margin-bottom:12px}.model-lab select{display:block;width:100%;margin-top:5px;background:#163041;color:white;border:1px solid #396173;border-radius:5px;padding:7px}.presets{display:flex;gap:4px;margin:14px 0}.presets button{background:#244e5d;color:white;border:0;border-radius:4px;padding:7px;font-size:11px;cursor:pointer}@media(max-width:650px){.model-lab{grid-template-columns:1fr;grid-template-rows:auto 48vh 1fr}.model-lab aside{display:grid;grid-template-columns:1fr 1fr;gap:10px}.presets{grid-column:1/-1}}
</style>
