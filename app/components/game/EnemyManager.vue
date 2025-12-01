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
      return 'pink';
    default:
      return 'red';
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
      <!-- HP -->
      <Suspense>
        <Text3D
          :position="[0, 0, 1]"
          :rotation="[ -Math.PI / 2, 0, 0 ]"
          :size="0.25"
          :bevel-enabled="false"
          :text="`HP: ${enemy.health}`"
          color="black"
          font="/fonts/PoppinsBold.json"
          need-updates
          center
        >
          <TresMeshNormalMaterial />
        </Text3D>
      </Suspense>
    </TresMesh>
  </TresGroup>
</template>