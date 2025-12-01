<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const { onBeforeRender } = useLoop();
const currentRun = useCurrentRunStore();

// Se o jogador estiver sob a porta ativa, devemos completar o estágio
// Isso pode ser verificado em um loop de jogo ou via colisão
onBeforeRender(() => {
  if (currentRun.isDoorActive && currentRun.doorPosition) {
    const playerPos = currentRun.getPlayerPosition();
    const doorPos = currentRun.doorPosition;

    const distance = Math.sqrt(
      (playerPos.x - doorPos.x) ** 2 +
      (playerPos.y - doorPos.y) ** 2 +
      (playerPos.z - doorPos.z) ** 2
    );

    // Supondo que a porta tenha um tamanho definido (ex: 1 unidade)
    const doorSize = 1;

    if (distance < doorSize) {
      currentRun.nextStage();
    }
  }
});
</script>

<template>
  <TresMesh
    v-if="currentRun.isDoorActive"
    :position="[currentRun.doorPosition.x, currentRun.doorPosition.y, currentRun.doorPosition.z]"
    name="Door"
  >
    <TresBoxGeometry :args="[1, 1, 1]" />
    <TresMeshStandardMaterial color="blue" />
  </TresMesh>
</template>