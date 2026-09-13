<script setup lang="ts">
import { EQUIPMENT_RARITIES, EQUIPMENT_SLOTS } from '~/data/equipment';
import { formatTalentValue } from '~/utils/talents';
import { formatStat, getEquipment, itemAbilities, itemMainStat, type OwnedEquipment } from '~/utils/equipment';
import type { ShopPrice } from '~/data/shop';

// Detalhe do item: arte, nome, atributo principal, habilidades por raridade e Equipar/Desequipar.
// Com `price` (Loja), o botão vira Comprar.
const props = defineProps<{
  open: boolean;
  item: OwnedEquipment | null;
  equipped: boolean;
  /** Item equipado no mesmo slot (para comparar antes de trocar) */
  compareTo?: OwnedEquipment | null;
  price?: ShopPrice | null;
  canAfford?: boolean;
}>();
const emit = defineEmits<{ close: []; equip: []; unequip: []; buy: [] }>();

const def = computed(() => (props.item ? getEquipment(props.item.defId) : null));
const rarity = computed(() => (props.item ? EQUIPMENT_RARITIES[props.item.rarity] : null));
const main = computed(() => (props.item ? itemMainStat(props.item.defId, props.item.rarity) : null));
const mainLabel = computed(() => (main.value?.stat === 'damageFlat' ? 'ATQ' : 'HP Máx.'));
const abilities = computed(() => (props.item ? itemAbilities(props.item.defId, props.item.rarity) : []));

const compare = computed(() => {
  if (!props.compareTo || !main.value) return null;
  const current = itemMainStat(props.compareTo.defId, props.compareTo.rarity).value;
  return { current, diff: main.value.value - current };
});

const abilityText = (ability: (typeof abilities.value)[number]['ability']) =>
  ability.stat ? formatTalentValue(ability.stat, ability.value ?? 0) : (ability.text ?? TALENT_STATS_LABEL_FALLBACK);

function onKey(event: KeyboardEvent) {
  if (!props.open || event.key !== 'Escape') return;
  event.stopImmediatePropagation();
  emit('close');
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onUnmounted(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="imodal">
      <div v-if="open && item && def && rarity && main" class="imodal" role="dialog" aria-modal="true" :aria-label="def.name" @click="emit('close')">
        <div class="imodal__panel" :class="`is-${item.rarity}`" @click.stop>
          <header class="imodal__header">
            <h2 :style="{ color: rarity.color }">{{ def.name }}</h2>
            <p>
              <span class="imodal__rarity" :style="{ background: rarity.color }">{{ rarity.label }}</span>
              {{ EQUIPMENT_SLOTS[def.slot].label }}
            </p>
            <button type="button" class="imodal__close" aria-label="Fechar" @click="emit('close')">✕</button>
          </header>

          <div class="imodal__top">
            <div class="imodal__art"><LobbyEquipmentItemCard :item="item" /></div>
            <div class="imodal__main">
              <span>{{ mainLabel }}</span>
              <strong>+{{ formatStat(main.value) }}</strong>
              <small v-if="compare" :class="compare.diff > 0 ? 'is-up' : compare.diff < 0 ? 'is-down' : ''">
                Equipado: +{{ formatStat(compare.current) }}
                <template v-if="compare.diff !== 0">({{ compare.diff > 0 ? '▲ +' : '▼ ' }}{{ formatStat(compare.diff) }})</template>
              </small>
            </div>
          </div>

          <p class="imodal__description">{{ def.description }}</p>

          <ul class="imodal__abilities">
            <li v-for="(entry, index) in abilities" :key="index" :class="{ 'is-locked': !entry.unlocked }">
              <i :style="{ background: EQUIPMENT_RARITIES[entry.ability.unlock].color }" aria-hidden="true"></i>
              <span>{{ abilityText(entry.ability) }}</span>
              <small v-if="!entry.unlocked">Libera em {{ EQUIPMENT_RARITIES[entry.ability.unlock].label }}</small>
            </li>
          </ul>

          <button
            v-if="price"
            type="button"
            class="imodal__action is-buy"
            :class="{ 'is-short': !canAfford }"
            :disabled="!canAfford"
            data-ui-sound="confirm"
            @click="emit('buy')"
          >
            <span>Comprar</span>
            <LobbyShopPriceTag :currency="price.currency" :amount="price.amount" :insufficient="!canAfford" />
          </button>
          <button
            v-else-if="equipped"
            type="button"
            class="imodal__action is-unequip"
            data-ui-sound="toggleOff"
            @click="emit('unequip')"
          >
            Desequipar
          </button>
          <button v-else type="button" class="imodal__action" data-ui-sound="confirm" @click="emit('equip')">
            {{ compareTo ? 'Trocar' : 'Equipar' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.imodal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgba(6, 8, 22, 0.78);
}
.imodal__panel {
  --tint: #9aa3b2;
  position: relative;
  width: min(380px, 100%);
  max-height: calc(100dvh - 48px);
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  overscroll-behavior: contain;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(#2c3a63, #1b2340);
  border: 3px solid #0f1530;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 2px rgba(255, 255, 255, 0.08);
  color: #fff;
}
.imodal__header {
  padding-right: 36px;
}
.imodal__header h2 {
  margin: 0;
  font: 26px/1.1 'Lilita One', sans-serif;
  -webkit-text-stroke: 5px #0f1530;
  paint-order: stroke fill;
}
.imodal__header p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 0;
  font: 14px 'Fredoka One', sans-serif;
  color: #b9c6e4;
}
.imodal__rarity {
  padding: 1px 10px;
  border-radius: 999px;
  color: #1b1030;
  font-family: 'Lilita One', sans-serif;
}
.imodal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 0;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}
.imodal__top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
}
.imodal__art {
  width: 104px;
  flex-shrink: 0;
}
.imodal__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: 'Lilita One', sans-serif;
}
.imodal__main span {
  font-size: 16px;
  color: #b9c6e4;
}
.imodal__main strong {
  font-size: 34px;
  line-height: 1;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.45);
}
.imodal__main small {
  font: 13px 'Fredoka One', sans-serif;
  color: #b9c6e4;
}
.imodal__main small.is-up {
  color: #7dff8a;
}
.imodal__main small.is-down {
  color: #ff7b7b;
}
.imodal__description {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  font: 13px/1.4 'Fredoka One', sans-serif;
  color: #d5def2;
}
.imodal__abilities {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}
.imodal__abilities li {
  display: grid;
  grid-template-columns: 12px 1fr;
  align-items: center;
  column-gap: 8px;
  font: 14px/1.3 'Fredoka One', sans-serif;
}
.imodal__abilities i {
  width: 12px;
  height: 12px;
  rotate: 45deg;
  border-radius: 2px;
  border: 2px solid #0f1530;
}
.imodal__abilities small {
  grid-column: 2;
  font-size: 11px;
  color: #8e9abb;
}
.imodal__abilities li.is-locked span {
  color: #7d88a6;
}
.imodal__abilities li.is-locked i {
  filter: grayscale(1) brightness(0.7);
}
.imodal__action {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border-radius: 14px;
  border: 3px solid #8a5a00;
  background: linear-gradient(#ffe27a, #ffb321);
  box-shadow: 0 4px 0 #8a5a00, inset 0 2px 0 #fff6c8;
  font: 22px 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 5px #8a4b00;
  paint-order: stroke fill;
  cursor: pointer;
}
.imodal__action:active {
  translate: 0 3px;
  box-shadow: 0 1px 0 #8a5a00, inset 0 2px 0 #fff6c8;
}
.imodal__action.is-unequip {
  border-color: #1e4f8c;
  background: linear-gradient(#8fd0ff, #3d8be0);
  box-shadow: 0 4px 0 #1e4f8c, inset 0 2px 0 #d9f0ff;
  -webkit-text-stroke-color: #1a3f75;
}
.imodal__action.is-buy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-color: #1a7a0a;
  background: linear-gradient(#8ef06a, #3cc41c);
  box-shadow: 0 4px 0 #1a7a0a, inset 0 2px 0 #d4ffc2;
  -webkit-text-stroke-color: #145c08;
}
.imodal__action.is-buy.is-short {
  filter: grayscale(0.8) brightness(0.85);
  cursor: not-allowed;
}
.imodal-enter-active,
.imodal-leave-active {
  transition: opacity 0.2s ease;
}
.imodal-enter-active .imodal__panel {
  transition: scale 0.25s cubic-bezier(0.3, 1.5, 0.6, 1);
}
.imodal-enter-from,
.imodal-leave-to {
  opacity: 0;
}
.imodal-enter-from .imodal__panel {
  scale: 0.85;
}
</style>
