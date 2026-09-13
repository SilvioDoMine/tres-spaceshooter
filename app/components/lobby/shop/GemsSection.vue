<script setup lang="ts">
import { GEM_PACKS, type GemPack } from '~/data/shop';
import type { PixProduct } from '~/composables/usePix';
import { useShopStore } from '~/stores/useShopStore';

// Gemas com dinheiro real: cards com bônus da 1ª compra; comprar abre o PIX.
const shop = useShopStore();
const selected = ref<GemPack | null>(null);

const product = computed<PixProduct | null>(() => {
  const pack = selected.value;
  if (!pack) return null;
  const bonus = shop.bonusApplies(pack.id) ? pack.bonus : 0;
  return {
    id: pack.id,
    title: `${pack.gems.toLocaleString('pt-BR')} gemas`,
    subtitle: bonus ? `+ ${bonus.toLocaleString('pt-BR')} bônus` : undefined,
    priceBRL: pack.priceBRL,
    icon: 'gems',
    onPaid: () => `+${shop.creditGemPack(pack.id).toLocaleString('pt-BR')} gemas`,
  };
});
</script>

<template>
  <section class="gems" aria-label="Gemas">
    <LobbyShopSectionTitle title="Gemas" />
    <div class="gems__grid">
      <LobbyShopGemPackCard v-for="pack in GEM_PACKS" :key="pack.id" :pack="pack" @select="selected = pack" />
    </div>
    <LobbyShopPixModal :product="product" @close="selected = null" />
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
