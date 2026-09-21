<script setup lang="ts">
import { EQUIPMENT_RARITIES, EQUIPMENT_SLOTS } from '~/data/equipment';
import { SIMPLE_ITEMS, type SimpleItemId } from '~/data/items';
import { getRandomEquipment, randomEquipmentSlotLabel, sanitizeDrop, type RandomEquipmentDrop } from '~/data/randomEquipment';
import { formatTalentValue } from '~/utils/talents';
import { formatStat, getEquipment, itemAbilities, itemMainStat, type OwnedEquipment } from '~/utils/equipment';

// Tooltip de item: envolve qualquer gatilho (o ícone/card que já está na tela) e descreve o que ele é.
// Três variantes: `item` (equipamento) abre a ficha completa no estilo WoW — raridade, atributo principal,
// descrição e habilidades; `drop` (equipamento ainda não sorteado: "Arma Aleatória") mostra raridade,
// slot e o que vai acontecer no resgate; `resource` (ouro, gemas, exp, chaves...) abre a versão simples
// de nome + descrição.
// Desktop abre no hover; touch abre no toque (e fecha ao tocar fora, rolar ou apertar Esc).
const props = withDefaults(
  defineProps<{
    /** Equipamento: variante completa */
    item?: OwnedEquipment | null;
    /** Sorteio de equipamento ainda não realizado (~/data/randomEquipment) */
    drop?: RandomEquipmentDrop | null;
    /** Item simples do catálogo (~/data/items): variante enxuta */
    resource?: SimpleItemId | null;
    /** Desliga o tooltip e o realce do gatilho (ex.: card vazio) */
    disabled?: boolean;
    /** Não aplica o realce de hover no gatilho (quem envolve já tem o seu) */
    noHighlight?: boolean;
    /** Só hover: o toque não abre. Para onde tocar já faz outra coisa (abrir a ficha, comprar...) */
    noTap?: boolean;
  }>(),
  { item: null, drop: null, resource: null, disabled: false, noHighlight: false, noTap: false },
);

const GAP = 12;
const MARGIN = 8;

const trigger = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const open = ref(false);
// Aberto por toque: aí o painel precisa receber eventos para o toque nele não vazar para o que está atrás
const touchOpen = ref(false);
const position = reactive({ top: 0, left: 0, arrow: 0, side: 'bottom' as 'top' | 'bottom' });

const def = computed(() => (props.item ? getEquipment(props.item.defId) : null));
const rarity = computed(() => (props.item ? EQUIPMENT_RARITIES[props.item.rarity] : null));
const main = computed(() => (props.item ? itemMainStat(props.item.defId, props.item.rarity) : null));
const mainLabel = computed(() => (main.value?.stat === 'damageFlat' ? 'ATQ' : 'HP Máx.'));
const abilities = computed(() => (props.item ? itemAbilities(props.item.defId, props.item.rarity) : []));
const simple = computed(() => (props.resource ? SIMPLE_ITEMS[props.resource] : null));

// Sorteio: o item ainda não existe, então o painel descreve a promessa (nome do slot + raridade)
const drop = computed(() => (props.drop ? sanitizeDrop(props.drop) : null));
const dropDef = computed(() => (drop.value ? getRandomEquipment(drop.value.slot) : null));
const dropRarity = computed(() => (drop.value ? EQUIPMENT_RARITIES[drop.value.rarity] : null));

const hasEquipment = computed(() => !!def.value && !!rarity.value && !!main.value);
const available = computed(() => !props.disabled && (hasEquipment.value || !!dropDef.value || !!simple.value));

const abilityText = (ability: (typeof abilities.value)[number]['ability']) =>
  ability.stat ? formatTalentValue(ability.stat, ability.value ?? 0) : (ability.text ?? '');

/** Posiciona o painel acima do gatilho; se não couber, joga para baixo. A seta segue o centro do gatilho. */
async function place() {
  await nextTick();
  const anchor = trigger.value;
  const box = panel.value;
  if (!anchor || !box) return;

  const rect = anchor.getBoundingClientRect();
  const width = box.offsetWidth;
  const height = box.offsetHeight;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  const fitsAbove = rect.top - GAP - height >= MARGIN;
  position.side = fitsAbove ? 'bottom' : 'top';
  position.top = fitsAbove
    ? rect.top - GAP - height
    : Math.max(MARGIN, Math.min(rect.bottom + GAP, viewportHeight - MARGIN - height));

  const centre = rect.left + rect.width / 2;
  position.left = Math.max(MARGIN, Math.min(centre - width / 2, viewportWidth - MARGIN - width));
  position.arrow = Math.max(14, Math.min(centre - position.left, width - 14));
}

function show(byTouch = false) {
  if (!available.value) return;
  touchOpen.value = byTouch;
  if (open.value) return;
  open.value = true;
  place();
}

function hide() {
  open.value = false;
}

// Mouse abre no hover; toque abre no clique. `pointerType` separa os dois em aparelhos híbridos.
let lastPointer = '';

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse') show();
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') hide();
}

function onClick() {
  if (lastPointer === 'mouse' || props.noTap) return;
  if (open.value) hide();
  else show(true);
}

function onDocumentPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse') return;
  const target = event.target as Node | null;
  if (target && trigger.value?.contains(target)) return;
  hide();
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value || event.key !== 'Escape') return;
  event.stopImmediatePropagation();
  hide();
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    window.addEventListener('keydown', onKeydown, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    window.removeEventListener('keydown', onKeydown, true);
    window.removeEventListener('scroll', hide, true);
    window.removeEventListener('resize', hide);
  }
});

// O item pode trocar com o tooltip aberto (fusão, navegação na mochila, marco seguinte)
watch(() => props.item?.uid, hide);
watch(() => props.resource, hide);
watch(() => [props.drop?.slot, props.drop?.rarity].join(), hide);
watch(available, (ok) => {
  if (!ok) hide();
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  window.removeEventListener('keydown', onKeydown, true);
  window.removeEventListener('scroll', hide, true);
  window.removeEventListener('resize', hide);
});
</script>

<template>
  <div
    ref="trigger"
    class="itip__trigger"
    :class="{ 'is-interactive': available && !noHighlight }"
    @pointerdown="lastPointer = $event.pointerType"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @click="onClick"
  >
    <slot />

    <Teleport to="body">
      <Transition name="itip">
        <!-- Equipamento: ficha completa -->
        <div
          v-if="open && item && def && rarity && main"
          ref="panel"
          class="itip"
          :class="[`is-arrow-${position.side}`, { 'is-touch': touchOpen }]"
          role="tooltip"
          :style="{ top: `${position.top}px`, left: `${position.left}px`, '--tint': rarity.color, '--arrow': `${position.arrow}px` }"
        >
          <span class="itip__arrow" aria-hidden="true"></span>

          <header class="itip__header">
            <h3 :style="{ color: rarity.color }">{{ def.name }}</h3>
            <p>
              <span class="itip__rarity" :style="{ background: rarity.color }">{{ rarity.label }}</span>
              {{ EQUIPMENT_SLOTS[def.slot].label }}
            </p>
          </header>

          <p class="itip__main">
            <span>{{ mainLabel }}</span>
            <strong>+{{ formatStat(main.value) }}</strong>
          </p>

          <p class="itip__description">{{ def.description }}</p>

          <ul v-if="abilities.length" class="itip__abilities">
            <li v-for="(entry, index) in abilities" :key="index" :class="{ 'is-locked': !entry.unlocked }">
              <i :style="{ background: EQUIPMENT_RARITIES[entry.ability.unlock].color }" aria-hidden="true"></i>
              <span>{{ abilityText(entry.ability) }}</span>
              <small v-if="!entry.unlocked">Libera em {{ EQUIPMENT_RARITIES[entry.ability.unlock].label }}</small>
            </li>
          </ul>
        </div>

        <!-- Sorteio de equipamento: raridade e slot já são certos, o item é que ainda vai sair -->
        <div
          v-else-if="open && drop && dropDef && dropRarity"
          ref="panel"
          class="itip"
          :class="[`is-arrow-${position.side}`, { 'is-touch': touchOpen }]"
          role="tooltip"
          :style="{ top: `${position.top}px`, left: `${position.left}px`, '--tint': dropRarity.color, '--arrow': `${position.arrow}px` }"
        >
          <span class="itip__arrow" aria-hidden="true"></span>

          <header class="itip__header">
            <h3 :style="{ color: dropRarity.color }">{{ dropDef.name }}</h3>
            <p>
              <span class="itip__rarity" :style="{ background: dropRarity.color }">{{ dropRarity.label }}</span>
              {{ randomEquipmentSlotLabel(drop.slot) }}
            </p>
          </header>

          <p class="itip__description">{{ dropDef.description }}</p>
        </div>

        <!-- Item simples (ouro, gemas, exp, chaves...): só nome e descrição -->
        <div
          v-else-if="open && simple"
          ref="panel"
          class="itip is-simple"
          :class="[`is-arrow-${position.side}`, { 'is-touch': touchOpen }]"
          role="tooltip"
          :style="{ top: `${position.top}px`, left: `${position.left}px`, '--arrow': `${position.arrow}px` }"
        >
          <span class="itip__arrow" aria-hidden="true"></span>
          <h3 class="itip__simple-name">{{ simple.name }}</h3>
          <p class="itip__simple-text">{{ simple.description }}</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.itip__trigger.is-interactive {
  cursor: pointer;
  transition:
    translate 0.15s ease,
    scale 0.15s ease,
    filter 0.15s ease;
}
.itip__trigger.is-interactive:hover {
  translate: 0 -3px;
  scale: 1.06;
  filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 255, 255, 0.35));
}
.itip__trigger.is-interactive:active {
  scale: 0.96;
}

.itip {
  --tint: #b7bfcc;
  position: fixed;
  /* Acima da pilha de modais (useModal começa em 50 e sobe de 10 em 10) */
  z-index: 200;
  width: min(280px, calc(100vw - 16px));
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(#26304f, #151b33);
  border: 2px solid var(--tint);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.55),
    inset 0 0 0 2px rgba(0, 0, 0, 0.45);
  color: #fff;
  pointer-events: none;
}
/* No toque o painel fica clicável só para engolir o toque que o fecha */
.itip.is-touch {
  pointer-events: auto;
}
.itip__arrow {
  position: absolute;
  left: var(--arrow, 50%);
  width: 12px;
  height: 12px;
  margin-left: -6px;
  rotate: 45deg;
  background: #1b2340;
  border: 2px solid var(--tint);
}
.itip.is-arrow-bottom .itip__arrow {
  bottom: -7px;
  border-top: 0;
  border-left: 0;
}
.itip.is-arrow-top .itip__arrow {
  top: -7px;
  border-bottom: 0;
  border-right: 0;
}
.itip__header h3 {
  margin: 0;
  font: 19px/1.15 'Lilita One', sans-serif;
  -webkit-text-stroke: 4px #0f1530;
  paint-order: stroke fill;
}
.itip__header p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font: 11px 'Fredoka One', sans-serif;
  color: #b9c6e4;
}
.itip__rarity {
  padding: 0 8px;
  border-radius: 999px;
  color: #1b1030;
  font-family: 'Lilita One', sans-serif;
}
.itip__main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 10px 0 0;
  font-family: 'Lilita One', sans-serif;
}
.itip__main span {
  font-size: 13px;
  color: #b9c6e4;
}
.itip__main strong {
  font-size: 22px;
  line-height: 1;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
}
.itip__description {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  font: 12px/1.35 'Fredoka One', sans-serif;
  color: #d5def2;
}
.itip__abilities {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
.itip__abilities li {
  display: grid;
  grid-template-columns: 10px 1fr;
  align-items: center;
  column-gap: 7px;
  font: 12px/1.3 'Fredoka One', sans-serif;
}
.itip__abilities i {
  width: 10px;
  height: 10px;
  rotate: 45deg;
  border-radius: 2px;
  border: 2px solid #0f1530;
}
.itip__abilities small {
  grid-column: 2;
  font-size: 10px;
  color: #8e9abb;
}
.itip__abilities li.is-locked span {
  color: #7d88a6;
}
.itip__abilities li.is-locked i {
  filter: grayscale(1) brightness(0.7);
}

/* Variante simples: mais estreita, texto centralizado e um filete separando nome e descrição */
.itip.is-simple {
  width: max-content;
  max-width: min(260px, calc(100vw - 16px));
  padding: 10px 14px 12px;
  text-align: center;
}
.itip__simple-name {
  margin: 0;
  padding-bottom: 7px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.12);
  font: 18px/1.15 'Lilita One', sans-serif;
  -webkit-text-stroke: 4px #0f1530;
  paint-order: stroke fill;
}
.itip__simple-text {
  margin: 8px 0 0;
  font: 12px/1.4 'Fredoka One', sans-serif;
  color: #d5def2;
}

.itip-enter-active,
.itip-leave-active {
  transition:
    opacity 0.15s ease,
    scale 0.15s ease;
}
.itip-enter-from,
.itip-leave-to {
  opacity: 0;
  scale: 0.9;
}

@media (prefers-reduced-motion: reduce) {
  .itip__trigger.is-interactive,
  .itip-enter-active,
  .itip-leave-active {
    transition: none;
  }
}
</style>
