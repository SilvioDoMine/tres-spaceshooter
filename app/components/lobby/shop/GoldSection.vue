<script setup lang="ts">
import { GOLD_PACKS, type GoldPack } from '~/data/shop';
import { useAudio } from '~/composables/useAudio';
import { useShopStore } from '~/stores/useShopStore';

// Ouro comprado com gemas (com confirmação) e um pacote grátis com estoque diário.
const shop = useShopStore();
const audio = useAudio();

const confirming = ref<GoldPack | null>(null);
/** Último pacote entregue: o card mostra o "+N" subindo */
const lastGranted = ref<{ id: string; nonce: number } | null>(null);

function select(pack: GoldPack) {
  if (shop.goldRemaining(pack.id) <= 0) return;
  if (pack.price) confirming.value = pack;
  else buy(pack);
}

function buy(pack: GoldPack) {
  const gold = shop.buyGoldPack(pack.id);
  confirming.value = null;
  if (!gold) {
    audio.playUiSound('close');
    return;
  }
  audio.playUiSound('fuse');
  audio.vibrate([15, 30, 15]);
  lastGranted.value = { id: pack.id, nonce: Date.now() };
}
</script>

<template>
  <section class="gold" aria-label="Ouro">
    <LobbyShopSectionTitle title="Ouro" />
    <div class="gold__grid">
      <LobbyShopGoldPackCard
        v-for="pack in GOLD_PACKS"
        :key="pack.id"
        :pack="pack"
        :granted-nonce="lastGranted?.id === pack.id ? lastGranted.nonce : 0"
        @select="select(pack)"
      />
    </div>

    <LobbyShopConfirmModal
      :open="!!confirming"
      :gold="confirming?.gold ?? 0"
      :price="confirming?.price ?? null"
      @close="confirming = null"
      @confirm="confirming && buy(confirming)"
    />
  </section>
</template>

<style scoped>
.gold__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding-top: 10px;
}
</style>
