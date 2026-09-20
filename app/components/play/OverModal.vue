<script setup lang="js">
import { useModal } from '~/composables/useModal';
import PlayModal from '~/components/play/PlayModal.vue';
import BaseAbilityIcon from '~/components/base/AbilityIcon.vue';
import { playableRoomCount } from '~/utils/progression';

/**
 * Modal de Game Over
 * Mostra estatísticas da partida, habilidades obtidas e opções de tentar novamente ou sair
 */

const MODAL_ID = 'play-over-modal';

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

defineExpose({ open, close, isOpen });

// Level Thing
const levelAccount = useLevelAccount();
const currentRun = useCurrentRunStore();
const totalRooms = computed(() => playableRoomCount(currentRun.levelConfig));
const roomReached = computed(() => playableRoomCount(currentRun.levelConfig, currentRun.currentStageIndex));
const chapter = computed(() => currentRun.levelConfig?.chapter || 1);
const expReward = computed(() => levelAccount.calculateExpReward(
  currentRun.levelConfig,
  roomReached.value,
  false,
));
</script>

<template>
<PlayModal
  :modal-id="MODAL_ID"
  max-width="max-w-lg"
  :disable-overlay-close="false"
  @close="handleQuit"
>
  <!-- Title slot -->
  <template #title>
    <BaseRibbonTitle
      text="Fim do Desafio"
      variant="blue"
    />
  </template>

  <!-- Bordas vermelhas de alerta (fixas na tela, sem capturar cliques) -->
  <div class="over-vignette" aria-hidden="true"></div>

  <div class="over-card -mt-10 mb-5">
    <PlayResultCard
      label="Sala alcançada"
      variant="blue"
      :value="roomReached"
      :total="totalRooms"
      :chapter="chapter"
      :ship-level="currentRun.currentLevel"
      :count-delay="750"
    />
  </div>


  <BaseSectionDivider class="over-divider" :text="useCurrentRunStore().currentGold > 0 || useCurrentRunStore().runEquipment ? 'Recompensas' : 'Não há recompensas'" />

  <!-- Grid de habilidades -->
  <div class="abilities-grid">
    <BaseAbilityIcon
      class="over-reward"
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
      class="over-reward"
      :style="{ '--i': 1 }"
      rarity="gray"
      size="sm"
      :clickable="true"
      :quantity="`${expReward}`"
      v-if="expReward > 0"
    >
      <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
        <span class="drop-shadow-xs drop-shadow-black">
          <SvgExpIcon :size="25" />
        </span>
      </p>
    </BaseAbilityIcon>

    <div v-if="useCurrentRunStore().runEquipment" class="w-16 over-reward" :style="{ '--i': 2 }">
      <LobbyEquipmentItemTooltip :item="useCurrentRunStore().runEquipment">
        <LobbyEquipmentItemCard :item="useCurrentRunStore().runEquipment" />
      </LobbyEquipmentItemTooltip>
    </div>
  </div>

  <!-- Slot de actions para os botões grandes -->
  <template #actions>
    <div class="over-action">
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
   Derrota: as bordas da tela piscam em vermelho, o card despenca e treme com o impacto, a sala alcançada
   conta de 0 até o valor e as recompensas caem uma a uma. O PlayModal desmonta ao fechar, então toca a
   cada fim de partida. O hover do ícone usa `scale`, por isso as recompensas animam `transform`. */
.over-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 45%, rgba(200, 20, 20, 0.55) 100%);
  animation:
    over-vignette-in 1.4s ease-out both,
    over-vignette-breath 2.6s ease-in-out 1.4s infinite alternate;
}

.over-card {
  animation: over-card-in 0.8s 0.15s both;
}

.over-divider {
  animation: over-fade-down 0.4s ease-out 0.85s both;
}

.over-reward {
  animation: over-reward-in 0.5s cubic-bezier(0.3, 1.4, 0.5, 1) both;
  animation-delay: calc(1s + var(--i) * 110ms);
}

.over-action {
  animation: over-fade-down 0.5s ease-out 1.45s both;
}

@keyframes over-vignette-in {
  0% { opacity: 0; }
  12% { opacity: 1; }
  35% { opacity: 0.3; }
  55% { opacity: 0.85; }
  100% { opacity: 0.5; }
}

@keyframes over-vignette-breath {
  to { opacity: 0.3; }
}

/* Cai acelerando, amassa no impacto e chacoalha até parar; começa sem cor e ganha cor ao assentar */
@keyframes over-card-in {
  0% {
    opacity: 0;
    transform: translateY(-160px) rotate(-8deg);
    filter: grayscale(1) brightness(0.6);
    animation-timing-function: cubic-bezier(0.55, 0, 0.9, 0.4);
  }
  40% {
    opacity: 1;
    transform: translateY(0) scale(1.06, 0.9);
    filter: grayscale(1) brightness(0.6);
    animation-timing-function: ease-out;
  }
  52% { transform: translateX(-9px) rotate(-3deg); }
  64% { transform: translateX(8px) rotate(2deg); }
  76% { transform: translateX(-5px) rotate(-1deg); }
  88% { transform: translateX(2px); }
  100% {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

@keyframes over-reward-in {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.6);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes over-fade-down {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .over-card,
  .over-divider,
  .over-reward,
  .over-action {
    animation: none;
  }

  .over-vignette {
    animation: none;
    opacity: 0.4;
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
