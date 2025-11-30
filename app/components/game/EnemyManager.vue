<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRun';

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
</script>

<template>
  <TresGroup>
    <TresMesh
      v-for="(enemy, index) in activeEnemies"
      :key="index"
      :name="`enemy-${index}`"
      :position="enemy.position"
    >
      <TresMeshStandardMaterial :color="getEnemyColor(enemy.type)" />
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="pink" />
    </TresMesh>
  </TresGroup>
</template>