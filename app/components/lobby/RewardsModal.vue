<script setup lang="js">
import { useModal } from '~/composables/useModal';
import PlayModal from '~/components/play/PlayModal.vue';
import BaseAbilityIcon from '~/components/base/AbilityIcon.vue';

const MODAL_ID = 'rewards-modal';

const { open, close, isOpen } = useModal(MODAL_ID);

const props = defineProps({
  gold: {
    type: Number,
    default: 0,
  },
  exp: {
    type: Number,
    default: 0,
  },
});

// Refs para armazenar as recompensas exibidas
const displayedGold = ref(0);
const displayedExp = ref(0);

// Função para abrir o modal com recompensas
const openWithRewards = (rewards) => {
  console.log('openWithRewards chamado com:', rewards);
  displayedGold.value = rewards?.gold || 0;
  displayedExp.value = rewards?.exp || 0;
  console.log('displayedGold setado para:', displayedGold.value);
  console.log('displayedExp setado para:', displayedExp.value);

  // Usar nextTick para garantir que os valores sejam atualizados antes de abrir
  nextTick(() => {
    open();
  });
};

// Resetar valores quando o modal fechar
watch(isOpen, (newVal) => {
  if (newVal) {
    console.log('Modal aberto com displayedGold:', displayedGold.value, 'displayedExp:', displayedExp.value);
    confettiOnPageSides(2000);
    confettiOnBottom(2000);
  } else {
    // Resetar valores quando fechar
    console.log('Modal fechado, resetando valores');
  }
});

defineExpose({ open, close, isOpen, openWithRewards });

// Função para fechar o modal
const handleQuit = () => {
  close();
};
</script>

<template>
<PlayModal
  :modal-id="MODAL_ID"
  title="Recompensas"
  max-width="max-w-lg"
  :disable-overlay-close="false"
  @close="handleQuit"
>
  <!-- Title slot -->
  <template #title>
    <BaseRibbonTitle
      text="Recompensas"
      :height="60"
      variant="green"
    />
  </template>


  <BaseSectionDivider text="Itens adquiridos" />

  <!-- Grid de habilidades -->
  <div class="abilities-grid">
    <BaseAbilityIcon
      rarity="gray"
      size="sm"
      :clickable="true"
      :quantity="`${displayedGold}`"
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
      :quantity="`${displayedExp}`"
    >
      <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
        <SvgExpIcon :size="35" />
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
