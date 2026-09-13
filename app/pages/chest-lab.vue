<script setup lang="ts">
import { EQUIPMENT_RARITIES } from '~/data/equipment';
import { CHEST_ORDER, CHESTS, type ChestType } from '~/data/shop';
import { useChestOpening } from '~/composables/useChestOpening';
import { useEquipmentStore } from '~/stores/useEquipmentStore';

// Bancada da animação do baú (só em dev): troca tipo/raridade, repete e ajusta a velocidade.
if (!import.meta.dev) await navigateTo('/');

const type = ref<ChestType>('silver');
const high = ref(false);
const speed = ref(1);
const playId = ref(0);
const skipId = ref(0);
const sceneKey = computed(() => `${type.value}`);
const halo = computed(() => EQUIPMENT_RARITIES[high.value ? CHESTS[type.value].pity.rarity : CHESTS[type.value].drops[0]!.rarity].color);
const status = ref('');

const replay = () => {
  status.value = '';
  playId.value++;
};

/** Abre de verdade pela tela global (itens vão para o inventário) */
function openReal(count: number) {
  const equipment = useEquipmentStore();
  const chest = CHESTS[type.value];
  const items = Array.from({ length: count }, (_, i) =>
    equipment.grantRandom(i === count - 1 && high.value ? chest.pity.rarity : chest.drops[0]!.rarity),
  );
  useChestOpening().start({ type: type.value, mode: 'keys', items });
}
</script>

<template>
  <main class="lab" :style="{ '--from': CHESTS[type].theme.openingFrom, '--to': CHESTS[type].theme.openingTo }">
    <TresCanvas :key="sceneKey" :alpha="true" :clear-alpha="0" :dpr="[1, 1.5]">
      <LobbyShopChestScene
        :type="type"
        :halo-color="halo"
        :high="high"
        :play-id="playId"
        :skip-id="skipId"
        :speed="speed"
        @opened="status = 'aberto'"
        @done="status = 'fim'"
      />
    </TresCanvas>

    <div class="lab__panel">
      <select v-model="type">
        <option v-for="option in CHEST_ORDER" :key="option" :value="option">{{ CHESTS[option].name }}</option>
      </select>
      <label><input v-model="high" type="checkbox" /> Raridade garantida</label>
      <label>Velocidade {{ speed.toFixed(2) }}x <input v-model.number="speed" type="range" min="0.1" max="2" step="0.05" /></label>
      <button @click="replay">Repetir</button>
      <button @click="skipId++">Pular</button>
      <button @click="openReal(1)">Abrir 1 (tela real)</button>
      <button @click="openReal(10)">Abrir 10 (tela real)</button>
      <NuxtLink to="/">Lobby</NuxtLink>
      <span>{{ status }}</span>
    </div>
  </main>
</template>

<style scoped>
.lab {
  position: fixed;
  inset: 0;
  background: linear-gradient(var(--from), var(--to));
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
.lab__panel a {
  color: #9fd4ff;
}
</style>
