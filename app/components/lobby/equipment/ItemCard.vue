<script setup lang="ts">
import { getEquipment, type OwnedEquipment } from '~/utils/equipment';
import type { EquipmentSlot } from '~/data/equipment';

// Card quadrado do item (moldura rebaixada pela raridade, ver BaseRarityFrame). Sem item, mostra a silhueta do slot vazio.
const props = defineProps<{
  item?: OwnedEquipment | null;
  /** Slot mostrado quando está vazio */
  slot?: EquipmentSlot;
  equippedBadge?: boolean;
  fusable?: boolean;
  upgrade?: boolean;
  selected?: boolean;
  dimmed?: boolean;
}>();

const def = computed(() => (props.item ? getEquipment(props.item.defId) : null));
</script>

<template>
  <BaseRarityFrame
    class="icard"
    :class="{ 'is-dimmed': dimmed, 'is-selected': selected }"
    :rarity="item ? item.rarity : 'empty'"
  >
    <LobbyEquipmentItemIcon v-if="def" :def-id="def.id" class="icard__art" />
    <LobbyEquipmentItemIcon v-else-if="slot" :slot="slot" class="icard__art icard__ghost" />

    <template #overlay>
      <span v-if="def" class="icard__slot"><LobbyEquipmentItemIcon :slot="def.slot" /></span>
      <span v-if="equippedBadge" class="icard__equipped">E</span>
      <span v-if="upgrade" class="icard__upgrade" aria-label="Melhoria disponível">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 18 11h-5v7H7v-7H2z" /></svg>
      </span>
      <span v-if="fusable" class="icard__fusable" aria-label="Pode fundir">!</span>
      <span v-if="selected" class="icard__check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m3 13 6 6L21 6" /></svg>
      </span>
    </template>
  </BaseRarityFrame>
</template>

<style scoped>
.icard {
  transition:
    filter 0.2s ease,
    opacity 0.2s ease,
    translate 0.2s ease;
}
.icard.is-dimmed {
  filter: grayscale(0.7) brightness(0.55);
}
.icard.is-selected {
  translate: 0 -2px;
}
.icard__art {
  width: 100%;
  height: 100%;
}
.icard__ghost {
  color: rgba(255, 255, 255, 0.3);
}
/* Selo do slot no canto, por cima do anel (como no Archero) */
.icard__slot {
  position: absolute;
  z-index: 2;
  left: -3%;
  top: -3%;
  width: 27%;
  height: 27%;
  padding: 4.5%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #3a3452, #15122a);
  border: max(1.5px, 2.2cqw) solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 max(1px, 1.5cqw) 0 rgba(0, 0, 0, 0.35);
  color: #fff;
}
.icard__equipped {
  position: absolute;
  z-index: 2;
  right: 5%;
  bottom: 7%;
  display: grid;
  place-items: center;
  width: 26%;
  height: 26%;
  border-radius: 6px;
  background: #1e8fb3;
  border: 2px solid #d8f6ff;
  font: 14cqw/1 'Lilita One', sans-serif;
  color: #fff;
}
.icard__upgrade {
  position: absolute;
  z-index: 2;
  right: -6%;
  bottom: -6%;
  width: 34%;
  height: 34%;
  padding: 6%;
  border-radius: 8px;
  background: #33c24a;
  border: 2px solid #0f5d1f;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  animation: icard-bob 1.2s ease-in-out infinite;
}
.icard__upgrade svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: #fff;
}
.icard__fusable {
  position: absolute;
  z-index: 2;
  right: -7%;
  top: -7%;
  display: grid;
  place-items: center;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a8a, #e41b1b 55%, #a50d0d);
  border: 2px solid #fff;
  font: 22cqw/1 'Lilita One', sans-serif;
  color: #fff;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  animation: icard-bob 1.2s ease-in-out infinite;
}
.icard__check {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background: rgba(10, 20, 30, 0.45);
}
.icard__check svg {
  width: 60%;
  fill: none;
  stroke: #5dff6e;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 0 #0b5a17);
}
@keyframes icard-bob {
  50% {
    translate: 0 -3px;
  }
}
</style>
