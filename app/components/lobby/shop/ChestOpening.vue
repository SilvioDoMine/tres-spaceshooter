<script setup lang="ts">
import { PerspectiveCamera, Vector3 } from 'three';
import { EQUIPMENT_RARITIES } from '~/data/equipment';
import { CHESTS, type ChestType } from '~/data/shop';
import { useAudio } from '~/composables/useAudio';
import { useChestOpening } from '~/composables/useChestOpening';
import { useShopStore } from '~/stores/useShopStore';
import type { ChestFrame } from '~/utils/chestTimeline';
import { ITEM_ANCHOR, OPENING_CAMERA, openingCameraPosition } from '~/utils/chestVfx';
import { getEquipment, rarityIndex } from '~/utils/equipment';

// Tela cheia da abertura: um baú por item (toque avança/adianta), "Toque para pular" vai direto ao resumo
// "Parabéns" com confete e o botão Sortear Mais. Os itens já estão no inventário antes daqui.
const { session, start, close } = useChestOpening();
const shop = useShopStore();
const audio = useAudio();

const index = ref(0);
const phase = ref<'reveal' | 'summary'>('reveal');
const revealDone = ref(false);
const playId = ref(0);
const skipId = ref(0);

const chest = computed(() => (session.value ? CHESTS[session.value.type] : null));
const items = computed(() => session.value?.items ?? []);
const current = computed(() => items.value[index.value] ?? null);
const currentName = computed(() => (current.value ? (getEquipment(current.value.defId)?.name ?? '') : ''));
const currentRarity = computed(() => (current.value ? EQUIPMENT_RARITIES[current.value.rarity] : null));
const high = computed(
  () => !!current.value && !!chest.value && rarityIndex(current.value.rarity) >= rarityIndex(chest.value.pity.rarity),
);

// O conteúdo do TresCanvas renderiza num renderer próprio e pode rodar depois que a sessão já virou null:
// a cena lê cópias que nunca ficam vazias
const sceneType = ref<ChestType>('silver');
const sceneHalo = ref('#ffffff');
watchEffect(() => {
  if (session.value) sceneType.value = session.value.type;
  if (currentRarity.value) sceneHalo.value = currentRarity.value.color;
});

const background = computed(() =>
  chest.value ? { '--from': chest.value.theme.openingFrom, '--to': chest.value.theme.openingTo } : {},
);

watch(
  () => session.value?.id,
  id => {
    if (!id) return;
    index.value = 0;
    phase.value = 'reveal';
    revealDone.value = false;
    playId.value++;
  },
);

// -- Card do item acompanhando a animação 3D ------------------------------------------------------
const itemEl = ref<HTMLElement | null>(null);
const anchor = ref({ x: 50, y: 30 });
/** Faixa da proporção da tela: mudar de faixa remonta o canvas com a câmera nova */
const aspectKey = ref('');

/** Projeta o ponto do item no mundo para % da tela (mesma câmera da cena) */
function updateAnchor() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  aspectKey.value = aspect.toFixed(1);
  const camera = new PerspectiveCamera(OPENING_CAMERA.fov, aspect, 0.1, 100);
  camera.position.set(...openingCameraPosition(aspect));
  camera.lookAt(new Vector3(...OPENING_CAMERA.target));
  camera.updateMatrixWorld();
  const point = new Vector3(...ITEM_ANCHOR).project(camera);
  anchor.value = { x: (point.x * 0.5 + 0.5) * 100, y: (-point.y * 0.5 + 0.5) * 100 };
}

function onFrame(frame: ChestFrame) {
  const el = itemEl.value;
  if (!el) return;
  const p = frame.item;
  el.style.opacity = String(Math.min(1, p * 4));
  el.style.transform = `translate(-50%, calc(-50% + ${(1 - p) * 34}vh)) scale(${0.15 + 0.85 * p})`;
}

function onOpened() {
  audio.playUiSound('fuse');
  audio.vibrate(high.value ? [20, 40, 30, 40, 40] : [15, 30, 20]);
}

// -- Navegação --------------------------------------------------------------------------------------
function tap() {
  if (!session.value) return;
  if (phase.value === 'summary') {
    close();
    return;
  }
  if (!revealDone.value) {
    skipId.value++;
    return;
  }
  if (index.value < items.value.length - 1) {
    index.value++;
    revealDone.value = false;
    playId.value++;
  } else {
    showSummary();
  }
}

function showSummary() {
  phase.value = 'summary';
  audio.playUiSound('fuse');
  confettiOnPageSides(900);
  confettiOnBottom(900);
}

function drawMore() {
  if (!session.value) return;
  const result = shop.openChest(session.value.type);
  if (!result) {
    audio.playUiSound('close');
    return;
  }
  start(result);
}

function onKey(event: KeyboardEvent) {
  if (!session.value) return;
  if (event.key === 'Escape') {
    // preventDefault avisa o lobby que o Esc já foi usado (senão ele também sai da Loja)
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    event.stopImmediatePropagation();
    tap();
  }
}

onMounted(() => {
  updateAnchor();
  window.addEventListener('resize', updateAnchor);
  window.addEventListener('keydown', onKey, true);
});
onUnmounted(() => {
  window.removeEventListener('resize', updateAnchor);
  window.removeEventListener('keydown', onKey, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="copen">
      <div
        v-if="session && chest"
        class="copen"
        :class="`is-${session.type}`"
        :style="background"
        role="dialog"
        aria-modal="true"
        :aria-label="`Abrindo ${chest.name}`"
        @click="tap"
      >
        <div class="copen__pattern" aria-hidden="true"></div>

        <!-- Revelação item a item -->
        <template v-if="phase === 'reveal' && current && currentRarity">
          <div class="copen__canvas">
            <TresCanvas :key="aspectKey" :alpha="true" :clear-alpha="0" :dpr="[1, 1.5]">
              <LobbyShopChestScene
                :type="sceneType"
                :halo-color="sceneHalo"
                :high="high"
                :play-id="playId"
                :skip-id="skipId"
                @frame="onFrame"
                @opened="onOpened"
                @done="revealDone = true"
              />
            </TresCanvas>
          </div>

          <button
            v-if="items.length > 1"
            type="button"
            class="copen__skip"
            data-ui-sound="tap"
            @click.stop="showSummary"
          >
            Toque<br />para pular
          </button>
          <p v-if="items.length > 1" class="copen__counter">{{ index + 1 }}/{{ items.length }}</p>

          <div
            ref="itemEl"
            :key="playId"
            class="copen__item"
            :style="{ left: `${anchor.x}%`, top: `${anchor.y}%`, opacity: 0 }"
          >
            <div class="copen__label">
              <span class="copen__rarity" :style="{ color: currentRarity.color }">{{ currentRarity.label }}</span>
              <span class="copen__name" :style="{ color: currentRarity.color }">{{ currentName }}</span>
            </div>
            <div class="copen__card" :class="{ 'is-high': high }">
              <LobbyEquipmentItemCard :item="current" />
            </div>
          </div>

          <p class="copen__hint" :class="{ 'is-visible': revealDone }">Toque em qualquer lugar para continuar</p>
        </template>

        <!-- Resumo -->
        <div v-else-if="phase === 'summary'" class="copen__summary">
          <h2 class="copen__title">Parabéns:</h2>
          <div class="copen__grid" :class="{ 'is-few': items.length <= 3 }">
            <div
              v-for="(item, i) in items"
              :key="item.uid"
              class="copen__cell"
              :class="{ 'is-high': rarityIndex(item.rarity) >= rarityIndex(chest.pity.rarity) }"
              :style="{ animationDelay: `${Math.min(i, 12) * 70}ms` }"
            >
              <LobbyEquipmentItemCard :item="item" />
            </div>
          </div>

          <div class="copen__more" @click.stop>
            <LobbyShopDrawButton :type="session.type" label="Sortear Mais" @draw="drawMore" />
          </div>
          <p class="copen__hint is-visible">Toque em qualquer área para fechar</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.copen {
  position: fixed;
  inset: 0;
  z-index: 90;
  overflow: hidden;
  background: linear-gradient(var(--from), var(--to));
  color: #fff;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
/* Padrão de baús "?" escuros subindo devagar */
.copen__pattern {
  position: absolute;
  inset: -200px 0 0;
  opacity: 0.12;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='200' viewBox='0 0 180 200'%3E%3Cg fill='%23000'%3E%3Cpath d='M28 70h72v56H28z' transform='rotate(-12 64 98)'/%3E%3Cpath d='M24 56h80v18H24z' transform='rotate(-12 64 65)'/%3E%3Cpath d='M118 150h52v40h-52z' transform='rotate(10 144 170)'/%3E%3Cpath d='M115 140h58v13h-58z' transform='rotate(10 144 146)'/%3E%3C/g%3E%3Ctext x='52' y='118' font-family='Arial Black,Arial' font-size='40' fill='%23fff' opacity='.35' transform='rotate(-12 64 98)'%3E%3F%3C/text%3E%3C/svg%3E");
  background-size: 180px 200px;
  animation: copen-drift 14s linear infinite;
}
.copen__canvas {
  position: absolute;
  inset: 0;
}
.copen__skip {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 64px);
  right: 12px;
  z-index: 3;
  padding: 6px 8px;
  border: 0;
  background: none;
  color: #fff;
  font: 17px/1.1 'Lilita One', sans-serif;
  text-align: center;
  -webkit-text-stroke: 4px rgba(10, 10, 40, 0.7);
  paint-order: stroke fill;
  cursor: pointer;
}
.copen__counter {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 68px);
  left: 16px;
  z-index: 3;
  margin: 0;
  font: 18px/1 'Lilita One', sans-serif;
  -webkit-text-stroke: 4px rgba(10, 10, 40, 0.7);
  paint-order: stroke fill;
}
.copen__item {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  pointer-events: none;
  will-change: transform, opacity;
}
.copen__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  translate: 0 -8px;
}
.copen__rarity {
  position: relative;
  min-width: 220px;
  padding: 6px 40px;
  border-radius: 999px;
  background: rgba(20, 16, 60, 0.75);
  border: 2px solid rgba(255, 255, 255, 0.18);
  font: 24px/1 'Lilita One', sans-serif;
  text-align: center;
}
.copen__rarity::before,
.copen__rarity::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  translate: 0 -50%;
  rotate: 45deg;
  background: rgba(255, 255, 255, 0.35);
}
.copen__rarity::before {
  left: 14px;
}
.copen__rarity::after {
  right: 14px;
}
.copen__name {
  font: 26px/1.1 'Lilita One', sans-serif;
  text-align: center;
  white-space: nowrap;
  -webkit-text-stroke: 5px rgba(12, 10, 40, 0.65);
  paint-order: stroke fill;
}
.copen__card {
  position: relative;
  width: 124px;
}
.copen__card.is-high {
  animation: copen-wiggle 2.4s ease-in-out 0.6s infinite;
}
.copen__hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom) + 36px);
  margin: 0;
  font: 16px/1.2 'Lilita One', sans-serif;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.copen__hint.is-visible {
  opacity: 1;
}
.copen__summary {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 80px 16px 90px;
}
.copen__title {
  margin: 0;
  font: 40px/1 'Lilita One', sans-serif;
  -webkit-text-stroke: 6px rgba(12, 10, 40, 0.5);
  paint-order: stroke fill;
  animation: copen-title 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.copen__grid {
  display: grid;
  grid-template-columns: repeat(4, 76px);
  gap: 14px;
  max-height: 55vh;
  /* Espaço para o brilho girando das raridades altas não criar rolagem lateral */
  padding: 14px;
  overflow-x: hidden;
  overflow-y: auto;
}
.copen__grid.is-few {
  grid-template-columns: repeat(auto-fit, 96px);
  justify-content: center;
  width: min(360px, 100%);
}
.copen__cell {
  position: relative;
  animation: copen-pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
.copen__cell.is-high::before {
  content: '';
  position: absolute;
  inset: -22%;
  z-index: -1;
  border-radius: 50%;
  background: repeating-conic-gradient(rgba(255, 240, 160, 0.4) 0 12deg, transparent 12deg 30deg);
  mask: radial-gradient(closest-side, #000 35%, transparent);
  animation: copen-spin 6s linear infinite;
}
.copen__more {
  width: min(220px, 70vw);
  margin-top: 12px;
  cursor: default;
}
.copen__summary .copen__hint {
  position: static;
}
.copen-enter-active,
.copen-leave-active {
  transition: opacity 0.25s ease;
}
.copen-enter-from,
.copen-leave-to {
  opacity: 0;
}
@keyframes copen-drift {
  to {
    background-position: 60px -200px;
  }
}
@keyframes copen-pop {
  from {
    opacity: 0;
    scale: 0.3;
  }
}
@keyframes copen-title {
  from {
    scale: 0.5;
  }
}
@keyframes copen-spin {
  to {
    rotate: 360deg;
  }
}
@keyframes copen-wiggle {
  0%,
  80%,
  100% {
    rotate: 0deg;
  }
  85% {
    rotate: -6deg;
  }
  90% {
    rotate: 6deg;
  }
  95% {
    rotate: -3deg;
  }
}
@media (max-width: 400px) {
  .copen__grid {
    grid-template-columns: repeat(4, 64px);
    gap: 10px;
  }
  .copen__name {
    font-size: 22px;
  }
}
@media (max-height: 500px) and (orientation: landscape) {
  .copen__grid {
    grid-template-columns: repeat(8, 64px);
  }
  .copen__summary {
    padding: 20px 16px;
    gap: 12px;
  }
}
</style>
