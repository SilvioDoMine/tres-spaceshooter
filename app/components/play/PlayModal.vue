<script setup lang="js">
import { onMounted, onUnmounted } from 'vue';
import { useModal, registerEscapeHandler, unregisterEscapeHandler } from '~/composables/useModal';

const props = defineProps({
  /** ID único do modal */
  modalId: {
    type: String,
    required: true,
  },
  /** Largura máxima do modal */
  maxWidth: {
    type: String,
    default: 'max-w-md',
  },
  /** Desabilitar fechamento ao clicar no overlay */
  disableOverlayClose: {
    type: Boolean,
    default: false,
  },
  /** Fechar ao clicar em qualquer ponto do conteúdo, exceto em elementos marcados com data-modal-keep-open */
  closeOnContentClick: {
    type: Boolean,
    default: false,
  },
  /** Desabilitar fechamento com a tecla ESC (por padrão segue o overlay) */
  disableEscClose: {
    type: Boolean,
    default: null,
  },
});

const emit = defineEmits(['close']);

const { isOpen, zIndex, close } = useModal(props.modalId);

function handleClose() {
  emit('close');
  close();
}

function handleOverlayClick() {
  if (!props.disableOverlayClose) {
    handleClose();
  }
}

function handleContentClick(e) {
  // Previne fechar quando clicar no conteúdo
  e.stopPropagation();
  if (props.closeOnContentClick && !e.target.closest('[data-modal-keep-open]')) {
    handleClose();
  }
}

// ESC fecha o modal quando ele está no topo da pilha
const closesOnEsc = props.disableEscClose === null
  ? !props.disableOverlayClose
  : !props.disableEscClose;

onMounted(() => {
  if (closesOnEsc) registerEscapeHandler(props.modalId, handleClose);
});
onUnmounted(() => {
  if (closesOnEsc) unregisterEscapeHandler(props.modalId, handleClose);
});
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 flex items-center justify-center p-4 pointer-events-auto"
      :style="{ zIndex: zIndex }"
      @click="handleOverlayClick"
    >
      <!-- Transparent blur background -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <!-- Modal Content -->
      <div
        :class="['w-full relative', maxWidth]"
        class="flex flex-col gap-20"
        @click="handleContentClick"
      >
        <!-- Title slot -->
        <slot name="title" />

        <!-- Content slot -->
        <div class="play-modal-content">
          <slot />
        </div>

        <!-- Actions slot (bottom buttons) -->
        <div
          v-if="$slots.actions"
          class="play-modal-actions"
        >
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Content area */
.play-modal-content {
  position: relative;
  width: 100%;
  padding: 0rem 1.5rem;
}

/* Actions area */
.play-modal-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .play-modal-content {
    padding: 1rem;
  }
}
</style>
