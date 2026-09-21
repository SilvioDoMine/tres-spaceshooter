<script setup lang="ts">
// A versão nova é aplicada sozinha (plugins/pwa.client.ts) assim que der:
// fora de partida, sem modal aberto e com o jogo já carregado.
// Este aviso só aparece para quem está no meio de uma run, explicando a espera —
// recarregar ali perderia a partida.
const { updateReady } = usePwa();
const route = useRoute();
const dismissed = ref(false);

const show = computed(() => updateReady.value && route.path.startsWith('/play') && !dismissed.value);

// Ao sair da partida o aviso perde o sentido (a troca acontece na hora)
watch(() => route.path, () => { dismissed.value = false; });
</script>

<template>
  <Transition name="update-toast">
    <div v-if="show" class="update-toast pointer-events-auto">
      <p class="update-toast__text">Nova versão pronta. Ela entra quando você voltar ao lobby.</p>
      <button class="update-toast__button" @click="dismissed = true">Ok</button>
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

.update-toast__button {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
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
