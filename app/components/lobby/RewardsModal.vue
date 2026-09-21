<script setup lang="js">
import { useModal } from '~/composables/useModal';
import { useAudio } from '~/composables/useAudio';
import PlayModal from '~/components/play/PlayModal.vue';
import BaseAbilityIcon from '~/components/base/AbilityIcon.vue';
import { keyItemId } from '~/data/items';

const MODAL_ID = 'rewards-modal';

const { open, close, isOpen } = useModal(MODAL_ID);
const audio = useAudio();

const props = defineProps({
  gold: {
    type: Number,
    default: 0,
  },
  exp: {
    type: Number,
    default: 0,
  },
  cash: {
    type: Number,
    default: 0,
  },
});

// Refs para armazenar as recompensas exibidas
const displayedGold = ref(0);
const displayedExp = ref(0);
const displayedCash = ref(0);
const displayedEquipment = ref([]);
const displayedKeys = ref([]); // [tipo, quantidade]

// Função para abrir o modal com recompensas
const openWithRewards = (rewards) => {
  console.log('openWithRewards chamado com:', rewards);
  displayedGold.value = rewards?.gold || 0;
  displayedExp.value = rewards?.exp || 0;
  displayedCash.value = rewards?.cash || 0;
  displayedEquipment.value = rewards?.equipment || [];
  displayedKeys.value = Object.entries(rewards?.keys || {}).filter(([, amount]) => amount > 0);
  console.log('displayedGold setado para:', displayedGold.value);
  console.log('displayedExp setado para:', displayedExp.value);
  console.log('displayedCash setado para:', displayedCash.value);

  // Usar nextTick para garantir que os valores sejam atualizados antes de abrir
  nextTick(() => {
    open();
  });
};

// Resetar valores quando o modal fechar
watch(isOpen, (newVal) => {
  if (newVal) {
    console.log('Modal aberto com displayedGold:', displayedGold.value, 'displayedExp:', displayedExp.value);
    // Fanfarra de recompensa junto com o confete (o plugin de UI não toca o som genérico neste modal)
    audio.playUiSound('reward', { haptics: true });
    confettiOnPageSides(500);
    confettiOnBottom(500);
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
  close-on-content-click
  @close="handleQuit"
>
  <!-- Title slot -->
  <template #title>
    <BaseRibbonTitle
      text="Recompensas"
      variant="green"
    />
  </template>


  <BaseSectionDivider text="Itens adquiridos" />

  <!-- Grid de habilidades -->
  <div class="abilities-grid">
    <BaseItemTooltip v-if="displayedGold > 0" resource="gold" no-highlight data-modal-keep-open>
      <BaseAbilityIcon rarity="gray" size="sm" :clickable="true" :quantity="`${displayedGold}`">
        <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
          <span class="drop-shadow-xs drop-shadow-black text-gold">
            <SvgCoinIcon :size="25" />
          </span>
        </p>
      </BaseAbilityIcon>
    </BaseItemTooltip>

    <BaseItemTooltip v-if="displayedCash > 0" resource="gems" no-highlight data-modal-keep-open>
      <BaseAbilityIcon rarity="gray" size="sm" :clickable="true" :quantity="`${displayedCash}`">
        <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
          <span class="drop-shadow-xs drop-shadow-black text-green-500">
            <SvgGemIcon :size="25" />
          </span>
        </p>
      </BaseAbilityIcon>
    </BaseItemTooltip>

    <BaseItemTooltip v-if="displayedExp > 0" resource="exp" no-highlight data-modal-keep-open>
      <BaseAbilityIcon rarity="gray" size="sm" :clickable="true" :quantity="`${displayedExp}`">
        <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
          <span class="drop-shadow-xs drop-shadow-black">
            <SvgExpIcon :size="25" />
          </span>
        </p>
      </BaseAbilityIcon>
    </BaseItemTooltip>

    <BaseItemTooltip
      v-for="[type, amount] in displayedKeys"
      :key="`key-${type}`"
      :resource="keyItemId(type)"
      no-highlight
      data-modal-keep-open
    >
      <BaseAbilityIcon rarity="gray" size="sm" :clickable="true" :quantity="`${amount}`">
        <p class="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
          <SvgKeyIcon :size="30" :type="type" />
        </p>
      </BaseAbilityIcon>
    </BaseItemTooltip>

    <div v-for="item in displayedEquipment" :key="`eq-${item.uid}`" class="w-16" data-modal-keep-open>
      <BaseItemTooltip :item="item">
        <LobbyEquipmentItemCard :item="item" />
      </BaseItemTooltip>
    </div>
  </div>

  <!-- Slot de actions para os botões grandes -->
  <template #actions>
    <p class="title-text text-white animate-pulse animate">Toque para continuar</p>
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

/* Colunas do tamanho exato do item (4rem): o gap fica igual na horizontal e na vertical
   e as peças ficam lado a lado em vez de espalhadas. O max-width limita a 5 por linha. */
.abilities-grid {
  --item-size: 4rem;
  --grid-gap: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, var(--item-size));
  gap: var(--grid-gap);
  justify-content: center;
  max-width: calc(5 * var(--item-size) + 4 * var(--grid-gap));
  margin-inline: auto;
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
    --grid-gap: 0.5rem;
  }
}
</style>
