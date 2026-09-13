<script setup lang="ts">
import { getEquipment, type OwnedEquipment } from '~/utils/equipment';
import type { EquipmentSlot } from '~/data/equipment';

// Card quadrado do item (moldura pela raridade). Sem item, mostra a silhueta do slot vazio.
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
  <div
    class="icard"
    :class="[item ? `is-${item.rarity}` : 'is-empty', { 'is-dimmed': dimmed, 'is-selected': selected }]"
  >
    <div class="icard__art">
      <LobbyEquipmentItemIcon v-if="def" :def-id="def.id" />
      <LobbyEquipmentItemIcon v-else-if="slot" :slot="slot" class="icard__ghost" />
    </div>

    <span v-if="def" class="icard__slot"><LobbyEquipmentItemIcon :slot="def.slot" /></span>
    <span v-if="equippedBadge" class="icard__equipped">E</span>
    <span v-if="upgrade" class="icard__upgrade" aria-label="Melhoria disponível">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 18 11h-5v7H7v-7H2z" /></svg>
    </span>
    <span v-if="fusable" class="icard__fusable" aria-label="Pode fundir">!</span>
    <span v-if="selected" class="icard__check" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m3 13 6 6L21 6" /></svg>
    </span>
  </div>
</template>

<style scoped>
.icard {
  --edge: #6b7384;
  --light: #d7dde6;
  --dark: #8d96a6;
  --glow: transparent;
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16%;
  border: 3px solid var(--edge);
  background: linear-gradient(160deg, var(--light), var(--dark));
  box-shadow:
    0 4px 0 rgba(0, 0, 0, 0.35),
    inset 0 3px 0 rgba(255, 255, 255, 0.35),
    inset 0 0 0 2px var(--glow);
  container-type: inline-size;
  transition:
    filter 0.2s ease,
    opacity 0.2s ease,
    translate 0.2s ease;
}
.icard.is-green { --edge: #257a35; --light: #8ff09a; --dark: #3fae50; }
.icard.is-blue { --edge: #1f4f9c; --light: #8fcbff; --dark: #3d82e0; }
.icard.is-purple { --edge: #5a2a99; --light: #d6a6ff; --dark: #9350e0; }
.icard.is-orange { --edge: #a3570d; --light: #ffe08a; --dark: #f29a24; --glow: #fff2b0; }
.icard.is-red { --edge: #8e1b1b; --light: #ff9a8a; --dark: #e03434; --glow: #ffd07a; }
.icard.is-empty {
  --edge: rgba(255, 255, 255, 0.28);
  background: rgba(10, 18, 40, 0.45);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.2);
  border-style: dashed;
}
.icard.is-dimmed {
  filter: grayscale(0.7) brightness(0.55);
}
.icard.is-selected {
  translate: 0 -2px;
}
.icard__art {
  position: absolute;
  inset: 14%;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.25));
}
.icard__ghost {
  color: rgba(255, 255, 255, 0.3);
}
.icard__slot {
  position: absolute;
  left: 4%;
  top: 4%;
  width: 24%;
  height: 24%;
  padding: 4%;
  border-radius: 50%;
  background: rgba(20, 16, 40, 0.75);
  border: 2px solid rgba(255, 255, 255, 0.85);
  color: #fff;
}
.icard__equipped {
  position: absolute;
  right: 4%;
  bottom: 4%;
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
