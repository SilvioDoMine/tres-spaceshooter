<script setup lang="ts">
import { CHEST_ORDER, type ChestType } from '~/data/shop';
import { useAudio } from '~/composables/useAudio';
import { useChestOpening } from '~/composables/useChestOpening';
import { useShopStore } from '~/stores/useShopStore';

// Baús de equipamento: cards lado a lado; abrir inicia a animação global.
const shop = useShopStore();
const audio = useAudio();
const opening = useChestOpening();

const infoType = ref<ChestType | null>(null);

function draw(type: ChestType) {
  const result = shop.openChest(type);
  if (!result) {
    audio.playUiSound('close');
    return;
  }
  opening.start(result);
}
</script>

<template>
  <section class="chests" aria-label="Baús de Equipamento">
    <LobbyShopSectionTitle title="Baú de Equipamento" />
    <div class="chests__grid">
      <LobbyShopChestCard v-for="type in CHEST_ORDER" :key="type" :type="type" @draw="draw(type)" @info="infoType = type" />
    </div>
    <LobbyShopChestInfoModal :type="infoType" @close="infoType = null" />
  </section>
</template>

<style scoped>
.chests__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
</style>
