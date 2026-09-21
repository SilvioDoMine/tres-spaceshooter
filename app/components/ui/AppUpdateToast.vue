<script setup lang="ts">
// A versão nova é aplicada sozinha (plugins/pwa.client.ts) no primeiro momento
// em que não custa nada: a tela de loading, ou fora de partida e sem modal aberto.
//
// Dois avisos, então:
// - normal: só para quem está no meio de uma run, explicando a espera — recarregar
//   ali perderia a partida;
// - obrigatório: release marcado como incompatível (major, ou APP_MIN_VERSION no
//   build). Esse não espera nada e reinicia o jogo em segundos, então o aviso
//   aparece em qualquer tela e não pode ser dispensado.
const { updateReady, updateRequired } = usePwa();
const route = useRoute();
const dismissed = ref(false);

const inMatch = computed(() => route.path.startsWith('/play'));
const required = computed(() => updateReady.value && updateRequired.value);
const show = computed(() => required.value || (updateReady.value && inMatch.value && !dismissed.value));

// Ao sair da partida o aviso perde o sentido (a troca acontece na hora)
watch(() => route.path, () => { dismissed.value = false; });
</script>

<template>
  <Transition name="update-toast">
    <div v-if="show" class="update-toast pointer-events-auto" :class="{ 'update-toast--required': required }">
      <p v-if="required" class="update-toast__text">
        Atualização obrigatória. O jogo vai reiniciar em instantes.
      </p>
      <template v-else>
        <p class="update-toast__text">Nova versão pronta. Ela entra assim que você sair da partida.</p>
        <button class="update-toast__button" @click="dismissed = true">Ok</button>
      </template>
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

.update-toast--required {
  border-color: rgba(255, 196, 124, 0.45);
  background: rgba(38, 20, 6, 0.95);
}

.update-toast__text {
  flex: 1;
  font-size: 14px;
  color: #dceaff;
}

.update-toast--required .update-toast__text {
  color: #ffe6c7;
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
