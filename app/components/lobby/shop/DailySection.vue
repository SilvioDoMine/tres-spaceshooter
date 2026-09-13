<script setup lang="ts">
import { useAudio } from '~/composables/useAudio';
import { useItemGrantPopup } from '~/composables/useItemGrantPopup';
import { useShopStore } from '~/stores/useShopStore';
import { formatCountdown, offerRemaining } from '~/utils/shop';

// Loja Diária: itens sorteados do dia com estoque; renova às 04:00 (GMT-3).
const shop = useShopStore();
const audio = useAudio();
const grantPopup = useItemGrantPopup();

const countdown = computed(() => formatCountdown(shop.nextReset - shop.now));

const selectedIndex = ref<number | null>(null);
const selected = computed(() => (selectedIndex.value === null ? null : shop.dailyOffers[selectedIndex.value] ?? null));
/** O modal de detalhe espera um item do inventário; na loja ainda não tem uid */
const previewItem = computed(() => (selected.value ? { uid: 0, defId: selected.value.defId, rarity: selected.value.rarity } : null));

function open(index: number) {
  const offer = shop.dailyOffers[index];
  if (!offer || offerRemaining(offer) <= 0) return;
  selectedIndex.value = index;
}

function buy() {
  if (selectedIndex.value === null) return;
  const item = shop.buyDailyOffer(selectedIndex.value);
  if (!item) {
    audio.playUiSound('close');
    return;
  }
  selectedIndex.value = null;
  grantPopup.show([item]);
}
</script>

<template>
  <section class="daily" aria-label="Loja Diária">
    <LobbyShopSectionTitle title="Loja Diária" :subtitle="`Atualiza em ${countdown}`" />

    <div class="daily__grid">
      <LobbyShopDailyOfferCard
        v-for="(offer, index) in shop.dailyOffers"
        :key="`${shop.state.daily.dayKey}-${index}`"
        :offer="offer"
        :can-afford="shop.canPay(offer.price.currency, offer.price.amount)"
        @select="open(index)"
      />
    </div>

    <LobbyEquipmentItemModal
      :open="!!selected"
      :item="previewItem"
      :equipped="false"
      :price="selected?.price ?? null"
      :can-afford="!!selected && shop.canPay(selected.price.currency, selected.price.amount)"
      @close="selectedIndex = null"
      @buy="buy"
    />
  </section>
</template>

<style scoped>
.daily__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
</style>
