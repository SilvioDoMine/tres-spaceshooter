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
        :height="60"
        variant="yellow"
      />
    </template>

    <!-- Section divider -->
    <BaseSectionDivider :text="skillStore.currentSkills.length > 0 ? 'Habilidades Obtidas' : 'Nenhuma habilidade obitida'" />

    <!-- Grid de habilidades -->
    <div class="abilities-grid">
      <BaseAbilityIcon
        v-for="skill in skillStore.currentSkills"
        :key="skill.id"
        :icon="skill.icon"
        :status="skill.status"
        :badge="`${skillStore.getSkillLevel(skill.id)}`"
        :rarity="getRarityFromSkill(skill)"
        size="md"
        @click="handleAbilityClick(skill)"
      >
        <!-- No before adiciona um glow branco transparente atrás do ícone para dar um efeito -->
        <p 
          class="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          >
          <span class="drop-shadow-xs drop-shadow-black">
            {{ skill.icon }}
          </span>
        </p>
      </BaseAbilityIcon>
    </div>

    <!-- Slot de actions para os botões grandes -->
    <template #actions>
      <BaseButton
        variant="red"
        size="sm"
        @click="uiModalConfig.open()"
      >
        Config
      </BaseButton>

      <BaseButton
        variant="yellow"
        size="sm"
        @click="handleQuit"
      >
        Deixar Batalha
      </BaseButton>

      <BaseButton
        variant="green"
        size="sm"
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
