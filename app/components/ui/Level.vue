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

      <!-- Room Number: 3 -->
      <div class="text-white text-sm px-4 bg-white/20 rounded-full flex items-center justify-center gap-2">
        <!-- Icon sword -->
        <svg v-if="['combat', 'boss'].includes(currentRunStore.currentStage?.type)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m19.05 21.6l-2.925-2.9l-1.5 1.5q-.275.275-.7.275t-.7-.275q-.575-.575-.575-1.425t.575-1.425l4.225-4.225q.575-.575 1.425-.575t1.425.575q.275.275.275.7t-.275.7l-1.5 1.5l2.9 2.925q.3.3.3.7t-.3.7l-1.25 1.25q-.3.3-.7.3t-.7-.3M21.7 6.2L10.65 17.25l.125.1q.575.575.575 1.425t-.575 1.425q-.275.275-.7.275t-.7-.275l-1.5-1.5l-2.925 2.9q-.3.3-.7.3t-.7-.3L2.3 20.35q-.3-.3-.3-.7t.3-.7l2.9-2.925l-1.5-1.5q-.275-.275-.275-.7t.275-.7q.575-.575 1.425-.575t1.425.575l.1.125L17.425 2.475q.275-.275.638-.425t.762-.15H21q.425 0 .713.288T22 2.9v2.575q0 .2-.075.388T21.7 6.2M6.225 10.125l-3.65-3.65Q2.3 6.2 2.15 5.838T2 5.075V2.9q0-.425.288-.712T3 1.9h2.175q.4 0 .763.15t.637.425l3.65 3.65q.3.3.3.713t-.3.712L7.65 10.125q-.3.3-.712.3t-.713-.3"/></svg>
        <!-- Gift icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 15 15"><!-- Icon from Teenyicons by smhmd - https://github.com/teenyicons/teenyicons/blob/master/LICENSE --><path fill="currentColor" fill-rule="evenodd" d="M4.5 0A2.5 2.5 0 0 0 2 2.5v.286c0 .448.133.865.362 1.214H1.5A1.5 1.5 0 0 0 0 5.5v1A1.5 1.5 0 0 0 1.5 8H7V4h1v4h5.5A1.5 1.5 0 0 0 15 6.5v-1A1.5 1.5 0 0 0 13.5 4h-.862c.229-.349.362-.766.362-1.214V2.5A2.5 2.5 0 0 0 10.5 0c-1.273 0-2.388.68-3 1.696A3.5 3.5 0 0 0 4.5 0M8 4h2.786C11.456 4 12 3.456 12 2.786V2.5A1.5 1.5 0 0 0 10.5 1A2.5 2.5 0 0 0 8 3.5zM7 4H4.214C3.544 4 3 3.456 3 2.786V2.5A1.5 1.5 0 0 1 4.5 1A2.5 2.5 0 0 1 7 3.5z" clip-rule="evenodd"/><path fill="currentColor" d="M7 9H1v3.5A2.5 2.5 0 0 0 3.5 15H7zm1 6h3.5a2.5 2.5 0 0 0 2.5-2.5V9H8z"/></svg>

        <span>{{ currentRunStore.currentStageIndex + 1 }}</span>
      </div>
    </div>
  </div>
</template>