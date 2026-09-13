<script setup lang="ts">
import type { ShopPrice } from '~/data/shop';
import { useShopStore } from '~/stores/useShopStore';
import { formatShort } from '~/utils/shop';

// Confirmação de compra de ouro com gemas.
const props = defineProps<{ open: boolean; gold: number; price: ShopPrice | null }>();
defineEmits<{ close: []; confirm: [] }>();

const shop = useShopStore();
const canAfford = computed(() => !!props.price && shop.canPay(props.price.currency, props.price.amount));
</script>

<template>
  <LobbyShopDialog :open="open" title="Confirmação de Compra" @close="$emit('close')">
    <div class="confirm">
      <p>Você deseja comprar o seguinte item?</p>
      <div class="confirm__item">
        <SvgCoinIcon :size="64" />
        <span>{{ formatShort(gold) }}</span>
      </div>
      <p v-if="!canAfford" class="confirm__short">Gemas insuficientes</p>
    </div>

    <template #actions>
      <button type="button" class="confirm__btn" :disabled="!canAfford" data-ui-sound="confirm" @click="$emit('confirm')">
        <LobbyShopPriceTag v-if="price" :currency="price.currency" :amount="price.amount" :insufficient="!canAfford" :size="30" />
      </button>
    </template>
  </LobbyShopDialog>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 6px 0 12px;
  text-align: center;
}
.confirm p {
  margin: 0;
  font-size: 17px;
  color: #4a3420;
}
.confirm__item {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 16px;
  border: 3px solid #6b7384;
  background: linear-gradient(160deg, #d7dde6, #8d96a6);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
}
.confirm__item span {
  position: absolute;
  right: 6px;
  bottom: 2px;
  font: 18px/1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 4px #10183a;
  paint-order: stroke fill;
}
.confirm .confirm__short {
  font-size: 14px;
  color: #d23b3b;
}
.confirm__btn {
  min-width: 180px;
  padding: 10px 24px;
  border-radius: 14px;
  border: 3px solid #1a6a0a;
  background: linear-gradient(#8ef06a, #37b41e);
  box-shadow: 0 5px 0 #1a6a0a;
  cursor: pointer;
}
.confirm__btn:active:not(:disabled) {
  translate: 0 4px;
  box-shadow: 0 1px 0 #1a6a0a;
}
.confirm__btn:disabled {
  filter: grayscale(0.8);
  cursor: not-allowed;
}
</style>
