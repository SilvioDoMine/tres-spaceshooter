<script setup lang="ts">
import { CHESTS, type ChestType } from '~/data/shop';
import { useShopStore } from '~/stores/useShopStore';

// Botão verde de abrir baú. Estados: Grátis, Sortear xN com chaves, Sortear x1 com gemas, ou sem saldo (desativado).
const props = withDefaults(defineProps<{ type: ChestType; label?: string; compact?: boolean }>(), {
  label: 'Sortear',
  compact: false,
});
defineEmits<{ draw: [] }>();

const shop = useShopStore();
const chest = computed(() => CHESTS[props.type]);
const state = computed(() => shop.chestState(props.type));
const batch = computed(() => shop.chestBatch(props.type));
const keys = computed(() => shop.keys[props.type]);
const disabled = computed(() => state.value === 'insufficient');
</script>

<template>
  <button
    type="button"
    class="dbtn"
    :class="{ 'is-disabled': disabled, 'is-compact': compact }"
    :disabled="disabled"
    data-ui-sound="confirm"
    :aria-label="
      state === 'free'
        ? `Abrir ${chest.name} grátis`
        : state === 'keys'
          ? `${label} ${batch} com chaves`
          : `${label} 1 por ${chest.gemCost} gemas`
    "
    @click="$emit('draw')"
  >
    <span class="dbtn__gloss" aria-hidden="true"></span>
    <template v-if="state === 'free'">
      <span class="dbtn__label">Abrir x1</span>
      <span class="dbtn__cost">Grátis</span>
    </template>
    <template v-else-if="state === 'keys'">
      <span class="dbtn__label">{{ label }} x{{ batch }}</span>
      <span class="dbtn__cost"><SvgKeyIcon :type="type" :size="22" /> {{ keys }}/{{ batch }}</span>
    </template>
    <template v-else>
      <span class="dbtn__label">{{ label }} x1</span>
      <span class="dbtn__cost" :class="{ 'is-short': disabled }">
        <SvgGemIcon :size="22" :sparkle="false" /> x{{ chest.gemCost }}
      </span>
    </template>
    <span v-if="state === 'free' || state === 'keys'" class="dbtn__badge" aria-hidden="true"><BaseNotification /></span>
  </button>
</template>

<style scoped>
.dbtn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: 62px;
  padding: 6px 10px 8px;
  border-radius: 14px;
  border: 3px solid #1a6a0a;
  background: linear-gradient(#8ef06a 0%, #56d43a 50%, #37b41e 100%);
  box-shadow: 0 5px 0 #1a6a0a, 0 8px 14px rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  transition: translate 0.1s ease, box-shadow 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}
.dbtn:not(:disabled):active {
  translate: 0 4px;
  box-shadow: 0 1px 0 #1a6a0a, 0 3px 8px rgba(0, 0, 0, 0.25);
}
.dbtn__gloss {
  position: absolute;
  top: 4px;
  left: 8%;
  right: 8%;
  height: 40%;
  border-radius: 10px 10px 40px 40px;
  background: linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}
.dbtn__label,
.dbtn__cost {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: 20px/1 'Lilita One', sans-serif;
  -webkit-text-stroke: 4px #1b5a10;
  paint-order: stroke fill;
  white-space: nowrap;
}
.dbtn__cost {
  font-size: 19px;
}
.dbtn__cost.is-short {
  color: #ff7676;
}
.dbtn.is-disabled {
  cursor: not-allowed;
  border-color: #4d5566;
  background: linear-gradient(#b9c0cc, #8a93a3);
  box-shadow: 0 5px 0 #4d5566;
}
.dbtn.is-disabled .dbtn__label {
  -webkit-text-stroke-color: #3b4252;
}
.dbtn__badge {
  position: absolute;
  top: -10px;
  right: -6px;
  width: 24px;
  height: 24px;
  animation: dbtn-pulse 1s ease-in-out infinite;
}
.dbtn.is-compact {
  min-height: 54px;
}
.dbtn.is-compact .dbtn__label {
  font-size: 17px;
}
.dbtn.is-compact .dbtn__cost {
  font-size: 16px;
}
@keyframes dbtn-pulse {
  50% {
    scale: 1.2;
  }
}
</style>
