<script setup lang="ts">
import type { GemPack } from '~/data/shop';
import { useShopStore } from '~/stores/useShopStore';
import { formatBRL } from '~/utils/shop';

// Card roxo de pacote de gemas: tag verde de bônus (quando vale), quantidade, arte, nome e preço em R$.
const props = defineProps<{ pack: GemPack }>();
defineEmits<{ select: [] }>();

const shop = useShopStore();
const bonus = computed(() => shop.bonusApplies(props.pack.id));
</script>

<template>
  <button
    type="button"
    class="gpack"
    data-ui-sound="tap"
    :aria-label="`${pack.gems} gemas${bonus ? ` mais ${pack.bonus} de bônus` : ''} por ${formatBRL(pack.priceBRL)}`"
    @click="$emit('select')"
  >
    <span v-if="bonus" class="gpack__bonus">Bônus: {{ pack.bonus.toLocaleString('pt-BR') }}</span>
    <span class="gpack__shine" aria-hidden="true"></span>
    <strong class="gpack__amount">{{ pack.gems.toLocaleString('pt-BR') }}</strong>
    <span class="gpack__art"><LobbyShopPackArt kind="gems" :art="pack.art" /></span>
    <span class="gpack__name">{{ pack.name }}</span>
    <span class="gpack__price">{{ formatBRL(pack.priceBRL) }}</span>
  </button>
</template>

<style scoped>
.gpack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 10px 0 0;
  border-radius: 14px;
  border: 3px solid #2a0f5c;
  background: linear-gradient(#c05cff 0%, #9a3cf0 45%, #7a24d6 100%);
  box-shadow: 0 5px 0 #2a0f5c, inset 0 2px 0 rgba(255, 255, 255, 0.4);
  color: #fff;
  cursor: pointer;
  transition: translate 0.12s ease, box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.gpack:active {
  translate: 0 3px;
  box-shadow: 0 2px 0 #2a0f5c, inset 0 2px 0 rgba(255, 255, 255, 0.4);
}
.gpack__bonus {
  position: absolute;
  top: -12px;
  right: -4px;
  padding: 3px 8px;
  border-radius: 4px 4px 4px 0;
  background: linear-gradient(#6ff06a, #2fb52a);
  border: 2px solid #135c10;
  font: 12px/1 'Lilita One', sans-serif;
  color: #0e3f0b;
  white-space: nowrap;
}
.gpack__shine {
  position: absolute;
  top: 7px;
  left: 9px;
  width: 14px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  rotate: -30deg;
}
.gpack__amount {
  font: 26px/1 'Lilita One', sans-serif;
  -webkit-text-stroke: 5px #2a0f5c;
  paint-order: stroke fill;
}
.gpack__art {
  display: block;
  width: 88%;
}
.gpack__name {
  font: 13px/1.1 'Lilita One', sans-serif;
  -webkit-text-stroke: 3px #2a0f5c;
  paint-order: stroke fill;
  white-space: nowrap;
}
.gpack__price {
  align-self: stretch;
  margin-top: 6px;
  padding: 8px 2px;
  border-radius: 0 0 11px 11px;
  background: linear-gradient(#eef6ff, #c9dcf3);
  font: 19px/1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 4px #1c3a78;
  paint-order: stroke fill;
  white-space: nowrap;
}
@media (max-width: 400px) {
  .gpack__amount {
    font-size: 21px;
  }
  .gpack__name {
    font-size: 11px;
  }
  .gpack__price {
    font-size: 15px;
  }
}
</style>
