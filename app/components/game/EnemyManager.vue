<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';

const currentRun = useCurrentRunStore();
const enemyManager = useEnemyManager();

const activeEnemies = enemyManager.activeEnemies;

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
      <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
      <TresBoxGeometry :args="[baseStats[enemy.type].size, baseStats[enemy.type].size, baseStats[enemy.type].size]" />
      <!-- HP -->
      <Suspense>
        <Text3D
          :position="[0, 0, baseStats[enemy.type].size * 0.80]"
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