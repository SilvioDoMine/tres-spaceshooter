<script setup lang="js">
import { useModal } from '~/composables/useModal';

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
  /** Largura máxima do modal */
  maxWidth: {
    type: String,
    default: 'max-w-md',
  },
  /** Cor de fundo do conteúdo */
  bgColor: {
    type: String,
    default: 'bg-orange-300',
  },
  /** Cor da sombra */
  shadowColor: {
    type: String,
    default: 'shadow-orange-400',
  },
  /** Cor do título */
  titleBgColor: {
    type: String,
    default: 'bg-blue-500',
  },
  /** Cor da sombra do título */
  titleShadowColor: {
    type: String,
    default: 'shadow-blue-600',
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
      class="bg-black/80 fixed inset-0 flex items-center justify-center p-4 pointer-events-auto"
      :style="{ zIndex: zIndex }"
      @click="handleOverlayClick"
    >
        <!-- Modal Content -->
        <div
          :class="['w-full relative rounded-md shadow-md', maxWidth, bgColor, shadowColor]"
          @click="handleContentClick"
        >
          <!-- Close Button -->
          <button
            v-if="showCloseButton"
            @click="handleClose"
            class="absolute top-2 cursor-pointer right-2 w-7 h-7 text-amber-900 rounded-full flex items-center justify-center hover:rotate-90 hover:scale-90 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <path fill="currentColor" d="m12 13.4l2.9 2.9q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.9-2.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.1 7.7q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.9 2.9l-2.9 2.9q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0 8.6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/>
            </svg>
          </button>

          <!-- Title -->
          <div
            v-if="title"
            :class="['absolute shadow-md px-4 flex top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md items-center', titleBgColor, titleShadowColor]"
          >
            <!-- Screw Left -->
            <div class="w-3 h-3 bg-gray-400 rounded-sm rotate-45"></div>

            <!-- Title Text -->
            <h2 class="text-xl md:text-2xl whitespace-nowrap font-bold px-6 py-2 text-white text-shadow-md text-shadow-gray-800">
              {{ title }}
            </h2>

            <!-- Screw Right -->
            <div class="w-3 h-3 rounded-sm rotate-45 bg-gray-400"></div>
          </div>

          <!-- Content Slot -->
          <div :class="['p-4', title ? 'mt-10' : '']">
            <slot />
          </div>
        </div>
    </div>
  </Transition>
</template>
