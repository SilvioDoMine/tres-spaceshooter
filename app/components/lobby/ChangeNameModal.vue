<script setup lang="js">
import { useModal } from '~/composables/useModal';
import BaseModal from '~/components/ui/BaseModal.vue';
import { useLobbyStore } from '~/stores/useLobbyStore';

/**
 * EXEMPLO DE USO DO SISTEMA DE MODAIS
 *
 * Este é um exemplo de como criar um novo modal usando BaseModal
 *
 * CARACTERÍSTICAS:
 * - Reutilizável: Use BaseModal como base
 * - Agnóstico: Não depende de store global
 * - Empilhável: Pode abrir múltiplos modais
 * - Simples: KISS principle
 */

// 1. Crie um ID único para seu modal
const MODAL_ID = 'change-name-modal';

// 2. Use o composable useModal
const { open, close, isOpen } = useModal(MODAL_ID);

// 3. (Opcional) Defina props se necessário
const props = defineProps({
  userName: {
    type: String,
    default: 'Usuário',
  },
});

// 4. (Opcional) Emita eventos se necessário
const emit = defineEmits(['confirmed', 'cancelled']);
const profileNameInput = ref('');
const { changeProfileName } = useLobbyStore();

function handleConfirm() {
  emit('confirmed');

  changeProfileName(profileNameInput.value);

  close();
}

function handleCancel() {
  emit('cancelled');
  close();
}

// 5. (Opcional) Exponha a função open para uso externo
defineExpose({ open, close, isOpen });
</script>

<template>
  <!--
    Use BaseModal e passe:
    - modal-id: ID único do modal
    - title: Título do modal
    - @close: Callback quando fechar
    - Outros props opcionais: maxWidth, bgColor, shadowColor, etc
  -->
  <BaseModal
    :modal-id="MODAL_ID"
    title="Alterar Nome"
    max-width="max-w-lg"
    @close="handleCancel"
  >
    <!-- Conteúdo customizado vai aqui -->
    <div class="flex flex-col gap-4">
      <div class="bg-white/40 rounded-md flex flex-col flex-1 gap-4 p-4">
        <h3 class="text-lg text-center font-semibold text-amber-900">Escolha seu nome de usuário</h3>
        <input
          type="text"
          placeholder="Digite o novo nome aqui..."
          class="game-input"
          v-model="profileNameInput"
        />
      </div>

      <!-- Ações -->
      <div class="flex gap-2 justify-center">
        <button
          @click="handleConfirm"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition"
        >
          Confirmar
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
/* input should have no effects in any browser, should be a div rounded, with bold centered text in the middle */
.game-input {
  /* Reset geral */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  border: none;
  outline: none;
  box-shadow: none;
  background: transparent;

  /* Evita zoom automático no iOS */
  font-size: 16px;

  /* Remove borda arredondada do iOS */
  border-radius: 0;

  /* Remove highlight azul ao tocar */
  -webkit-tap-highlight-color: transparent;

  /* Remove autofill styles */
  -webkit-text-fill-color: inherit;
}

.game-input {
  width: 100%;
  padding: 14px 16px;

  background-color: #f6e7c5;
  color: #8b5e3c;

  font-weight: 600;
  text-align: center;

  border-radius: 12px;
}

.game-input::placeholder {
  color: #b38a65;
  opacity: 1; /* Safari */
}

.game-input:focus {
  outline: none;
  box-shadow: none;
}
</style>
<!--
  COMO USAR ESTE MODAL EM OUTRO COMPONENTE:

  <script setup>
  import ExampleModal from '~/components/ui/ExampleModal.vue';
  import { ref } from 'vue';

  const exampleModalRef = ref();

  function openExampleModal() {
    exampleModalRef.value.open();
  }

  function handleConfirmed() {
    console.log('Usuário confirmou!');
  }
  </script>

  <template>
    <button @click="openExampleModal">Abrir Modal</button>

    <ExampleModal
      ref="exampleModalRef"
      user-name="Arthur"
      @confirmed="handleConfirmed"
    />
  </template>
-->
