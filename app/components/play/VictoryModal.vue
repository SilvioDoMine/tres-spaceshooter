<script setup lang="js">
import { useModal } from '~/composables/useModal';
import PlayModal from '~/components/play/PlayModal.vue';
import BaseAbilityIcon from '~/components/base/AbilityIcon.vue';
import { playableRoomCount } from '~/utils/progression';
import { CHAPTER_COUNT } from '~/games/levels';

const MODAL_ID = 'play-victory-modal';

const { open, close, isOpen } = useModal(MODAL_ID);

const props = defineProps({
  /** Estatísticas da partida */
  stats: {
    type: Object,
    default: () => ({
      level: 0,
      kills: 0,
      time: '0:00',
      score: 0,
    }),
  },
});

const emit = defineEmits(['retry', 'quit']);

function handleRetry() {
  emit('retry');
  close();
  useCurrentRunStore().gameStart(useCurrentRunStore().levelConfig);
}

function handleQuit() {
  emit('quit');
  close();
  useRouter().push('/');
}

function handleNextChapter() {
  close();
  useRouter().push(`/play/${nextChapter.value}`);
}

defineExpose({ open, close, isOpen });

// Quando abrir o modal, solta o confete no momento em que o card chega ao tamanho final
let confettiTimer = 0;
watch(isOpen, (newVal) => {
  clearTimeout(confettiTimer);
  if (newVal) {
    confettiTimer = setTimeout(() => {
      confettiOnPageSides(2000);
      confettiOnBottom(2000);
    }, 350);
  }
});
onUnmounted(() => clearTimeout(confettiTimer));

// Level Thing
const levelAccount = useLevelAccount();
const currentRun = useCurrentRunStore();
const totalRooms = computed(() => playableRoomCount(currentRun.levelConfig));
const chapter = computed(() => currentRun.levelConfig?.chapter || 1);
const nextChapter = computed(() => chapter.value < CHAPTER_COUNT ? chapter.value + 1 : null);
const expReward = computed(() => levelAccount.calculateExpReward(
  currentRun.levelConfig,
  totalRooms.value,
  true,
));
</script>

<template>
<PlayModal
  :modal-id="MODAL_ID"
  title="Desafio Concluído"
  max-width="max-w-lg"
  :disable-overlay-close="false"
  @close="handleQuit"
>
  <!-- Title slot -->
  <template #title>
    <BaseRibbonTitle
      text="Desafio Concluído"
      variant="red"
    />
  </template>

  <div class="victory-card -mt-10 mb-5">
    <!-- Raios dourados girando atrás do card -->
    <div class="victory-rays" aria-hidden="true"></div>

    <div class="victory-card__pop">
      <BaseCardFancy variant="red" :gold-border="true" class="max-w-[175px] mx-auto">
        <!-- Content -->
        <div class="flex flex-col items-center py-10">

          <!-- Status da fase -->
          <div class="flex flex-col items-center text-white title-text">
            <h2 class="text-lg text-rose-200 text-shadow-xl text-shadow-blue-900">Salas concluídas</h2>
            <p class="whitespace-nowrap font-mono font-bold text-shadow-[4px_5px_0px_rgba(0,0,0,1)] text-shadow-blue-900">
              <PlayCountUp class="text-7xl" :to="totalRooms" :delay="650" /><span class="text-3xl text-white/70">/{{ totalRooms }}</span>
            </p>
            <p class="title-text-red text-xl">Capítulo {{ chapter }}</p>
            <p class="text-[10px] text-white/50 mt-2">Nível da nave {{ currentRun.currentLevel }}</p>
          </div>

        </div>
      </BaseCardFancy>

      <!-- Reflexo que atravessa o card de tempos em tempos -->
      <div class="victory-shine" aria-hidden="true"></div>

      <!-- Brilhos piscando nos cantos -->
      <span v-for="n in 4" :key="n" class="victory-sparkle" :class="`is-${n}`" aria-hidden="true">✦</span>
    </div>
  </div>

  <BaseSectionDivider class="victory-divider" :text="useCurrentRunStore().currentGold > 0 || useCurrentRunStore().runEquipment ? 'Recompensas' : 'Não há recompensas'" />

  <!-- Grid de habilidades -->
  <div class="abilities-grid">
    <BaseAbilityIcon
      class="victory-reward"
      :style="{ '--i': 0 }"
      rarity="gray"
      size="sm"
      :clickable="true"
      :quantity="`${useCurrentRunStore().currentGold}`"
      v-if="useCurrentRunStore().currentGold > 0"
    >
      <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
        <span class="drop-shadow-xs drop-shadow-black text-gold">
          <SvgCoinIcon :size="25" />
        </span>
      </p>
    </BaseAbilityIcon>

    <BaseAbilityIcon
      class="victory-reward"
      :style="{ '--i': 1 }"
      rarity="gray"
      size="sm"
      :clickable="true"
      :quantity="`${expReward}`"
      v-if="expReward > 0"
    >
      <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
        <SvgExpIcon :size="35" />
      </p>
    </BaseAbilityIcon>

    <div v-if="useCurrentRunStore().runEquipment" class="w-16 victory-reward" :style="{ '--i': 2 }">
      <LobbyEquipmentItemCard :item="useCurrentRunStore().runEquipment" />
    </div>
  </div>

  <!-- Slot de actions para os botões grandes -->
  <template #actions>
    <div class="text-center victory-action">
      <template v-if="nextChapter">
        <p class="text-sm text-white/75 mb-3">Capítulo {{ chapter }} concluído. Capítulo {{ nextChapter }} liberado!</p>
        <BaseButton variant="green" size="sm" class="mb-3" @click="handleNextChapter">Próximo capítulo</BaseButton>
      </template>
      <p v-else class="text-sm text-white/75 mb-2">Você concluiu todos os capítulos!</p>
      <p @click="handleQuit" class="title-text text-white animate-pulse cursor-pointer">Voltar ao lobby</p>
    </div>
  </template>
</PlayModal>
</template>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stat-label {
  font-family: 'Fredoka One', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'Lilita One', sans-serif;
  font-size: 1.5rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.abilities-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  justify-items: center;
}

.abilities-grid > *:nth-child(6) {
  grid-column: 1;
}

/* ==================== Entrada ====================
   Vitória: o card surge girando com um flash dourado, raios de luz abrem e giram atrás dele, um reflexo
   atravessa o card de tempos em tempos e brilhos piscam nos cantos. As salas contam até o total e as
   recompensas saltam com flash. O PlayModal desmonta ao fechar, então toca a cada vitória.
   Os raios usam `scale` na entrada e `rotate` no giro para as duas animações não disputarem `transform`. */
.victory-card {
  position: relative;
  isolation: isolate;
}

.victory-rays {
  position: absolute;
  z-index: -1;
  top: 50%;
  left: 50%;
  width: 420px;
  height: 420px;
  margin: -210px 0 0 -210px;
  pointer-events: none;
  border-radius: 50%;
  background: repeating-conic-gradient(rgba(255, 214, 90, 0.55) 0deg 9deg, transparent 9deg 30deg);
  -webkit-mask-image: radial-gradient(circle, #000 15%, transparent 68%);
  mask-image: radial-gradient(circle, #000 15%, transparent 68%);
  animation:
    victory-rays-in 0.7s cubic-bezier(0.3, 1.4, 0.5, 1) 0.3s both,
    victory-rays-spin 16s linear infinite;
}

.victory-card__pop {
  position: relative;
  max-width: 175px;
  margin: 0 auto;
  animation: victory-card-in 0.65s cubic-bezier(0.3, 1.5, 0.5, 1) 0.1s both;
}

.victory-shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  pointer-events: none;
}

.victory-shine::before {
  content: '';
  position: absolute;
  top: -20%;
  bottom: -20%;
  left: 0;
  width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: translateX(-150%) skewX(-20deg);
  animation: victory-shine 3.2s ease-in-out 0.8s infinite;
}

.victory-sparkle {
  position: absolute;
  font-size: 22px;
  line-height: 1;
  color: #ffe68a;
  text-shadow: 0 0 8px rgba(255, 200, 60, 0.9);
  pointer-events: none;
  animation: victory-sparkle 1.6s ease-in-out infinite both;
}
.victory-sparkle.is-1 { top: -10px; left: -14px; animation-delay: 0.7s; }
.victory-sparkle.is-2 { top: 18%; right: -18px; font-size: 16px; animation-delay: 1.1s; }
.victory-sparkle.is-3 { bottom: 12%; left: -20px; font-size: 14px; animation-delay: 1.5s; }
.victory-sparkle.is-4 { bottom: -8px; right: -10px; animation-delay: 0.9s; }

.victory-divider {
  animation: victory-divider-in 0.4s cubic-bezier(0.3, 1.3, 0.6, 1) 0.75s both;
}

.victory-reward {
  animation: victory-reward-in 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  animation-delay: calc(0.9s + var(--i) * 120ms);
}

.victory-action {
  animation: victory-action-in 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) 1.3s both;
}

@keyframes victory-card-in {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-25deg);
    filter: brightness(3);
  }
  60% {
    opacity: 1;
    transform: scale(1.12) rotate(4deg);
    filter: brightness(1.8);
  }
  100% {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

@keyframes victory-rays-in {
  from {
    opacity: 0;
    scale: 0.2;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

@keyframes victory-rays-spin {
  to { rotate: 360deg; }
}

@keyframes victory-shine {
  0% { transform: translateX(-150%) skewX(-20deg); }
  30%,
  100% { transform: translateX(350%) skewX(-20deg); }
}

@keyframes victory-sparkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(90deg);
  }
}

@keyframes victory-divider-in {
  from {
    opacity: 0;
    transform: scaleX(0.3);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes victory-reward-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.3) rotate(-15deg);
    filter: brightness(1);
  }
  60% {
    opacity: 1;
    transform: translateY(-6px) scale(1.18) rotate(5deg);
    filter: brightness(2);
  }
  100% {
    opacity: 1;
    transform: none;
    filter: brightness(1);
  }
}

@keyframes victory-action-in {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .victory-rays,
  .victory-card__pop,
  .victory-shine::before,
  .victory-sparkle,
  .victory-divider,
  .victory-reward,
  .victory-action {
    animation: none;
  }

  .victory-sparkle {
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .stat-item {
    padding: 0.5rem;
  }

  .stat-label {
    font-size: 0.625rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .abilities-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .abilities-grid > *:nth-child(6) {
    grid-column: auto;
  }
}
</style>
