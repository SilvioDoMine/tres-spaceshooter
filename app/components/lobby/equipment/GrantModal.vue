<script setup lang="ts">
import { EQUIPMENT_RARITIES } from '~/data/equipment';
import { useAudio } from '~/composables/useAudio';
import { useItemGrantPopup } from '~/composables/useItemGrantPopup';
import { getEquipment } from '~/utils/equipment';

// Modal global "Item obtido!": aparece sempre que itens são entregues via useItemGrantPopup().show().
const { grantedItems, close } = useItemGrantPopup();
const audio = useAudio();

const entries = computed(() =>
  grantedItems.value.map(item => ({
    item,
    name: getEquipment(item.defId)?.name ?? item.defId,
    rarity: EQUIPMENT_RARITIES[item.rarity],
  })),
);

watch(
  () => grantedItems.value.length,
  count => {
    if (!count) return;
    audio.playUiSound('fuse');
    audio.vibrate([15, 40, 25]);
    confettiOnPageSides(500);
  },
);

function onKey(event: KeyboardEvent) {
  if (!grantedItems.value.length || event.key !== 'Escape') return;
  event.stopImmediatePropagation();
  close();
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onUnmounted(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="grant">
      <div
        v-if="entries.length"
        class="grant"
        role="dialog"
        aria-modal="true"
        :aria-label="entries.length > 1 ? `${entries.length} itens obtidos` : 'Item obtido'"
        @click="close"
      >
        <h2 class="grant__title">{{ entries.length > 1 ? `${entries.length} itens obtidos!` : 'Item obtido!' }}</h2>

        <div class="grant__list" :class="{ 'is-single': entries.length === 1 }">
          <div
            v-for="(entry, index) in entries"
            :key="entry.item.uid"
            class="grant__entry"
            :style="{ animationDelay: `${Math.min(index, 12) * 60}ms` }"
          >
            <div class="grant__card" :class="`is-${entry.item.rarity}`">
              <LobbyEquipmentItemCard :item="entry.item" />
            </div>
            <p class="grant__name" :style="{ color: entry.rarity.color }">{{ entry.name }}</p>
            <p class="grant__rarity">{{ entry.rarity.label }}</p>
          </div>
        </div>

        <p class="grant__hint">Toque em qualquer área para fechar</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.grant {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 24px 16px;
  background: radial-gradient(circle at 50% 45%, rgba(60, 50, 140, 0.55), rgba(6, 8, 22, 0.9) 60%);
  color: #fff;
  cursor: pointer;
}
.grant__title {
  margin: 0;
  font: 36px/1.1 'Lilita One', sans-serif;
  color: #ffe27a;
  -webkit-text-stroke: 6px #5a2a00;
  paint-order: stroke fill;
  text-align: center;
  animation: grant-title 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.grant__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 16px 12px;
  width: min(560px, 100%);
  max-height: 60vh;
  /* Folga para o contorno das fontes e o brilho girando não serem cortados pela borda que rola */
  padding: 6px 10px;
  overflow-x: hidden;
  overflow-y: auto;
}
.grant__list.is-single {
  display: flex;
  justify-content: center;
  /* Um item só nunca precisa rolar: sem caixa de rolagem, o nome não é cortado */
  overflow: visible;
}
.grant__entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: grant-pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
.grant__card {
  position: relative;
  width: 76px;
}
.is-single .grant__card {
  width: 140px;
}
/* Brilho girando atrás das raridades altas */
.grant__card.is-purple::before,
.grant__card.is-orange::before,
.grant__card.is-red::before {
  content: '';
  position: absolute;
  inset: -30%;
  z-index: -1;
  background: repeating-conic-gradient(rgba(255, 230, 140, 0.35) 0 12deg, transparent 12deg 30deg);
  border-radius: 50%;
  mask: radial-gradient(closest-side, #000 40%, transparent);
  animation: grant-spin 6s linear infinite;
}
.grant__name {
  margin: 8px 0 0;
  font: 15px/1.15 'Lilita One', sans-serif;
  -webkit-text-stroke: 4px #0f1530;
  paint-order: stroke fill;
}
.is-single .grant__name {
  font-size: 24px;
}
.grant__rarity {
  margin: 2px 0 0;
  font: 12px 'Fredoka One', sans-serif;
  color: #b9c6e4;
}
.grant__hint {
  margin: 0;
  font: 13px 'Fredoka One', sans-serif;
  color: rgba(255, 255, 255, 0.55);
}
.grant-enter-active,
.grant-leave-active {
  transition: opacity 0.2s ease;
}
.grant-enter-from,
.grant-leave-to {
  opacity: 0;
}
@keyframes grant-pop {
  from {
    opacity: 0;
    scale: 0.3;
  }
}
@keyframes grant-title {
  from {
    scale: 0.5;
  }
}
@keyframes grant-spin {
  to {
    rotate: 360deg;
  }
}
</style>
