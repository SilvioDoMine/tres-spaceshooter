<script setup lang="js">
import { useModal } from '~/composables/useModal';
import PlayModal from '~/components/play/PlayModal.vue';
import BaseAbilityIcon from '~/components/base/AbilityIcon.vue';

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

defineExpose({ open, close, isOpen });

// Quando abrir o modal, executa o código
watch(isOpen, (newVal) => {
  if (newVal) {
    confettiOnPageSides(2000);
    confettiOnBottom(2000);
  }
});
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
      :height="60"
      variant="red"
    />
  </template>

  <BaseCardFancy variant="red" :gold-border="true" class="max-w-[175px] mx-auto -mt-10 mb-5">
    <!-- Content -->
    <div class="flex flex-col items-center py-10">

      <!-- Status da fase -->
      <div class="flex flex-col items-center text-white title-text">
        <h2 class="text-lg text-rose-200 text-shadow-xl text-shadow-blue-900">Nível alcançado</h2>
        <p class="text-7xl font-mono font-bold text-shadow-[4px_5px_0px_rgba(0,0,0,1)] text-shadow-blue-900">{{ useCurrentRunStore().currentLevel - 1 }}</p>
        <p class="title-text-red text-xl">Fase 1</p>
      </div>

    </div>
  </BaseCardFancy>

  <BaseSectionDivider :text="useCurrentRunStore().currentGold > 0 ? 'Recompensas' : 'Não há recompensas'" />

  <!-- Grid de habilidades -->
  <div class="abilities-grid">
    <BaseAbilityIcon
      rarity="gray"
      size="sm"
      :clickable="true"
      :quantity="useCurrentRunStore().currentGold"
      v-if="useCurrentRunStore().currentGold > 0"
    >
      <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
        <span class="drop-shadow-xs drop-shadow-black text-gold">
          <SvgCoinIcon :size="25" />
        </span>
      </p>
    </BaseAbilityIcon>

    <BaseAbilityIcon
      rarity="gray"
      size="sm"
      :clickable="true"
      quantity="100"
      v-if="false"
    >
      <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
        <SvgExpIcon size="35" />
      </p>
    </BaseAbilityIcon>
  </div>

  <!-- Slot de actions para os botões grandes -->
  <template #actions>
    <p @click="handleQuit" class="title-text text-white animate-pulse animate">Toque para continuar</p class="text-title text-white">
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
