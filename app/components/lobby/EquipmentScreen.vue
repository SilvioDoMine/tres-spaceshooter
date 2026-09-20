<script setup lang="ts">
// Nave 3D com os slots equipados, resumo ATQ/HP e inventário; o Mecânico abre por cima.
// Não pôr comentário HTML ao lado da raiz do template: em dev ele vira um fragmento
// e a <Transition> de troca de aba deixa de animar a saída desta tela.
import { EQUIPMENT_RARITIES, EQUIPMENT_SLOTS, SLOT_ORDER, type EquipmentSlot } from '~/data/equipment';
import { useEquipmentStore } from '~/stores/useEquipmentStore';
import { definitionOf, sortEquipment, type EquipmentSort } from '~/utils/equipment';

const SORT_KEY = 'equipmentSort';

const store = useEquipmentStore();

const view = ref<'gear' | 'mechanic'>('gear');
const statsOpen = ref(false);
const selectedUid = ref<number | null>(null);

const sort = ref<EquipmentSort>(
  import.meta.client && localStorage.getItem(SORT_KEY) === 'type' ? 'type' : 'quality',
);

function toggleSort() {
  sort.value = sort.value === 'quality' ? 'type' : 'quality';
  localStorage.setItem(SORT_KEY, sort.value);
}

const leftSlots = SLOT_ORDER.filter(slot => EQUIPMENT_SLOTS[slot].side === 'left');
const rightSlots = SLOT_ORDER.filter(slot => EQUIPMENT_SLOTS[slot].side === 'right');

const storedItems = computed(() => sortEquipment(store.unequippedItems, sort.value));

const selected = computed(() => store.findItem(selectedUid.value));
const selectedSlot = computed(() => (selected.value ? definitionOf(selected.value).slot : null));
const selectedEquipped = computed(
  () => !!selected.value && store.equipped[selectedSlot.value!] === selected.value.uid,
);
const compareTo = computed(() =>
  selected.value && !selectedEquipped.value ? store.equippedItem(selectedSlot.value!) : null,
);

function openSlot(slot: EquipmentSlot) {
  const item = store.equippedItem(slot);
  if (item) selectedUid.value = item.uid;
}

function equipSelected() {
  if (selected.value) store.equip(selected.value.uid);
  selectedUid.value = null;
}

function unequipSelected() {
  if (selectedSlot.value) store.unequip(selectedSlot.value);
  selectedUid.value = null;
}
</script>

<template>
  <section class="gear pointer-events-auto" aria-label="Equipamento">
    <div class="gear__stage">
      <LobbyEquipmentShipStage class="gear__ship" />

      <div class="gear__frame">
      <div v-for="side in [leftSlots, rightSlots]" :key="side[0]" class="gear__slots" :class="side === leftSlots ? 'is-left' : 'is-right'">
        <button
          v-for="slot in side"
          :key="slot"
          type="button"
          class="gear__slot"
          :aria-label="EQUIPMENT_SLOTS[slot].label"
          @click="openSlot(slot)"
        >
          <BaseItemTooltip :item="store.equippedItem(slot)" no-tap no-highlight>
            <LobbyEquipmentItemCard :item="store.equippedItem(slot)" :slot="slot" />
          </BaseItemTooltip>
        </button>
      </div>

      <LobbyEquipmentStatBar
        class="gear__stats"
        :damage="store.stats.damage"
        :health="store.stats.maxHealth"
        @info="statsOpen = true"
      />
      </div>
    </div>

    <div class="gear__toolbar">
      <div class="gear__toolbar-inner">
      <button type="button" class="gear__btn" @click="toggleSort">
        {{ sort === 'quality' ? 'Por Qualidade' : 'Por Tipo' }}
      </button>
      <button type="button" class="gear__btn gear__btn--mechanic" @click="view = 'mechanic'">
        Mecânico
        <BaseNotification v-if="store.hasFusable" class="gear__badge" />
      </button>
      </div>
    </div>

    <div class="gear__inventory allow-scroll">
      <TransitionGroup v-if="storedItems.length" tag="div" name="gear-grid" class="gear__grid">
        <button
          v-for="item in storedItems"
          :key="item.uid"
          type="button"
          class="gear__cell"
          :aria-label="`${store.slotOf(item).label} ${EQUIPMENT_RARITIES[item.rarity].label}`"
          @click="selectedUid = item.uid"
        >
          <BaseItemTooltip :item="item" no-tap no-highlight>
            <LobbyEquipmentItemCard :item="item" :upgrade="store.upgradeableUids.has(item.uid)" />
          </BaseItemTooltip>
        </button>
      </TransitionGroup>
      <p v-else class="gear__empty">Todos os seus equipamentos estão equipados.</p>
    </div>

    <Transition name="gear-mech">
      <LobbyEquipmentMechanicScreen v-if="view === 'mechanic'" @back="view = 'gear'" />
    </Transition>

    <LobbyEquipmentItemModal
      :open="!!selected"
      :item="selected"
      :equipped="selectedEquipped"
      :compare-to="compareTo"
      @close="selectedUid = null"
      @equip="equipSelected"
      @unequip="unequipSelected"
    />
    <LobbyEquipmentStatsModal :open="statsOpen" :stats="store.stats" @close="statsOpen = false" />
  </section>
</template>

<style scoped>
.gear {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 72px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1d2440;
  color: #fff;
}
/* -- Nave e slots -------------------------------------------------------------- */
.gear__stage {
  position: relative;
  flex-shrink: 0;
  height: clamp(330px, 50vh, 460px);
  padding-top: 72px;
}
.gear__ship {
  position: absolute;
  inset: 0;
}
/* Slots e ATQ/HP numa coluna centralizada (mesma largura máxima dos talentos); a cena 3D segue em tela cheia */
.gear__frame {
  position: absolute;
  inset: 0;
  width: min(100%, 620px);
  margin-inline: auto;
  pointer-events: none;
}
.gear__stats {
  pointer-events: auto;
}
.gear__slots {
  position: absolute;
  top: 78px;
  bottom: 62px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}
.gear__slots.is-left {
  left: 12px;
}
.gear__slots.is-right {
  right: 12px;
}
.gear__slot {
  height: min(31%, 20vw, 82px);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  pointer-events: auto;
}
.gear__slot:active {
  scale: 0.94;
}
.gear__stats {
  position: absolute;
  left: 50%;
  bottom: 10px;
  translate: -50% 0;
}
/* -- Barra --------------------------------------------------------------------- */
.gear__toolbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 620px;
  margin: 0 auto;
}
.gear__toolbar {
  padding: 10px 14px;
  background: linear-gradient(#2c3966, #222c52);
  border-top: 3px solid #121830;
  border-bottom: 3px solid #121830;
}
.gear__btn {
  position: relative;
  padding: 7px 16px;
  border-radius: 12px;
  border: 3px solid #8a5a00;
  background: linear-gradient(#ffe27a, #ffb321);
  box-shadow: 0 3px 0 #8a5a00, inset 0 2px 0 #fff6c8;
  font: 17px 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 4px #8a4b00;
  paint-order: stroke fill;
  cursor: pointer;
}
.gear__btn:active {
  translate: 0 2px;
  box-shadow: 0 1px 0 #8a5a00, inset 0 2px 0 #fff6c8;
}
.gear__btn--mechanic {
  min-width: 128px;
}
.gear__badge {
  translate: 40% -45%;
  scale: 1.3;
  -webkit-text-stroke: 0;
}
/* -- Inventário ---------------------------------------------------------------- */
.gear__inventory {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 14px 24px;
}
.gear__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px 10px;
  max-width: 620px;
  margin: 0 auto;
}
.gear__cell {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.gear__cell:active {
  scale: 0.94;
}
.gear__empty {
  margin: 28px 0;
  text-align: center;
  font: 16px 'Fredoka One', sans-serif;
  color: rgba(255, 255, 255, 0.55);
}
.gear-grid-move,
.gear-grid-enter-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.gear-grid-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.gear-grid-leave-active {
  display: none;
}
.gear-mech-enter-active,
.gear-mech-leave-active {
  transition: translate 0.3s ease;
}
.gear-mech-enter-from,
.gear-mech-leave-to {
  translate: 100% 0;
}
/* Desktop (tela larga + mouse): itens menores e mais refinados */
@media (min-width: 900px) and (hover: hover) and (pointer: fine) {
  .gear__grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px 8px;
  }
  .gear__slot {
    height: min(31%, 70px);
  }
}
@media (max-height: 500px) and (orientation: landscape) {
  .gear {
    bottom: 56px;
  }
}
</style>
