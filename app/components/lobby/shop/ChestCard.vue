<script setup lang="ts">
import { EQUIPMENT_RARITIES } from '~/data/equipment';
import { CHESTS, type ChestType } from '~/data/shop';
import { useShopStore } from '~/stores/useShopStore';
import { formatCountdown, pityRemaining } from '~/utils/shop';

// Card do baú: nome + (i), raridades que dropam, baú 3D com balão "xN", garantido, timer do grátis e botão.
const props = defineProps<{ type: ChestType }>();
defineEmits<{ draw: []; info: [] }>();

const shop = useShopStore();
const chest = computed(() => CHESTS[props.type]);
const rarities = computed(() => chest.value.drops.map(drop => EQUIPMENT_RARITIES[drop.rarity]));
const pityRarity = computed(() => EQUIPMENT_RARITIES[chest.value.pity.rarity]);
const remaining = computed(() => pityRemaining(chest.value, shop.pity(props.type)));
const freeReady = computed(() => shop.isFreeReady(props.type));
const freeIn = computed(() => formatCountdown(shop.freeReadyAt(props.type) - shop.now));
const batch = computed(() => shop.chestBatch(props.type));
const hasKeys = computed(() => shop.keys[props.type] > 0);
const highlight = computed(() => freeReady.value || hasKeys.value);
</script>

<template>
  <article
    class="ccard"
    :class="[`is-${type}`, { 'is-highlight': highlight }]"
    :style="{ '--from': chest.theme.cardFrom, '--to': chest.theme.cardTo }"
    :aria-label="chest.name"
  >
    <span class="ccard__shine" aria-hidden="true"></span>
    <header class="ccard__header">
      <h4>{{ chest.name }}</h4>
      <button
        type="button"
        class="ccard__info"
        :class="{ 'is-attention': hasKeys }"
        :aria-label="`Chances do ${chest.name}`"
        data-ui-sound="tap"
        @click="$emit('info')"
      >
        i
      </button>
    </header>

    <p class="ccard__desc">
      Contém 1 peça de equipamento
      <template v-for="(rarity, index) in rarities" :key="rarity.label">
        <span :style="{ color: rarity.color }">{{ rarity.label }}</span>{{ index < rarities.length - 2 ? ', ' : index === rarities.length - 2 ? ' ou ' : '.' }}
      </template>
    </p>

    <div class="ccard__stage">
      <LobbyShopChestPreview :type="type" :glow="highlight" />
      <span class="ccard__balloon" aria-label="Quantidade de baús">x{{ batch }}</span>
      <p class="ccard__pity">
        Equipamento <span :style="{ color: pityRarity.color }">{{ pityRarity.label }}</span>
        garantido em <b>{{ remaining }}</b> {{ remaining === 1 ? 'tentativa' : 'tentativas' }}
      </p>
    </div>

    <p v-if="!freeReady" class="ccard__timer">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      Grátis em {{ freeIn }}
    </p>
    <p v-else class="ccard__timer is-ready">Baú grátis disponível!</p>

    <div class="ccard__action">
      <LobbyShopDrawButton :type="type" compact @draw="$emit('draw')" />
    </div>
  </article>
</template>

<style scoped>
.ccard {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: 16px;
  border: 3px solid #0f1d4a;
  background: linear-gradient(var(--from), var(--to) 70%);
  box-shadow: 0 5px 0 #0f1d4a, inset 0 2px 0 rgba(255, 255, 255, 0.4);
  color: #fff;
}
.ccard.is-highlight {
  box-shadow: 0 5px 0 #0f1d4a, inset 0 2px 0 rgba(255, 255, 255, 0.4), 0 0 18px rgba(255, 230, 120, 0.45);
}
.ccard__shine {
  position: absolute;
  top: 8px;
  left: 10px;
  width: 16px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  rotate: -30deg;
}
.ccard__header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 34px 0;
}
.ccard__header h4 {
  margin: 0;
  font: 19px/1.1 'Lilita One', sans-serif;
  text-align: center;
  -webkit-text-stroke: 4px #10183a;
  paint-order: stroke fill;
}
.ccard__info {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #10183a;
  background: #fff;
  color: #10183a;
  font: italic 17px/1 Georgia, serif;
  font-weight: 700;
  cursor: pointer;
}
.ccard__info.is-attention {
  animation: ccard-attention 1.1s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(255, 220, 90, 0.9);
}
.ccard__desc {
  margin: 4px 8px 0;
  font: 12px/1.25 'Lilita One', sans-serif;
  text-align: center;
  -webkit-text-stroke: 3px #10183a;
  paint-order: stroke fill;
}
.ccard__stage {
  position: relative;
  height: 150px;
  /* Cards lado a lado têm a mesma altura: título/descrição ficam no topo e baú, timer e botão colados
     no fundo, então os baús alinham mesmo quando um título quebra em 2 linhas */
  margin-top: auto;
}
.ccard__balloon {
  position: absolute;
  top: 10px;
  right: 8px;
  display: grid;
  place-items: center;
  min-width: 40px;
  height: 38px;
  padding: 0 6px;
  border-radius: 50% 50% 50% 12%;
  background: radial-gradient(circle at 40% 35%, #fff6c4, #ffd34d 70%);
  border: 2px solid #9a6b00;
  color: #7a4a00;
  font: 17px/1 'Lilita One', sans-serif;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
}
.ccard__pity {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 4px;
  margin: 0;
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(20, 12, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.35);
  font: 11px/1.2 'Lilita One', sans-serif;
  text-align: center;
}
.ccard__timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0;
  padding: 4px;
  background: rgba(10, 16, 44, 0.45);
  font: 13px/1.1 'Lilita One', sans-serif;
}
.ccard__timer svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #fff;
  stroke-width: 2.5;
  stroke-linecap: round;
}
.ccard__timer.is-ready {
  color: #ffe36b;
}
.ccard__action {
  padding: 10px 10px 12px;
  background: linear-gradient(#eaf4ff, #c9dcf3);
}
@keyframes ccard-attention {
  0%,
  100% {
    scale: 1;
    box-shadow: 0 0 0 0 rgba(255, 220, 90, 0.9);
  }
  50% {
    scale: 1.15;
    box-shadow: 0 0 0 6px rgba(255, 220, 90, 0);
  }
}
@media (max-width: 400px) {
  .ccard__header h4 {
    font-size: 16px;
  }
  .ccard__stage {
    height: 128px;
  }
}
</style>
