<script setup lang="js">
import { useModal } from '~/composables/useModal';
import BaseSectionDivider from '~/components/base/SectionDivider.vue';

const props = defineProps({
  /** ID único do modal */
  modalId: {
    type: String,
    required: true,
  },
  /** Título do modal (ribbon amarelo) */
  title: {
    type: String,
    default: '',
  },
  /** Texto do separador (opcional) */
  dividerText: {
    type: String,
    default: '',
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
        <BaseRibbonTitle
          v-if="title"
          :text="title"
          :height="60"
          primary-yellow="#FFD84D"
          dark-yellow="#F5C842"
          border-orange="#D69B2D"
        />

        <div class="flex flex-col gap-2">
          <!-- Section divider (separador decorativo) -->
          <BaseSectionDivider :text="dividerText" />

          <!-- Content slot -->
          <div class="play-modal-content">
            <slot />
          </div>
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
/* Yellow ribbon title */
.play-modal-title-ribbon {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.play-modal-title-content {
  position: relative;
  padding: 0.75rem 2.5rem;
  background: linear-gradient(
    to bottom,
    #ffd966 0%,
    #f4c542 50%,
    #e0b036 100%
  );
  border: 3px solid #b8922a;
  border-radius: 8px;
  box-shadow:
    0 2px 0 0 #a88024,
    0 3px 0 0 #9d761f,
    0 4px 0 0 #926d1a,
    0 5px 0 0 #876315,
    0 6px 8px rgba(0, 0, 0, 0.4);
}

/* Ribbon folds (triangles on sides) */
.play-modal-title-content::before,
.play-modal-title-content::after {
  content: '';
  position: absolute;
  top: 0;
  width: 0;
  height: 0;
  border-style: solid;
}

.play-modal-title-content::before {
  left: -12px;
  border-width: 0 12px 12px 0;
  border-color: transparent #876315 transparent transparent;
}

.play-modal-title-content::after {
  right: -12px;
  border-width: 12px 12px 0 0;
  border-color: #876315 transparent transparent transparent;
}

.play-modal-title-text {
  font-family: 'Lilita One', sans-serif;
  font-size: 1.75rem;
  font-weight: 400;
  color: white;
  white-space: nowrap;
  letter-spacing: 0.5px;
  text-shadow:
    -2px -2px 0 rgba(135, 99, 21, 0.5),
    2px -2px 0 rgba(135, 99, 21, 0.5),
    -2px 2px 0 rgba(135, 99, 21, 0.5),
    2px 2px 0 rgba(135, 99, 21, 0.5),
    0 3px 6px rgba(0, 0, 0, 0.4);
}

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
