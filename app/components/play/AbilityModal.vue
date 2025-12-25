<script setup lang="js">
import { useModal } from '~/composables/useModal';
import PlayModal from '~/components/play/PlayModal.vue';

/**
 * EXEMPLO DE MODAL COM NAVEGAÇÃO DE HABILIDADES
 *
 * Este modal mostra como usar o subtitle com setas de navegação
 */

const MODAL_ID = 'ability-modal';

const { open, close, isOpen } = useModal(MODAL_ID);

// Estado para controlar qual habilidade está sendo exibida
const currentAbilityIndex = ref(0);

const abilities = [
  {
    id: 1,
    name: 'Habilidade já obtida',
    icon: '⚡',
    description: 'Você já possui esta habilidade',
    obtained: true,
  },
  {
    id: 2,
    name: 'Tiro Triplo',
    icon: '🎯',
    description: 'Dispara três projéteis ao mesmo tempo',
    obtained: false,
  },
  {
    id: 3,
    name: 'Escudo',
    icon: '🛡️',
    description: 'Protege contra 3 ataques',
    obtained: false,
  },
];

const currentAbility = computed(() => abilities[currentAbilityIndex.value]);

function handleNavigatePrev() {
  currentAbilityIndex.value = (currentAbilityIndex.value - 1 + abilities.length) % abilities.length;
}

function handleNavigateNext() {
  currentAbilityIndex.value = (currentAbilityIndex.value + 1) % abilities.length;
}

function handleClose() {
  currentAbilityIndex.value = 0;
  close();
}

defineExpose({ open, close, isOpen });
</script>

<template>
  <PlayModal
    :modal-id="MODAL_ID"
    title="Habilidades"
    :divider-text="currentAbility.name"
    max-width="max-w-md"
    @close="handleClose"
  >
    <!-- Conteúdo da habilidade -->
    <div class="flex flex-col items-center gap-4">
      <!-- Navegação de habilidades -->
      <div class="ability-navigation">
        <button
          @click="handleNavigatePrev"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <span class="ability-counter">{{ currentAbilityIndex + 1 }} / {{ abilities.length }}</span>

        <button
          @click="handleNavigateNext"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>

      <!-- Ícone grande da habilidade -->
      <div class="ability-icon-container">
        <div class="ability-icon">
          {{ currentAbility.icon }}
        </div>
      </div>

      <!-- Descrição -->
      <p class="text-white text-center font-semibold text-lg">
        {{ currentAbility.description }}
      </p>

      <!-- Status -->
      <div
        class="status-badge"
        :class="currentAbility.obtained ? 'status-obtained' : 'status-locked'"
      >
        {{ currentAbility.obtained ? '✓ Obtida' : '🔒 Bloqueada' }}
      </div>
    </div>

    <!-- Botão de fechar -->
    <template #actions>
      <BaseButton
        variant="blue"
        size="md"
        @click="handleClose"
      >
        Fechar
      </BaseButton>
    </template>
  </PlayModal>
</template>

<style scoped>
.ability-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  margin-bottom: 1rem;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.nav-button:active {
  transform: scale(0.95);
}

.ability-counter {
  font-family: 'Fredoka One', sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.ability-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 2rem;
}

.ability-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8rem;
  height: 8rem;
  font-size: 4rem;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.15) 100%
  );
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  backdrop-filter: blur(4px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.4);
}

.status-badge {
  padding: 0.5rem 1.5rem;
  font-family: 'Fredoka One', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.5px;
  border-radius: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.status-obtained {
  background: linear-gradient(
    to bottom,
    #7ce85c 0%,
    #5cd63c 50%,
    #3cc41c 100%
  );
  color: white;
  border: 2px solid #1a7a0a;
  box-shadow:
    0 1px 0 0 #1a9210,
    0 2px 0 0 #1a8a0e,
    0 3px 0 0 #1a850d,
    0 4px 6px rgba(0, 0, 0, 0.3);
}

.status-locked {
  background: linear-gradient(
    to bottom,
    #888 0%,
    #666 50%,
    #444 100%
  );
  color: #ccc;
  border: 2px solid #333;
  box-shadow:
    0 1px 0 0 #555,
    0 2px 0 0 #444,
    0 3px 0 0 #333,
    0 4px 6px rgba(0, 0, 0, 0.3);
}

@media (max-width: 640px) {
  .ability-icon {
    width: 6rem;
    height: 6rem;
    font-size: 3rem;
  }
}
</style>
