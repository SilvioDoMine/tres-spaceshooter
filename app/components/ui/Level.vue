<script setup lang="js">
import { computed, ref, nextTick, watchEffect } from 'vue'; // 👈 Importe ref e nextTick
const currentRunStore = useCurrentRunStore();

// 1. Variável para controlar se a transição CSS deve ser aplicada
const shouldTransition = ref(true);

const progressPercentage = computed(() => {
  const currentExp = currentRunStore.currentExp;
  const expToNextLevel = currentRunStore.expToNextLevel;

  if (expToNextLevel === 0) return 100;

  const percentage = (currentExp / expToNextLevel) * 100;
  return Math.min(percentage, 100);
});

const previousProgress = ref(progressPercentage.value);

// 2. Lógica para redefinir a barra
watchEffect(() => {
  // Observa a porcentagem. Se atinxgir 100%, é hora de resetar.
  if (progressPercentage.value < previousProgress.value) {
    // 2.1. Desativa a transição IMEDIATAMENTE.
    shouldTransition.value = false;

    // 2.2. Usa nextTick para garantir que a desativação da transição
    // (o que é uma atualização da DOM) aconteça antes do reset.
    nextTick(() => {
      // 2.3. Em seguida, a store deve atualizar o EXP para o novo nível,
      // fazendo com que progressPercentage caia para perto de 0%.
      // O progresso real para o novo nível acontecerá aqui.
      // (Supondo que currentRunStore.currentExp e expToNextLevel
      // são atualizados logo após o jogador subir de nível)

      // 2.4. Pequeno atraso para garantir que o progresso tenha sido
      // redefinido para ~0% (ou o valor inicial do novo nível)
      // E só ENTÃO reativar a transição.
      // 10ms é geralmente suficiente, mas pode ser ajustado.
      setTimeout(() => {
        shouldTransition.value = true;
      }, 10);
    });
  }

  previousProgress.value = progressPercentage.value;
});
</script>
<template>
  <div class="absolute top-0 mt-8 left-0 z-10 flex flex-col gap-4 w-full pointer-events-none">
    <div class="mx-auto flex flex-col items-center gap-2">
      <div class="flex flex-col items-center">
         <div class="text-white text-[9px] font-bold px-6 line-clamp-1 bg-white/20 rounded-t-lg">Lv. {{ currentRunStore.currentLevel }}</div>
          <div class="w-64 h-4 bg-white/20 rounded-full overflow-hidden border-white/20 border-2">
            <div
              class="h-full bg-green-500"
              :class="{ 'transition-all duration-500': shouldTransition }" :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
      </div>
      </div>
  </div>
</template>