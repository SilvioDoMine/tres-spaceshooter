<script setup lang="ts">
import { EQUIPMENT_RARITIES } from '~/data/equipment';
import { getEquipment } from '~/utils/equipment';
import { offerRemaining, type DailyOffer } from '~/utils/shop';

// Card da Loja Diária: nome, item, compras restantes e preço. Sem estoque fica apagado com um check.
const props = defineProps<{ offer: DailyOffer; canAfford: boolean }>();
defineEmits<{ select: [] }>();

const def = computed(() => getEquipment(props.offer.defId));
const remaining = computed(() => offerRemaining(props.offer));
const soldOut = computed(() => remaining.value <= 0);
const item = computed(() => ({ uid: 0, defId: props.offer.defId, rarity: props.offer.rarity }));
</script>

<template>
  <button
    type="button"
    class="offer"
    :class="{ 'is-sold-out': soldOut }"
    :disabled="soldOut"
    :aria-label="soldOut ? `${def?.name}: sem estoque` : `${def?.name}, ${EQUIPMENT_RARITIES[offer.rarity].label}`"
    @click="$emit('select')"
  >
    <span class="offer__shine" aria-hidden="true"></span>
    <strong class="offer__name">{{ def?.name }}</strong>
    <span class="offer__item"><LobbyEquipmentItemCard :item="item" /></span>

    <span v-if="soldOut" class="offer__stock is-out">Sem Estoque</span>
    <span v-else class="offer__stock">Chances de compra restantes: {{ remaining }}</span>

    <span class="offer__footer">
      <svg v-if="soldOut" class="offer__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 13 5 5L20 6" /></svg>
      <LobbyShopPriceTag v-else :currency="offer.price.currency" :amount="offer.price.amount" :insufficient="!canAfford" />
    </span>
  </button>
</template>

<style scoped>
.offer {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 8px 6px 0;
  overflow: hidden;
  border-radius: 14px;
  border: 3px solid #0f2a66;
  background: linear-gradient(#4db5ff, #2a86e8 55%, #2379dc);
  box-shadow: 0 5px 0 #0f2a66, inset 0 2px 0 rgba(255, 255, 255, 0.45);
  color: #fff;
  cursor: pointer;
  text-align: center;
  transition: translate 0.12s ease, box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.offer:not(:disabled):active {
  translate: 0 3px;
  box-shadow: 0 2px 0 #0f2a66, inset 0 2px 0 rgba(255, 255, 255, 0.45);
}
.offer__shine {
  position: absolute;
  top: 6px;
  left: 8px;
  width: 14px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  rotate: -30deg;
}
.offer__name {
  display: -webkit-box;
  min-height: 2.3em;
  font: 15px/1.15 'Lilita One', sans-serif;
  -webkit-text-stroke: 3px #0f2a66;
  paint-order: stroke fill;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.offer__item {
  display: block;
  width: min(72px, 62%);
  margin: 4px 0 6px;
}
.offer__stock {
  min-height: 2.4em;
  font: 12px/1.2 'Lilita One', sans-serif;
  color: #0e3a8a;
}
.offer__stock.is-out {
  display: grid;
  place-items: center;
  font-size: 14px;
  color: #cfd8ea;
}
.offer__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  height: 40px;
  margin: 0 -6px;
  background: linear-gradient(#e9f4ff, #c7def7);
  border-top: 2px solid rgba(15, 42, 102, 0.25);
}
.offer__check {
  width: 30px;
  fill: none;
  stroke: #36d34c;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 0 #0b5a17);
}
.offer.is-sold-out {
  cursor: default;
  background: linear-gradient(#4a6c96, #3b5a82);
  border-color: #1d2c48;
  box-shadow: 0 5px 0 #1d2c48;
}
.offer.is-sold-out .offer__name {
  color: #cfd8ea;
  -webkit-text-stroke-color: #1d2c48;
}
.offer.is-sold-out .offer__item {
  filter: grayscale(0.6) brightness(0.75);
}
.offer.is-sold-out .offer__footer {
  background: linear-gradient(#7f93b3, #6a7fa0);
}
@media (max-width: 400px) {
  .offer__name {
    font-size: 13px;
  }
  .offer__stock {
    font-size: 10px;
  }
}
</style>
