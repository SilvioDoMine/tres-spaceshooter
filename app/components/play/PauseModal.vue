<script setup lang="js">
import { useModal } from '~/composables/useModal';
import PlayModal from '~/components/play/PlayModal.vue';
import BaseAbilityIcon from '~/components/base/AbilityIcon.vue';

/**
 * Modal de Pausa do Jogo
 * Mostra habilidades obtidas e permite pausar/continuar/sair
 */

const MODAL_ID = 'pause-modal';

const { open, close, isOpen } = useModal(MODAL_ID);

// Props opcionais para customizar habilidades
const props = defineProps({
  /** Nível atual */
  level: {
    type: Number,
    default: 4,
  },
  /** Missão atual */
  mission: {
    type: String,
    default: 'Estrela da Expedição x1',
  },
  /** Habilidades disponíveis */
  abilities: {
    type: Array,
    default: () => [
      { id: 1, icon: '/images/icons/icon-01.png', status: 'obtained', badge: '' },
      { id: 2, icon: '/images/icons/icon-02.png', status: 'obtained', badge: '' },
      { id: 3, icon: '/images/icons/icon-03.png', status: 'obtained', badge: '' },
      { id: 4, icon: '/images/icons/icon-04.png', status: 'obtained', badge: '' },
    ],
  },
});

const emit = defineEmits(['resume', 'quit', 'ability-click']);

function handleResume() {
  emit('resume');
  close();
  useCurrentRunStore().gameResume();
}

function handleQuit() {
  emit('quit');
  close();
  useRouter().push('/'); // Volta para a tela inicial
}

function handleAbilityClick(ability) {
  emit('ability-click', ability);
}

defineExpose({ open, close, isOpen });

const skillStore = useSkillStore();

function getRarityFromSkill(skill) {
  // Exemplo simples: mapear status para raridade
  switch (skill.rarity) {
    case 'common':
      return 'gray';
    case 'uncommon':
      return 'green';
    case 'rare':
      return 'blue';
    case 'epic':
      return 'purple';
    case 'legendary':
      return 'orange';
    default:
      return 'gray';
  }
}

// config
const uiModalConfig = useModal('settings-modal');

// ESC ou P: pausa durante a partida; com o modal de pausa no topo, continua.
// Durante a escolha de habilidade o jogo também fica 'paused', mas sem este
// modal aberto — aí o atalho não faz nada para não pular a escolha.
const { isTopModal } = useModal(MODAL_ID);
const currentRunStore = useCurrentRunStore();

function handlePauseKey(event) {
  if (event.repeat || (event.key !== 'Escape' && event.key.toLowerCase() !== 'p')) return;

  if (currentRunStore.isPlaying) {
    event.preventDefault();
    currentRunStore.gamePause();
  } else if (isTopModal.value) {
    event.preventDefault();
    handleResume();
  } else if (isOpen.value && uiModalConfig.isTopModal.value) {
    // Config aberta por cima da pausa: fecha só a Config
    event.preventDefault();
    uiModalConfig.close();
  }
}

onMounted(() => window.addEventListener('keydown', handlePauseKey));
onUnmounted(() => window.removeEventListener('keydown', handlePauseKey));
</script>

<template>
  <PlayModal
    :modal-id="MODAL_ID"
    max-width="max-w-lg"
    :disable-overlay-close="true"
  >
    <!-- Title slot -->
    <template #title>
      <BaseRibbonTitle
        text="Jogo Pausado"
        variant="yellow"
      />
    </template>

    <!-- Section divider -->
    <BaseSectionDivider
      class="pause-divider"
      :text="skillStore.currentSkills.length > 0 ? 'Habilidades Obtidas' : 'Nenhuma habilidade obitida'"
    />

    <!-- Grid de habilidades -->
    <div class="abilities-grid">
      <BaseAbilityIcon
        v-for="(skill, index) in skillStore.currentSkills"
        :key="skill.id"
        class="pause-ability"
        :style="{ '--i': index }"
        :status="skill.status"
        :badge="`${skillStore.getSkillLevel(skill.id)}`"
        :rarity="getRarityFromSkill(skill)"
        size="md"
        @click="handleAbilityClick(skill)"
      >
        <SkillIcon :icon="skill.icon" />
      </BaseAbilityIcon>
    </div>

    <!-- Slot de actions para os botões grandes -->
    <template #actions>
      <BaseButton
        variant="red"
        size="sm"
        class="pause-action"
        :style="{ '--i': 0 }"
        @click="uiModalConfig.open()"
      >
        Config
      </BaseButton>

      <BaseButton
        variant="yellow"
        size="sm"
        class="pause-action"
        :style="{ '--i': 1 }"
        @click="handleQuit"
      >
        Deixar Batalha
      </BaseButton>

      <BaseButton
        variant="green"
        size="sm"
        class="pause-action"
        :style="{ '--i': 2 }"
        @click="handleResume"
      >
        Continuar
      </BaseButton>
    </template>
  </PlayModal>
</template>

<style scoped>
.mission-info {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  text-align: center;
  font-family: 'Fredoka One', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.abilities-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  justify-items: center;
}

/* ==================== Entrada ====================
   Sequência depois da faixa: divisor abre do centro, habilidades pulam uma a uma com um flash e os botões
   sobem quicando. O PlayModal desmonta ao fechar, então a sequência toca a cada pausa.
   Os botões já usam `transform` (e o hover do ícone usa `scale`), por isso cada um anima outra propriedade. */
.pause-divider {
  animation: pause-divider-in 0.4s cubic-bezier(0.3, 1.3, 0.6, 1) 0.25s both;
}

.pause-ability {
  animation: pause-ability-in 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  animation-delay: calc(0.35s + var(--i) * 60ms);
}

.pause-action {
  animation: pause-action-in 0.45s cubic-bezier(0.3, 1.5, 0.5, 1) both;
  animation-delay: calc(0.45s + var(--i) * 80ms);
}

@keyframes pause-divider-in {
  from {
    opacity: 0;
    transform: scaleX(0.3);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes pause-ability-in {
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.3) rotate(-12deg);
    filter: brightness(1);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.12) rotate(4deg);
    filter: brightness(1.8);
  }
  100% {
    opacity: 1;
    transform: none;
    filter: brightness(1);
  }
}

@keyframes pause-action-in {
  from {
    opacity: 0;
    translate: 0 24px;
    scale: 0.7;
  }
  to {
    opacity: 1;
    translate: 0 0;
    scale: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pause-divider,
  .pause-ability,
  .pause-action {
    animation: none;
  }
}

/* Último item (6º) ocupa a primeira coluna da segunda linha */
.abilities-grid > *:nth-child(6) {
  grid-column: 1;
}

@media (max-width: 640px) {
  .abilities-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .abilities-grid > *:nth-child(6) {
    grid-column: auto;
  }

  .mission-info {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}
</style>
