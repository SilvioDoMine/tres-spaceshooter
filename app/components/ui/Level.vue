<script setup lang="js">
import { computed, ref, nextTick, watch } from 'vue';
import { playableRoomCount } from '~/utils/progression';

// HUD de nível/EXP/sala no estilo do Archero 2: barra larga de vidro escuro translúcido com preenchimento
// dourado (reflexo, ponta luminosa e brilho correndo), aba "Nv." pendurada em cima e a sala numa pílula
// embaixo. Ganhar EXP pisca a barra; subir de nível passa um clarão pela barra e dá um "pop" na aba.
const currentRunStore = useCurrentRunStore();

const totalRooms = computed(() => playableRoomCount(currentRunStore.levelConfig));
const currentRoom = computed(() => playableRoomCount(
  currentRunStore.levelConfig,
  currentRunStore.currentStageIndex,
));
const showRoom = computed(() => currentRunStore.currentStage?.type !== 'intro' && currentRoom.value > 0);
const isCombatRoom = computed(() => ['combat', 'boss'].includes(currentRunStore.currentStage?.type));

// Controla se a largura anima (desligada no instante em que a barra volta para o começo)
const shouldTransition = ref(true);

const progressPercentage = computed(() => {
  const currentExp = currentRunStore.currentExp;
  const expToNextLevel = currentRunStore.expToNextLevel;

  if (expToNextLevel === 0) return 100;

  return Math.min((currentExp / expToNextLevel) * 100, 100);
});

// Barra voltou para trás (subiu de nível): pula direto para o novo valor sem animar a descida
watch(progressPercentage, (next, prev) => {
  if (next >= prev) return;
  shouldTransition.value = false;
  nextTick(() => setTimeout(() => (shouldTransition.value = true), 30));
});

// Cada efeito é um elemento com :key; trocar a key remonta e a animação toca de novo
const gainKey = ref(0);
const levelUpKey = ref(0);

watch(() => currentRunStore.currentExp, (next, prev) => {
  if (next > prev) gainKey.value++;
});

watch(() => currentRunStore.currentLevel, (next, prev) => {
  if (next > prev) levelUpKey.value++;
});
</script>

<template>
  <div class="lvhud">
    <div class="lvhud__bar">
      <!-- Aba do nível pendurada em cima da barra -->
      <div :key="`tab-${levelUpKey}`" class="lvhud__tab" :class="{ 'is-pop': levelUpKey > 0 }">
        Nv.<b>{{ currentRunStore.currentLevel }}</b>
      </div>

      <!-- Barra de EXP -->
      <div
        class="lvhud__track"
        role="progressbar"
        aria-label="Experiência da nave"
        :aria-valuenow="Math.round(progressPercentage)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="lvhud__fill"
          :class="{ 'no-transition': !shouldTransition }"
          :style="{ width: `${progressPercentage}%` }"
        >
          <span class="lvhud__gloss" aria-hidden="true"></span>
          <span class="lvhud__shimmer" aria-hidden="true"></span>
          <span v-if="progressPercentage > 0" class="lvhud__head" aria-hidden="true"></span>
          <span v-if="gainKey > 0" :key="`gain-${gainKey}`" class="lvhud__gain" aria-hidden="true"></span>
        </div>

        <!-- Clarão de nível novo atravessando a barra -->
        <span v-if="levelUpKey > 0" :key="`flash-${levelUpKey}`" class="lvhud__flash" aria-hidden="true"></span>
      </div>

      <!-- Sala: pílula escura com o ícone num círculo, presa embaixo da barra -->
      <div v-if="showRoom" :key="`room-${currentRoom}`" class="lvhud__room">
        <span class="lvhud__room-icon" aria-hidden="true">
          <!-- Icon sword -->
          <svg v-if="isCombatRoom" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m19.05 21.6l-2.925-2.9l-1.5 1.5q-.275.275-.7.275t-.7-.275q-.575-.575-.575-1.425t.575-1.425l4.225-4.225q.575-.575 1.425-.575t1.425.575q.275.275.275.7t-.275.7l-1.5 1.5l2.9 2.925q.3.3.3.7t-.3.7l-1.25 1.25q-.3.3-.7.3t-.7-.3M21.7 6.2L10.65 17.25l.125.1q.575.575.575 1.425t-.575 1.425q-.275.275-.7.275t-.7-.275l-1.5-1.5l-2.925 2.9q-.3.3-.7.3t-.7-.3L2.3 20.35q-.3-.3-.3-.7t.3-.7l2.9-2.925l-1.5-1.5q-.275-.275-.275-.7t.275-.7q.575-.575 1.425-.575t1.425.575l.1.125L17.425 2.475q.275-.275.638-.425t.762-.15H21q.425 0 .713.288T22 2.9v2.575q0 .2-.075.388T21.7 6.2M6.225 10.125l-3.65-3.65Q2.3 6.2 2.15 5.838T2 5.075V2.9q0-.425.288-.712T3 1.9h2.175q.4 0 .763.15t.637.425l3.65 3.65q.3.3.3.713t-.3.712L7.65 10.125q-.3.3-.712.3t-.713-.3"/></svg>
          <!-- Gift icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><!-- Icon from Teenyicons by smhmd - https://github.com/teenyicons/teenyicons/blob/master/LICENSE --><path fill="currentColor" fill-rule="evenodd" d="M4.5 0A2.5 2.5 0 0 0 2 2.5v.286c0 .448.133.865.362 1.214H1.5A1.5 1.5 0 0 0 0 5.5v1A1.5 1.5 0 0 0 1.5 8H7V4h1v4h5.5A1.5 1.5 0 0 0 15 6.5v-1A1.5 1.5 0 0 0 13.5 4h-.862c.229-.349.362-.766.362-1.214V2.5A2.5 2.5 0 0 0 10.5 0c-1.273 0-2.388.68-3 1.696A3.5 3.5 0 0 0 4.5 0M8 4h2.786C11.456 4 12 3.456 12 2.786V2.5A1.5 1.5 0 0 0 10.5 1A2.5 2.5 0 0 0 8 3.5zM7 4H4.214C3.544 4 3 3.456 3 2.786V2.5A1.5 1.5 0 0 1 4.5 1A2.5 2.5 0 0 1 7 3.5z" clip-rule="evenodd"/><path fill="currentColor" d="M7 9H1v3.5A2.5 2.5 0 0 0 3.5 15H7zm1 6h3.5a2.5 2.5 0 0 0 2.5-2.5V9H8z"/></svg>
        </span>
        <span class="lvhud__room-count">{{ currentRoom }}<small>/{{ totalRooms }}</small></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lvhud {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  width: 100%;
  /* Barra alinhada ao centro dos cantos de pausa/ouro (mt-6 + h-10 do UiResources) */
  padding-top: 36px;
  pointer-events: none;
  font-family: 'Lilita One', sans-serif;
  color: #fff;
}

.lvhud__bar {
  position: relative;
  width: min(30rem, calc(100vw - 200px));
}

/* ==================== Aba do nível ==================== */
.lvhud__tab {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: calc(100% - 2px);
  translate: -50% 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 4px 22px 3px;
  background: rgba(10, 8, 20, 0.8);
  clip-path: polygon(14% 0, 86% 0, 100% 100%, 0 100%);
  font-size: 13px;
  line-height: 1;
  letter-spacing: 0.3px;
  color: #ffe9a8;
  white-space: nowrap;
  -webkit-text-stroke: 3px rgba(10, 8, 20, 0.9);
  paint-order: stroke fill;
}
.lvhud__tab b {
  font-size: 17px;
  font-weight: 400;
  color: #fff;
}
.lvhud__tab.is-pop {
  animation: lvhud-tab-pop 0.6s cubic-bezier(0.3, 1.8, 0.5, 1);
}

/* ==================== Barra de vidro escuro ==================== */
.lvhud__track {
  position: relative;
  height: 16px;
  overflow: hidden;
  border-radius: 6px;
  border: 2px solid rgba(10, 8, 20, 0.7);
  background: rgba(10, 8, 20, 0.45);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 2px 3px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.lvhud__fill {
  position: relative;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(180deg, #fff09a 0%, #ffd23a 45%, #f5b212 60%, #e89a06 100%);
  box-shadow: 0 0 10px rgba(255, 200, 60, 0.55);
  transition: width 0.45s cubic-bezier(0.25, 1, 0.5, 1);
}
.lvhud__fill.no-transition {
  transition: none;
}

/* Reflexo na metade de cima */
.lvhud__gloss {
  position: absolute;
  top: 1px;
  left: 4px;
  right: 4px;
  height: 40%;
  border-radius: 999px;
  background: linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.1));
}

/* Brilho correndo dentro do preenchimento */
.lvhud__shimmer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
}
.lvhud__shimmer::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 48px;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  translate: -60px 0;
  animation: lvhud-shimmer 2.6s ease-in-out infinite;
}

/* Ponta luminosa na borda do preenchimento */
.lvhud__head {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 5px;
  border-radius: 999px;
  background: #fffbe0;
  box-shadow: 0 0 8px 3px rgba(255, 230, 120, 0.9);
}

/* Ganhou EXP: o preenchimento clareia na ponta e apaga */
.lvhud__gain {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 30%, rgba(255, 255, 255, 0.9));
  opacity: 0;
  animation: lvhud-gain 0.45s ease-out;
}

/* Subiu de nível: clarão atravessando a barra inteira */
.lvhud__flash {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, rgba(255, 250, 200, 0.95) 50%, transparent 80%);
  translate: -100% 0;
  animation: lvhud-flash 0.7s ease-out forwards;
}

/* ==================== Sala ==================== */
.lvhud__room {
  position: absolute;
  left: 50%;
  top: calc(100% + 5px);
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px 2px 2px;
  border-radius: 999px;
  background: rgba(10, 8, 20, 0.55);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  animation: lvhud-room-in 0.4s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.lvhud__room-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #173f7d;
  background: linear-gradient(#7cc8ff, #2a74db);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.45);
  color: #fff;
}
.lvhud__room-icon svg {
  width: 14px;
  height: 14px;
  filter: drop-shadow(0 1px 0 #173f7d);
}
.lvhud__room-count {
  font-size: 18px;
  line-height: 1;
  color: #fff;
  -webkit-text-stroke: 4px rgba(10, 8, 20, 0.85);
  paint-order: stroke fill;
}
.lvhud__room-count small {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

/* ==================== Animações ==================== */
@keyframes lvhud-shimmer {
  0%, 40% { translate: -60px 0; }
  100% { translate: 560px 0; }
}
@keyframes lvhud-gain {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes lvhud-flash {
  to { translate: 100% 0; }
}
@keyframes lvhud-tab-pop {
  0% { scale: 1; filter: brightness(1); }
  40% { scale: 1.4; filter: brightness(2); }
  100% { scale: 1; filter: brightness(1); }
}
@keyframes lvhud-room-in {
  from { opacity: 0; scale: 0.7; }
  to { opacity: 1; scale: 1; }
}

@media (max-width: 480px) {
  .lvhud__bar {
    width: calc(100vw - 180px);
  }
  .lvhud__track {
    height: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lvhud__shimmer::before,
  .lvhud__gain,
  .lvhud__flash,
  .lvhud__tab.is-pop,
  .lvhud__room {
    animation: none;
  }
  .lvhud__flash {
    display: none;
  }
}
</style>
