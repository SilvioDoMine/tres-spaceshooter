<script setup lang="js">
import { useModal } from '~/composables/useModal';
import BaseModal from '~/components/ui/BaseModal.vue';

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
const MODAL_ID = 'example-modal';

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

function handleConfirm() {
  emit('confirmed');
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
    title="Exemplo de Modal"
    max-width="max-w-lg"
    @close="handleCancel"
  >
    <!-- Conteúdo customizado vai aqui -->
    <div class="flex flex-col gap-4">
      <p class="text-amber-900">
        Olá, {{ userName }}! Este é um exemplo de modal reutilizável.
      </p>

      <!-- Ações -->
      <div class="flex gap-2 justify-end">
        <button
          @click="handleCancel"
          class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition"
        >
          Cancelar
        </button>
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
