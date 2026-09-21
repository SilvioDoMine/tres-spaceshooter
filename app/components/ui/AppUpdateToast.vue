<script setup lang="ts">
// Aparece quando o service worker já baixou uma versão nova do jogo.
// A troca só acontece no toque do jogador, para não recarregar no meio da partida.
const { updateReady, applyUpdate } = usePwa();
const dismissed = ref(false);
const show = computed(() => updateReady.value && !dismissed.value);
</script>

<template>
  <Transition name="update-toast">
    <div v-if="show" class="update-toast pointer-events-auto">
      <p class="update-toast__text">Nova versão disponível.</p>
      <div class="update-toast__actions">
        <button class="update-toast__button is-primary" @click="applyUpdate()">Atualizar</button>
        <button class="update-toast__button" @click="dismissed = true">Depois</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.update-toast {
  position: fixed;
  left: 50%;
  /* No topo: o rodapé do lobby é da TabBar e o toast ficaria escondido atrás dela */
  top: calc(52px + env(safe-area-inset-top));
  transform: translateX(-50%);
  z-index: 9500;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(92vw, 420px);
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(124, 199, 255, 0.35);
  background: rgba(6, 16, 38, 0.94);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.update-toast__text {
  flex: 1;
  font-size: 14px;
  color: #dceaff;
}

.update-toast__actions {
  display: flex;
  gap: 6px;
}

.update-toast__button {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #cfe6ff;
  background: rgba(255, 255, 255, 0.08);
}

.update-toast__button.is-primary {
  color: #041022;
  background: #7cc7ff;
}

.update-toast-enter-active,
.update-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.update-toast-enter-from,
.update-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -16px);
}
</style>
