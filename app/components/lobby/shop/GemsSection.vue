<script setup lang="ts">
import { GEM_PACKS, type GemPack } from '~/data/shop';

// Gemas com dinheiro real: cards com bônus da 1ª compra; comprar abre o PIX.
const selected = ref<GemPack | null>(null);
</script>

<template>
  <section class="gems" aria-label="Gemas">
    <LobbyShopSectionTitle title="Gemas" />
    <div class="gems__grid">
      <LobbyShopGemPackCard v-for="pack in GEM_PACKS" :key="pack.id" :pack="pack" @select="selected = pack" />
    </div>
    <LobbyShopPixModal :pack="selected" @close="selected = null" />
  </section>
</template>

<style scoped>
.gems__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 10px;
  padding-top: 10px;
}
</style>
