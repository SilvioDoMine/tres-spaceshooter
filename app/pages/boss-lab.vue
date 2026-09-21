<script setup lang="ts">
import { baseStats } from '~/composables/useEnemyManager';
import type { BossModel } from '~/utils/bossModels';
import BgStarField from '~/components/lobby/backgrounds/BgStarField.vue';
import EnemyBoss from '~/components/game/enemies/EnemyBoss.vue';
import EnemyFleet from '~/components/game/enemies/EnemyFleet.vue';
import { ENEMY_FLEET, TACTICAL_FLEET } from '~/utils/enemyFleet';
import { attackProfile } from '~/utils/combatPatterns';
import { FAMILY_ROLES, enemyFamilyModel } from '~/utils/enemyFamilies';

// Bancada dos bosses dos capítulos 2 e 3 (só em dev): modelo, fases, carga do ataque e vista do jogo.
if (!import.meta.dev && import.meta.client && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) await navigateTo('/');
useHead({ title: 'Boss Lab' });

const BOSSES: { type: string; model?: BossModel; visualModel?: string; fleetRole?: string; name: string; role: string; chapter: number; idea: string }[] = [
  { type: 'hiveBoss', model: 'hive', name: 'COLMEIA', role: 'Capítulo 2 · sala 10', chapter: 2, idea: 'Caça: avança devagar com tiros duplos rápidos e para um instante após cada disparo. Torreta (fase 3 aqui): lança caças kamikazes e dispara salvas de 3 rajadas muito rápidas.' },
  { type: 'harpyBoss', model: 'harpy', name: 'HARPIA', role: 'Capítulo 2 · sala 20', chapter: 2, idea: 'Plana rápido ao redor atirando pouco, vira 180° e para: rajada seguida das asas. Na volta seguinte carrega uma investida longa e larga.' },
  { type: 'bastionBoss', model: 'bastion', name: 'BASTIÃO', role: 'Capítulo 3 · sala 10', chapter: 3, idea: 'Anel de escudos bloqueia tiros; dispara em espiral pelos vãos.' },
  { type: 'colossusBoss', model: 'colossus', name: 'COLOSSO', role: 'Capítulo 3 · sala 20', chapter: 3, idea: 'Baterias em leque, bordada com escoltas e reator exposto na fase 3.' },
];
for (const [type, chapter] of [['boss',1],['asteroidBoss',1],['miniboss',1],['kamikazeBoss',4],['chapter4Boss',4],['chapter5Boss',5]] as const) {
  BOSSES.push({type, chapter, name: ENEMY_FLEET[type].name, role: `Capítulo ${chapter}`, idea: 'Modelo Blender com armas nos hardpoints físicos da partida.'});
}
for (const chapter of [2,3,4,5]) for (const type of FAMILY_ROLES) {
  BOSSES.push({type, chapter, visualModel: enemyFamilyModel(type,chapter), name: `C${chapter} · ${ENEMY_FLEET[type].name}`, role: 'Frota do capítulo', idea: 'Casco próprio do capítulo; comportamento e atributos do papel original.'});
}

const index = ref(0);
const tacticalDescriptions = {
  sniper: 'Canhão longo; mira visível, trava antes do disparo e recua se você se aproxima.',
  skirmisher: 'Três disparos curtos pelo canhão frontal; aproxima, ataca e recua para recarregar.',
  broadside: 'Quatro canhões nos bordos. Vira o casco para disparar uma salva lateral.',
  spiral: 'Três emissores no rotor; orbita e avança o ângulo entre salvas para formar uma espiral.',
};
for (const [visualModel, entry] of Object.entries(TACTICAL_FLEET)) {
  BOSSES.push({ type: 'ufo', visualModel, fleetRole: entry.fleetRole, chapter: entry.chapter,
    name: `C${entry.chapter} · ${entry.name}`, role: 'Unidade especializada', idea: tacticalDescriptions[entry.fleetRole] });
}
BOSSES.push({type: 'miniasteroid',chapter:1,name:'ESTILHAÇO',role:'Fragmento revisado',idea:'Silhueta quebrada, placas claras e fissura luminosa para leitura em telas pequenas.'});
const boss = computed(() => BOSSES[index.value]!);
const previewEnemy = computed(() => ({id:'lab',type:boss.value.type,visualModel:boss.value.visualModel,
  fleetRole:boss.value.fleetRole, attackCharge:charge.value,
  size:baseStats[boss.value.type].size,visualScale:baseStats[boss.value.type].visualScale,
  position:{x:0,y:0,z:0},health:100,maxHealth:100,room:20,state:'active',
  attackClock:{charging:charge.value>0,volley:previewVolley.value,profile:attackProfile(boss.value.type,20,previewVolley.value,{fleetRole:boss.value.fleetRole})}}));
const size = computed(() => baseStats[boss.value.type].size as number);
const phase = ref(1);
const charge = ref(0);
const previewVolley = ref(0);
const speed = ref(1);
const autoSpin = ref(true);
const view = ref<'free' | 'game'>('free');
const angle = ref(0);
const noRef = () => () => {};

let chargeClock = -1;
let frame = 0;
let last = 0;
function chargeAttack() {
  previewVolley.value++;
  chargeClock = 0;
}
function tick(now: number) {
  const dt = Math.min(.1, (now - (last || now)) / 1000) * speed.value;
  last = now;
  if (autoSpin.value && view.value === 'free') angle.value += dt * .4;
  if (chargeClock >= 0) {
    chargeClock += dt;
    const t = chargeClock;
    charge.value = t < .9 ? t / .9 : t < 1.05 ? 1 : Math.max(0, 1 - (t - 1.05) / .3);
    if (t > 1.4) chargeClock = -1;
  }
  frame = requestAnimationFrame(tick);
}
const viewportAspect = ref(1);
function updateViewport() { viewportAspect.value = window.innerWidth / Math.max(1, window.innerHeight); }
onMounted(() => { updateViewport(); window.addEventListener('resize', updateViewport); frame = requestAnimationFrame(tick); });
onUnmounted(() => { cancelAnimationFrame(frame); window.removeEventListener('resize', updateViewport); });

watch(index, () => { phase.value = 1; });
const freeCamera = computed(() => {
  const framing = Math.max(1, 1 / viewportAspect.value);
  return [0, size.value * 2.6 * framing, size.value * 3.4 * framing] as [number, number, number];
});
</script>

<template>
  <main class="lab">
    <TresCanvas clear-color="#071226" :dpr="[1, 1.5]">
      <TresPerspectiveCamera v-if="view === 'free'" :key="`free-${boss.type}`" :position="freeCamera" :look-at="[0, 0, 0]" :fov="35" />
      <TresPerspectiveCamera v-else key="game" :position="[0, 52, 0.01]" :look-at="[0, 0, 0]" :fov="25" />
      <OrbitControls v-if="view === 'free'" :key="`orbit-${boss.type}`" :enable-pan="false" />

      <BgStarField atmosphere-color="#432097" :galaxy-opacity=".5" :level="boss.chapter" />
      <TresAmbientLight :intensity=".5" color="#7586da" />
      <TresDirectionalLight :intensity="2.5" :position="[5, 10, 7.5]" color="#ffe0b5" />
      <TresDirectionalLight :intensity="1.8" :position="[-8, 5, -4]" color="#496dff" />

      <!-- Na vista do jogo o boss fica de frente para a nave, como o EnemyManager orienta -->
      <TresGroup :rotation="[0, view === 'game' ? Math.PI : angle, 0]" :position="[0, 0, view === 'game' ? -4 : 0]">
        <component
          :is="ENEMY_FLEET[boss.type] ? EnemyFleet : EnemyBoss"
          :key="index"
          :enemy="previewEnemy"
          :preview="true"
          :base-stats="baseStats"
          :set-visual-mesh-ref="noRef"
          :phase="phase"
          :attack-charge="charge"
          :speed="speed"
        />
      </TresGroup>

      <!-- Referência de escala: a nave do jogador e a arena de boss (30 x 30) -->
      <TresGroup :position="view === 'game' ? [0, 0, 8] : [size * 1.9, 0, size * .6]">
        <GameKestrelShip />
      </TresGroup>
      <TresGridHelper v-if="view === 'game'" :args="[30, 10, '#2c4a7a', '#1a2c4a']" />
    </TresCanvas>

    <div class="lab__panel">
      <select v-model.number="index">
        <option v-for="(option, i) in BOSSES" :key="i" :value="i">{{ option.name }} ({{ option.role }})</option>
      </select>
      <span>Fase</span>
      <button v-for="p in [1, 2, 3]" :key="p" :class="{ on: phase === p }" @click="phase = p">{{ p }}</button>
      <button @click="chargeAttack">Carregar ataque</button>
      <button :class="{ on: view === 'free' }" @click="view = 'free'">Vista livre</button>
      <button :class="{ on: view === 'game' }" @click="view = 'game'">Vista do jogo</button>
      <label><input v-model="autoSpin" type="checkbox" /> Girar</label>
      <label>Velocidade {{ speed.toFixed(2) }}x <input v-model.number="speed" type="range" min="0.1" max="3" step="0.05" /></label>
      <NuxtLink to="/play/1">Jogar</NuxtLink>
    </div>

    <div class="lab__card">
      <strong>{{ boss.name }}</strong>
      <span>{{ boss.role }} · tamanho {{ size }}</span>
      <p>{{ boss.idea }}</p>
    </div>
  </main>
</template>

<style scoped>
.lab {
  position: fixed;
  inset: 0;
  background: #071226;
}
.lab__panel {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font: 13px sans-serif;
}
.lab__panel button,
.lab__panel select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.lab__panel button.on {
  background: #2c79c7;
}
.lab__panel a {
  color: #9fd4ff;
}
.lab__card {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 5;
  max-width: min(360px, calc(100vw - 24px));
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font: 13px sans-serif;
}
.lab__card strong {
  display: block;
  font-size: 20px;
}
.lab__card span {
  color: #9fd4ff;
}
.lab__card p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.8);
}
</style>
