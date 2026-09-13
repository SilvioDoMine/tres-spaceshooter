<script setup lang="ts">
import { EQUIPMENT_RARITIES, EQUIPMENT_SLOTS, SLOT_ORDER, type EquipmentSlot } from '~/data/equipment';
import { useAudio } from '~/composables/useAudio';
import { useEquipmentStore } from '~/stores/useEquipmentStore';
import { formatTalentValue } from '~/utils/talents';
import {
  formatStat,
  fuseRequirement,
  isValidMaterial,
  itemAbilities,
  itemMainStat,
  mechanicStorage,
  nextRarity,
  type OwnedEquipment,
} from '~/utils/equipment';

// Mecânico: escolhe a peça principal, completa com peças iguais e funde (estilo Ferreiro do Archero 2).
const emit = defineEmits<{ back: [] }>();

const store = useEquipmentStore();
const audio = useAudio();

const FUSE_ANIMATION_MS = 900;

const filter = ref<EquipmentSlot | 'all'>('all');
const filterOpen = ref(false);
const mainUid = ref<number | null>(null);
const materialUids = ref<number[]>([]);
const fusing = ref(false);
const fusedItem = ref<OwnedEquipment | null>(null);

const inventory = computed(() => ({ nextUid: 0, items: store.items, equipped: store.equipped }));
const storage = computed(() => mechanicStorage(inventory.value, filter.value));

const main = computed(() => store.findItem(mainUid.value));
const required = computed(() => (main.value ? fuseRequirement(main.value.rarity) : null));
const materialSlots = computed(() => Math.max((required.value ?? 3) - 1, 1));
const materials = computed(() => materialUids.value.map(uid => store.findItem(uid)));
const missing = computed(() => (required.value === null ? 0 : required.value - 1 - materialUids.value.length));
const ready = computed(() => !!main.value && required.value !== null && missing.value === 0);

/** Prévia do resultado: atributo antes → depois e habilidade que será liberada */
const preview = computed(() => {
  if (!main.value) return null;
  const next = nextRarity(main.value.rarity);
  if (!next) return null;
  const { defId, rarity } = main.value;
  return {
    item: { ...main.value, rarity: next },
    label: itemMainStat(defId, rarity).stat === 'damageFlat' ? 'ATQ' : 'HP Máx.',
    from: itemMainStat(defId, rarity).value,
    to: itemMainStat(defId, next).value,
    unlocks: itemAbilities(defId, next)
      .filter(entry => entry.ability.unlock === next)
      .map(({ ability }) => (ability.stat ? formatTalentValue(ability.stat, ability.value ?? 0) : ability.text)),
  };
});

const speech = computed(() => {
  if (fusedItem.value) return { text: 'Fusão concluída! Ficou novinho em folha.' };
  if (!main.value) return { text: 'Bem-vindo ao Mecânico, selecione o equipamento que deseja fundir' };
  if (required.value === null) return { text: 'Esse equipamento já está na qualidade máxima!' };
  if (missing.value > 0) return { text: `Você ainda precisa de ${missing.value} peça(s) de`, strong: 'Mesma peça de equipamento' };
  return { text: 'Tudo pronto! Toque em Fundir.' };
});

function clearSelection() {
  mainUid.value = null;
  materialUids.value = [];
}

function tap(item: OwnedEquipment) {
  if (fusing.value) return;
  fusedItem.value = null;

  if (item.uid === mainUid.value) return clearSelection();
  if (materialUids.value.includes(item.uid)) {
    materialUids.value = materialUids.value.filter(uid => uid !== item.uid);
    return;
  }
  if (main.value && missing.value > 0 && isValidMaterial(inventory.value, main.value, item)) {
    materialUids.value = [...materialUids.value, item.uid];
    return;
  }
  mainUid.value = item.uid;
  materialUids.value = [];
}

function removeMaterial(index: number) {
  if (fusing.value) return;
  materialUids.value = materialUids.value.filter((_, i) => i !== index);
}

function itemState(item: OwnedEquipment) {
  const selected = item.uid === mainUid.value || materialUids.value.includes(item.uid);
  return {
    selected,
    dimmed: !!main.value && !selected && !isValidMaterial(inventory.value, main.value, item),
    fusable: !main.value && store.fusableUids.has(item.uid),
    equippedBadge: Object.values(store.equipped).includes(item.uid),
  };
}

let fuseTimer: ReturnType<typeof setTimeout> | undefined;

function doFuse() {
  if (!ready.value || fusing.value || mainUid.value === null) return;
  fusing.value = true;
  audio.vibrate([20, 60, 20, 60, 40]);

  fuseTimer = setTimeout(() => {
    fusing.value = false;
    const result = store.fuse(mainUid.value!, materialUids.value);
    if (!result) return;
    clearSelection();
    fusedItem.value = result.item;
    audio.playUiSound('fuse');
    confettiOnPageSides(600);
  }, FUSE_ANIMATION_MS);
}

function chooseFilter(value: EquipmentSlot | 'all') {
  filter.value = value;
  filterOpen.value = false;
}

// Esc fecha o filtro ou volta para a tela de equipamento (sem chegar ao lobby)
function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
  event.stopImmediatePropagation();
  if (filterOpen.value) filterOpen.value = false;
  else emit('back');
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onUnmounted(() => {
  window.removeEventListener('keydown', onKey, true);
  clearTimeout(fuseTimer);
});
</script>

<template>
  <section class="mech" aria-label="Mecânico">
    <div class="mech__scene">
      <div class="mech__frame">
      <div class="mech__pipes" aria-hidden="true"><i></i><i></i><i></i></div>

      <div class="mech__machine" :class="{ 'is-fusing': fusing }">
        <div class="mech__box mech__box--result" :class="{ 'is-done': fusedItem }">
          <LobbyEquipmentItemCard v-if="fusedItem" :key="`done-${fusedItem.uid}-${fusedItem.rarity}`" :item="fusedItem" class="mech__fused" />
          <LobbyEquipmentItemCard v-else-if="preview" :item="preview.item" class="mech__ghost" />
        </div>
        <span class="mech__arrow" aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="M10 2 18 11h-5v7H7v-7H2z" /></svg>
        </span>
        <div class="mech__row">
          <button type="button" class="mech__box" aria-label="Peça principal" @click="main && tap(main)">
            <LobbyEquipmentItemCard v-if="main" :item="main" />
          </button>
          <template v-if="main && required !== null">
            <span class="mech__plus" aria-hidden="true">+</span>
            <button
              v-for="index in materialSlots"
              :key="index"
              type="button"
              class="mech__box mech__box--material"
              :aria-label="`Material ${index}`"
              @click="materials[index - 1] && removeMaterial(index - 1)"
            >
              <LobbyEquipmentItemCard v-if="materials[index - 1]" :item="materials[index - 1]" />
              <LobbyEquipmentItemCard v-else :item="main" dimmed class="mech__ghost" />
            </button>
          </template>
        </div>
      </div>

      <div class="mech__bubble">
        {{ speech.text }}
        <b v-if="speech.strong">{{ speech.strong }}</b>
      </div>

      <div v-if="preview && !fusedItem" class="mech__preview">
        <p>
          {{ preview.label }} +{{ formatStat(preview.from) }} →
          <b>+{{ formatStat(preview.to) }}</b>
        </p>
        <p v-for="unlock in preview.unlocks" :key="unlock" class="mech__unlock">
          <span :style="{ color: EQUIPMENT_RARITIES[preview.item.rarity].color }">Nova:</span> {{ unlock }}
        </p>
      </div>

      <!-- Mecânico: robô com óculos e chave inglesa -->
      <svg class="mech__robot" :class="{ 'is-fusing': fusing }" viewBox="0 0 160 200" aria-hidden="true">
        <g stroke="#1b1f2e" stroke-width="4" stroke-linejoin="round">
          <rect x="40" y="110" width="80" height="80" rx="18" fill="#3d6fc4" />
          <rect x="56" y="126" width="48" height="30" rx="8" fill="#2a4f94" />
          <circle cx="80" cy="141" r="8" fill="#ffcf3f" />
          <rect x="30" y="22" width="100" height="84" rx="26" fill="#c8d2e3" />
          <rect x="74" y="4" width="12" height="20" rx="4" fill="#8e9ab3" />
          <circle cx="80" cy="6" r="7" fill="#ff5a4a" />
          <rect x="34" y="46" width="92" height="18" fill="#6b4a2f" />
          <circle cx="60" cy="56" r="17" fill="#bfefff" />
          <circle cx="100" cy="56" r="17" fill="#bfefff" />
          <circle cx="62" cy="58" r="6" fill="#1b1f2e" stroke-width="0" />
          <circle cx="98" cy="58" r="6" fill="#1b1f2e" stroke-width="0" />
          <rect x="58" y="80" width="44" height="12" rx="6" fill="#ff8a3d" />
          <rect x="10" y="122" width="30" height="16" rx="8" fill="#c8d2e3" />
          <g class="mech__wrench">
            <rect x="118" y="118" width="30" height="16" rx="8" fill="#c8d2e3" />
            <path d="M140 126 150 60" stroke="#8e9ab3" stroke-width="10" stroke-linecap="round" />
            <path d="M140 42a14 14 0 1 0 22 12l-8-2-2-8z" fill="#aab6cc" />
          </g>
        </g>
      </svg>

      <button type="button" class="mech__fuse" :disabled="!ready || fusing" data-ui-sound="confirm" @click="doFuse">
        {{ fusing ? 'Fundindo...' : 'Fundir' }}
      </button>
      </div>
    </div>

    <div class="mech__toolbar">
      <div class="mech__toolbar-inner">
      <div class="mech__filter">
        <button type="button" class="mech__filter-btn" :aria-expanded="filterOpen" @click="filterOpen = !filterOpen">
          <span aria-hidden="true">◎</span>
          {{ filter === 'all' ? 'Filtrar' : EQUIPMENT_SLOTS[filter].label }}
          <span aria-hidden="true">▾</span>
        </button>
        <Transition name="mech-drop">
          <ul v-if="filterOpen" class="mech__filter-list">
            <li><button type="button" :class="{ 'is-active': filter === 'all' }" @click="chooseFilter('all')">Todos</button></li>
            <li v-for="slot in SLOT_ORDER" :key="slot">
              <button type="button" :class="{ 'is-active': filter === slot }" @click="chooseFilter(slot)">
                <LobbyEquipmentItemIcon :slot="slot" class="mech__filter-icon" />
                {{ EQUIPMENT_SLOTS[slot].label }}
              </button>
            </li>
          </ul>
        </Transition>
      </div>
      <h3 class="mech__title">Armazém</h3>
      </div>
    </div>

    <div class="mech__storage allow-scroll">
      <TransitionGroup v-if="storage.length" tag="div" name="mech-grid" class="mech__grid">
        <button
          v-for="item in storage"
          :key="item.uid"
          type="button"
          class="mech__cell"
          :aria-label="`${store.slotOf(item).label} ${EQUIPMENT_RARITIES[item.rarity].label}`"
          @click="tap(item)"
        >
          <LobbyEquipmentItemCard :item="item" v-bind="itemState(item)" />
        </button>
      </TransitionGroup>
      <p v-else class="mech__empty">Nenhum equipamento aqui.</p>
    </div>

    <div class="mech__footer">
      <div class="mech__footer-inner">
        <button type="button" class="mech__back" aria-label="Voltar" @click="emit('back')">
          <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M14 2 2 12l12 10v-6h24V8H14z" /></svg>
        </button>
        <span class="mech__mode">Fusão Normal</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mech {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  flex-direction: column;
  background: #1b2240;
  color: #fff;
}
/* -- Cena ------------------------------------------------------------------ */
.mech__scene {
  position: relative;
  flex-shrink: 0;
  height: clamp(300px, 46vh, 420px);
  padding-top: 72px;
  overflow: hidden;
  background:
    radial-gradient(circle at 70% 60%, rgba(255, 190, 110, 0.12), transparent 55%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0 2px, transparent 2px 80px),
    linear-gradient(#3a3345, #2a2433 60%, #3b2e2a);
  border-bottom: 4px solid #121830;
}
/* Conteúdo da cena numa coluna centralizada (mesma largura máxima dos talentos); o fundo segue em tela cheia */
.mech__frame {
  position: absolute;
  inset: 0;
  width: min(100%, 620px);
  margin-inline: auto;
}
.mech__toolbar-inner,
.mech__footer-inner {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}
.mech__toolbar-inner {
  gap: 12px;
}
.mech__footer-inner {
  justify-content: space-between;
}
.mech__pipes i {
  position: absolute;
  background: linear-gradient(#5b6478, #3a4152);
  border: 3px solid #1d2130;
  border-radius: 10px;
}
.mech__pipes i:nth-child(1) {
  left: 18%;
  right: 30%;
  bottom: 22%;
  height: 16px;
}
.mech__pipes i:nth-child(2) {
  left: 40%;
  top: 34%;
  width: 16px;
  bottom: 22%;
}
.mech__pipes i:nth-child(3) {
  left: 8%;
  width: 40%;
  top: 30%;
  height: 16px;
}
.mech__machine {
  position: absolute;
  left: 4%;
  bottom: 8%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  z-index: 2;
}
.mech__machine.is-fusing {
  animation: mech-shake 0.12s linear infinite;
}
.mech__row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mech__box {
  position: relative;
  width: clamp(58px, 17vw, 80px);
  aspect-ratio: 1;
  padding: 6px;
  border-radius: 14px;
  background: #2b1d18;
  border: 4px solid #a35a2c;
  box-shadow: inset 0 0 0 3px #5a3218, 0 4px 0 rgba(0, 0, 0, 0.4);
  cursor: pointer;
}
.mech__box--result {
  width: clamp(72px, 21vw, 100px);
  cursor: default;
}
.mech__machine.is-fusing .mech__box--result {
  box-shadow: inset 0 0 0 3px #5a3218, 0 0 24px 6px #ffcf5a;
}
.mech__box--material {
  width: clamp(50px, 14vw, 68px);
}
.mech__ghost {
  opacity: 0.45;
}
.mech__fused {
  animation: mech-pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.mech__box.is-done {
  box-shadow: inset 0 0 0 3px #5a3218, 0 0 20px 4px rgba(255, 220, 120, 0.8);
}
.mech__arrow {
  width: 26px;
  height: 26px;
  margin-left: calc(clamp(58px, 17vw, 80px) / 2 - 13px);
}
.mech__arrow svg {
  width: 100%;
  fill: #46e05a;
  stroke: #0f5d1f;
  stroke-width: 2;
  animation: icard-arrow 1s ease-in-out infinite;
}
.mech__plus {
  font: 28px/1 'Lilita One', sans-serif;
  color: #46e05a;
  -webkit-text-stroke: 4px #0f5d1f;
  paint-order: stroke fill;
}
.mech__bubble {
  position: absolute;
  top: 80px;
  right: 16px;
  z-index: 3;
  max-width: min(260px, 62%);
  padding: 10px 14px;
  border-radius: 14px;
  background: #f5f6fa;
  color: #22252f;
  font: 14px/1.3 'Lilita One', sans-serif;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
}
.mech__bubble::after {
  content: '';
  position: absolute;
  right: 28%;
  bottom: -10px;
  border: 10px solid transparent;
  border-top-color: #f5f6fa;
  border-bottom: 0;
}
.mech__bubble b {
  display: block;
  color: #c98a00;
  font-weight: normal;
}
.mech__preview {
  position: absolute;
  top: calc(80px + 70px);
  left: 40%;
  z-index: 3;
  max-width: 54%;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(10, 10, 18, 0.85);
  border: 2px solid #2d2d3d;
  font: 13px/1.35 'Fredoka One', sans-serif;
}
.mech__preview p {
  margin: 0;
}
.mech__preview b {
  color: #5dff6e;
  font-weight: normal;
}
.mech__unlock {
  font-size: 11px;
  color: #d6dcf0;
}
.mech__robot {
  position: absolute;
  right: 2%;
  bottom: -6px;
  width: clamp(110px, 30vw, 170px);
  filter: drop-shadow(0 6px 0 rgba(0, 0, 0, 0.3));
}
.mech__wrench {
  transform-origin: 132px 126px;
}
.mech__robot.is-fusing .mech__wrench {
  animation: mech-hammer 0.3s ease-in-out infinite;
}
.mech__fuse {
  position: absolute;
  left: 50%;
  bottom: 10px;
  z-index: 4;
  translate: -20% 0;
  padding: 8px 22px;
  border-radius: 14px;
  border: 3px solid #8a5a00;
  background: linear-gradient(#ffe27a, #ffb321);
  box-shadow: 0 4px 0 #8a5a00, inset 0 2px 0 #fff6c8;
  font: 20px 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 5px #8a4b00;
  paint-order: stroke fill;
  cursor: pointer;
}
.mech__fuse:not(:disabled) {
  animation: mech-ready 1.2s ease-in-out infinite;
}
.mech__fuse:disabled {
  filter: grayscale(1) brightness(0.8);
  cursor: default;
}
/* -- Barra e armazém --------------------------------------------------------- */
.mech__toolbar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: linear-gradient(#2c3966, #222c52);
  border-bottom: 3px solid #121830;
}
.mech__filter {
  position: relative;
}
.mech__filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 12px;
  border: 3px solid #3e1a78;
  background: linear-gradient(#c58bff, #8a47e6);
  box-shadow: 0 3px 0 #3e1a78, inset 0 2px 0 rgba(255, 255, 255, 0.4);
  font: 17px 'Lilita One', sans-serif;
  color: #fff;
  cursor: pointer;
}
.mech__filter-list {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  min-width: 180px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: 12px;
  background: #1a1f38;
  border: 3px solid #0d1024;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
}
.mech__filter-list button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  font: 15px 'Fredoka One', sans-serif;
  color: #d9e2f5;
  text-align: left;
  cursor: pointer;
}
.mech__filter-list button.is-active {
  background: rgba(197, 139, 255, 0.25);
  color: #fff;
}
.mech__filter-icon {
  width: 18px;
  height: 18px;
  color: #c58bff;
}
.mech__title {
  flex: 1;
  margin: 0 0 0 -40px;
  text-align: center;
  font: 24px 'Lilita One', sans-serif;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.mech__storage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 14px 80px;
}
.mech__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px 10px;
  max-width: 620px;
  margin: 0 auto;
}
.mech__cell {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.mech__cell:active {
  scale: 0.94;
}
.mech__empty {
  margin: 32px 0;
  text-align: center;
  font: 16px 'Fredoka One', sans-serif;
  color: rgba(255, 255, 255, 0.55);
}
.mech__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: linear-gradient(rgba(18, 22, 44, 0), #12162c 40%);
}
.mech__back {
  width: 64px;
  height: 44px;
  padding: 6px 10px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}
.mech__back svg {
  width: 100%;
  height: 100%;
  fill: #fff;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.5));
}
.mech__mode {
  padding: 6px 14px;
  border-radius: 10px;
  background: linear-gradient(#fff3a8, #ffd24a 45%, #f5b400);
  font: 15px 'Lilita One', sans-serif;
  color: #6b3a08;
}
.mech-grid-move {
  transition: transform 0.3s ease;
}
.mech-grid-leave-active {
  display: none;
}
.mech-drop-enter-active,
.mech-drop-leave-active {
  transition:
    opacity 0.15s ease,
    translate 0.15s ease;
}
.mech-drop-enter-from,
.mech-drop-leave-to {
  opacity: 0;
  translate: 0 -6px;
}
@keyframes mech-shake {
  25% {
    translate: -2px 1px;
  }
  75% {
    translate: 2px -1px;
  }
}
@keyframes mech-pop {
  from {
    scale: 0.3;
    rotate: -12deg;
  }
}
@keyframes mech-hammer {
  50% {
    rotate: -25deg;
  }
}
@keyframes mech-ready {
  50% {
    scale: 1.06;
  }
}
@keyframes icard-arrow {
  50% {
    translate: 0 -3px;
  }
}
</style>
