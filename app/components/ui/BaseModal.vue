<script setup lang="js">
import { onMounted, onUnmounted } from 'vue';
import { useModal, registerEscapeHandler, unregisterEscapeHandler } from '~/composables/useModal';

// Modal do lobby no mesmo formato dos diálogos da Loja e das telas da partida: painel de madeira clara com
// contorno escuro e sombra dura, faixa de título (BaseRibbonTitle) pendurada no topo, X redondo no canto
// e o conteúdo numa área clara rolável.
const props = defineProps({
  /** ID único do modal */
  modalId: {
    type: String,
    required: true,
  },
  /** Título do modal */
  title: {
    type: String,
    default: '',
  },
  /** Cor da faixa do título */
  variant: {
    type: String,
    default: 'blue',
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
  /** Mostrar botão de fechar */
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  /** Desabilitar fechamento com a tecla ESC (por padrão segue o overlay) */
  disableEscClose: {
    type: Boolean,
    default: null,
  },
});

const emit = defineEmits(['close', 'open']);

const { isOpen, zIndex, close } = useModal(props.modalId);

// Debug: Log estado do modal
if (import.meta.client) {
  import('vue').then(({ watch }) => {
    watch(isOpen, (newValue) => {
      console.log(`[BaseModal:${props.modalId}] isOpen mudou para:`, newValue);
    }, { immediate: true });
  });
}

function handleClose() {
  close();
  emit('close');
}

function handleOverlayClick() {
  if (!props.disableOverlayClose) {
    handleClose();
  }
}

function handleContentClick(e) {
  // Previne fechar quando clicar no conteúdo
  e.stopPropagation();
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
  <Transition name="lmodal">
    <div
      v-if="isOpen"
      class="lmodal pointer-events-auto"
      :style="{ zIndex: zIndex }"
      @click="handleOverlayClick"
    >
      <div
        :class="['lmodal__panel', maxWidth, { 'has-title': title }]"
        @click="handleContentClick"
      >
        <span class="lmodal__shine" aria-hidden="true"></span>

        <div v-if="title" class="lmodal__title">
          <BaseRibbonTitle :text="title" :variant="variant" />
        </div>

        <BaseCloseButton
          v-if="showCloseButton"
          class="lmodal__close"
          @click="handleClose"
        />

        <div class="lmodal__body allow-scroll">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.lmodal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 16px 24px;
  background: rgba(6, 8, 22, 0.72);
}

.lmodal__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100dvh - 80px);
  padding: 14px 12px 14px;
  border-radius: 22px;
  background: linear-gradient(180deg, #f5cf99 0%, #e8b06c 55%, #d99a55 100%);
  border: 3px solid #8a531f;
  box-shadow:
    0 6px 0 #6b3d12,
    0 16px 30px rgba(0, 0, 0, 0.5),
    inset 0 3px 0 rgba(255, 255, 255, 0.45),
    inset 0 -6px 0 rgba(0, 0, 0, 0.08);
  animation: lmodal-pop 0.28s cubic-bezier(0.3, 1.5, 0.6, 1);
}
.lmodal__panel.has-title {
  padding-top: 44px;
}

/* Brilho oval do canto (igual às cartas e aos botões) */
.lmodal__shine {
  position: absolute;
  top: 8px;
  left: 12px;
  width: 22px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  rotate: -30deg;
  pointer-events: none;
}

/* Faixa pendurada: metade para fora do painel */
.lmodal__title {
  position: absolute;
  z-index: 4;
  top: 0;
  left: 12px;
  right: 12px;
  translate: 0 -58%;
  pointer-events: none;
}

.lmodal__close {
  position: absolute;
  z-index: 5;
  top: -14px;
  right: -12px;
}

.lmodal__body {
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  border-radius: 14px;
  background: #fdf3dc;
  border: 2px solid #e2c08e;
  box-shadow: inset 0 3px 0 rgba(138, 83, 31, 0.1);
  color: #5a3a1c;
  /* Rolagem só quando precisa, com barra fina no tom da madeira */
  scrollbar-width: thin;
  scrollbar-color: #c9964f transparent;
  overscroll-behavior: contain;
}
.lmodal__body::-webkit-scrollbar {
  width: 8px;
}
.lmodal__body::-webkit-scrollbar-track {
  margin: 8px 0;
  background: transparent;
}
.lmodal__body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid #fdf3dc;
  background: #c9964f;
}
.lmodal__body::-webkit-scrollbar-thumb:hover {
  background: #a8742f;
}

.lmodal-enter-active,
.lmodal-leave-active {
  transition: opacity 0.2s ease;
}
.lmodal-enter-from,
.lmodal-leave-to {
  opacity: 0;
}

@keyframes lmodal-pop {
  from {
    scale: 0.85;
  }
  to {
    scale: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lmodal__panel {
    animation: none;
  }
}
</style>
