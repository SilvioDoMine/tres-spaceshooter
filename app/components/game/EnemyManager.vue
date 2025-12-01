<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRun = useCurrentRunStore();
const enemyManager = useEnemyManager();

const activeEnemies = enemyManager.activeEnemies;

const getEnemyColor = (enemyType) => {
  switch (enemyType) {
    case 'asteroid':
      return 'gray';
    case 'ufo':
      return 'green';
    case 'boss':
      return 'red';
    default:
      return 'pink';
  }
};

onUnmounted(() => {
  enemyManager.cleanup();
});
</script>

<template>
  <TresGroup>
    <TresMesh
      v-for="(enemy, index) in activeEnemies"
      :key="index"
      :name="`enemy-${index}`"
      :position="[enemy.position.x, enemy.position.y, enemy.position.z]"
    >
      <TresMeshStandardMaterial :color="getEnemyColor(enemy.type)" />
      <TresBoxGeometry :args="[1, 1, 1]" />
    </TresMesh>
  </TresGroup>
</template>