<script setup lang="ts">
// Diálogo da Loja no estilo da referência: painel de madeira clara, título numa faixa azul e X redondo.
const props = withDefaults(defineProps<{ open: boolean; title: string; width?: string }>(), { width: '380px' });
const emit = defineEmits<{ close: [] }>();

function onKey(event: KeyboardEvent) {
  if (!props.open || event.key !== 'Escape') return;
  event.stopImmediatePropagation();
  emit('close');
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onUnmounted(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="sdialog">
      <div v-if="open" class="sdialog" role="dialog" aria-modal="true" :aria-label="title" @click="emit('close')">
        <div class="sdialog__panel" :style="{ width: `min(${width}, 100%)` }" @click.stop>
          <header class="sdialog__title">
            <i aria-hidden="true"></i>
            <h2>{{ title }}</h2>
            <i aria-hidden="true"></i>
          </header>
          <button type="button" class="sdialog__close" aria-label="Fechar" data-ui-sound="off" @click="emit('close')">✕</button>

          <div class="sdialog__body allow-scroll">
            <slot />
          </div>

          <footer v-if="$slots.actions" class="sdialog__actions">
            <slot name="actions" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sdialog {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 40px 16px 24px;
  background: rgba(6, 8, 22, 0.72);
}
.sdialog__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  /* % não limita item de grid com altura automática: usa a tela menos o padding e o título pendurado */
  max-height: calc(100dvh - 72px);
  padding: 34px 12px 14px;
  border-radius: 22px;
  background: linear-gradient(#f1c58c, #d99a55);
  border: 3px solid #8a531f;
  box-shadow: 0 6px 0 #6b3d12, inset 0 3px 0 rgba(255, 255, 255, 0.45);
}
.sdialog__title {
  position: absolute;
  top: -22px;
  left: 50%;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 86%;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 12px;
  background: linear-gradient(#4fb2ff, #2a7ee0);
  border: 3px solid #134a91;
  box-shadow: 0 4px 0 #134a91, inset 0 2px 0 rgba(255, 255, 255, 0.45);
}
.sdialog__title h2 {
  margin: 0;
  font: 24px/1.1 'Lilita One', sans-serif;
  color: #fff;
  text-align: center;
  -webkit-text-stroke: 5px #134a91;
  paint-order: stroke fill;
}
.sdialog__title i {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  rotate: 45deg;
  border-radius: 3px;
  background: linear-gradient(135deg, #fff, #b9d6f2);
  border: 2px solid #134a91;
}
.sdialog__close {
  position: absolute;
  top: -12px;
  right: -8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid #8a531f;
  background: linear-gradient(#ffe0b0, #e8a35a);
  color: #7a3f0c;
  font: 16px/1 'Lilita One', sans-serif;
  cursor: pointer;
  box-shadow: 0 3px 0 #6b3d12;
}
.sdialog__body {
  min-height: 0;
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  background: #fdf3dc;
  border: 2px solid #e2c08e;
  color: #5a3a1c;
  font-family: 'Lilita One', sans-serif;
  /* Rolagem só quando precisa, com barra fina no tom da madeira */
  scrollbar-width: thin;
  scrollbar-color: #c9964f transparent;
  overscroll-behavior: contain;
}
.sdialog__body::-webkit-scrollbar {
  width: 8px;
}
.sdialog__body::-webkit-scrollbar-track {
  margin: 8px 0;
  background: transparent;
}
.sdialog__body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid #fdf3dc;
  background: #c9964f;
}
.sdialog__body::-webkit-scrollbar-thumb:hover {
  background: #a8742f;
}
.sdialog__actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 12px;
}
.sdialog-enter-active,
.sdialog-leave-active {
  transition: opacity 0.2s ease;
}
.sdialog-enter-active .sdialog__panel {
  transition: scale 0.25s cubic-bezier(0.3, 1.5, 0.6, 1);
}
.sdialog-enter-from,
.sdialog-leave-to {
  opacity: 0;
}
.sdialog-enter-from .sdialog__panel {
  scale: 0.85;
}
</style>
