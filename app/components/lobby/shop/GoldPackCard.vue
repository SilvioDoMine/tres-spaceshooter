<script setup lang="ts">
import type { GoldPack } from '~/data/shop';
import { useShopStore } from '~/stores/useShopStore';

// Card azul de pacote de ouro: quantidade, arte, nome e preço (gemas ou Grátis com estoque).
const props = defineProps<{ pack: GoldPack; grantedNonce?: number }>();
defineEmits<{ select: [] }>();

const shop = useShopStore();
const remaining = computed(() => shop.goldRemaining(props.pack.id));
const soldOut = computed(() => remaining.value <= 0);
const limited = computed(() => props.pack.stock !== null);
const insufficient = computed(() => !!props.pack.price && !shop.canPay(props.pack.price.currency, props.pack.price.amount));
</script>

<template>
  <button
    type="button"
    class="opack"
    :class="{ 'is-sold-out': soldOut }"
    :disabled="soldOut"
    data-ui-sound="tap"
    :aria-label="`${pack.gold} de ouro, ${pack.price ? `${pack.price.amount} gemas` : 'grátis'}`"
    @click="$emit('select')"
  >
    <span v-if="limited && !soldOut" class="opack__stock" aria-label="Restantes hoje">{{ remaining }}</span>
    <span class="opack__shine" aria-hidden="true"></span>
    <strong class="opack__amount">{{ pack.gold.toLocaleString('pt-BR') }}</strong>
    <span class="opack__art"><LobbyShopPackArt kind="gold" :art="pack.art" /></span>
    <span class="opack__name">{{ pack.name }}</span>
    <span class="opack__price">
      <template v-if="soldOut">Volta amanhã</template>
      <LobbyShopPriceTag v-else-if="pack.price" :currency="pack.price.currency" :amount="pack.price.amount" :insufficient="insufficient" />
      <template v-else>
        <svg class="opack__play" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="18" rx="5" /><path d="M10 8v8l6-4z" /></svg>
        Grátis
      </template>
    </span>
    <span v-if="grantedNonce" :key="grantedNonce" class="opack__gain" aria-hidden="true">+{{ pack.gold.toLocaleString('pt-BR') }}</span>
  </button>
</template>

<style scoped>
.opack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 10px 0 0;
  border-radius: 14px;
  border: 3px solid #0f2a66;
  background: linear-gradient(#4db5ff, #2a86e8 60%);
  box-shadow: 0 5px 0 #0f2a66, inset 0 2px 0 rgba(255, 255, 255, 0.45);
  color: #fff;
  cursor: pointer;
  transition: translate 0.12s ease, box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.opack:not(:disabled):active {
  translate: 0 3px;
  box-shadow: 0 2px 0 #0f2a66, inset 0 2px 0 rgba(255, 255, 255, 0.45);
}
.opack__stock {
  position: absolute;
  top: -10px;
  right: -6px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a8a, #e41b1b 55%, #a50d0d);
  border: 2px solid #fff;
  font: 14px/1 'Lilita One', sans-serif;
}
.opack__shine {
  position: absolute;
  top: 7px;
  left: 9px;
  width: 14px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  rotate: -30deg;
}
.opack__amount {
  font: 24px/1 'Lilita One', sans-serif;
  -webkit-text-stroke: 5px #0f2a66;
  paint-order: stroke fill;
}
.opack__art {
  display: block;
  width: 86%;
}
.opack__name {
  font: 12px/1.1 'Lilita One', sans-serif;
  -webkit-text-stroke: 3px #0f2a66;
  paint-order: stroke fill;
  white-space: nowrap;
}
.opack__price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  align-self: stretch;
  min-height: 40px;
  margin-top: 6px;
  border-radius: 0 0 11px 11px;
  background: linear-gradient(#eef6ff, #c9dcf3);
  font: 19px/1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 4px #1c3a78;
  paint-order: stroke fill;
}
.opack__play {
  width: 24px;
  height: 24px;
}
.opack__play rect {
  fill: #7b5cff;
  stroke: #10183a;
  stroke-width: 2;
}
.opack__play path {
  fill: #fff;
}
.opack__gain {
  position: absolute;
  top: 40%;
  left: 50%;
  translate: -50% 0;
  font: 24px/1 'Lilita One', sans-serif;
  color: #ffe36b;
  -webkit-text-stroke: 5px #6b3a08;
  paint-order: stroke fill;
  pointer-events: none;
  animation: opack-gain 1.2s ease-out forwards;
}
.opack.is-sold-out {
  cursor: default;
  filter: grayscale(0.7) brightness(0.8);
}
.opack.is-sold-out .opack__price {
  font-size: 14px;
}
@keyframes opack-gain {
  from {
    opacity: 1;
    translate: -50% 0;
    scale: 0.6;
  }
  30% {
    scale: 1.2;
  }
  to {
    opacity: 0;
    translate: -50% -70px;
    scale: 1;
  }
}
@media (max-width: 400px) {
  .opack__amount {
    font-size: 18px;
  }
  .opack__name {
    font-size: 10px;
  }
}
</style>
