<script setup lang="js">
import { computed } from 'vue';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';

const currentRun = useCurrentRunStore();
const enemyManager = useEnemyManager();

const activeEnemies = enemyManager.activeEnemies;

// Calcula propriedades visuais baseado no estado do inimigo
const getEnemyVisuals = (enemy) => {
  if (enemy.state === 'spawning') {
    // Durante spawn: escala e opacidade crescem de 0 a 1
    const scale = enemy.spawnProgress; // 0 a 1
    const opacity = enemy.spawnProgress * 0.3; // 0 a 0.5 (semi-transparente)

    return {
      scale,
      opacity,
      transparent: true,
    };
  }

  // Inimigos ativos: escala e opacidade normais
  return {
    scale: 1,
    opacity: 1,
    transparent: false,
  };
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
      :scale="getEnemyVisuals(enemy).scale"
    >
      <TresMeshStandardMaterial
        :color="baseStats[enemy.type].color"
        :opacity="getEnemyVisuals(enemy).opacity"
        :transparent="getEnemyVisuals(enemy).transparent"
      />
      <TresBoxGeometry :args="[baseStats[enemy.type].size, baseStats[enemy.type].size, baseStats[enemy.type].size]" />
      <!-- HP (só mostra quando ativo) -->
      <Suspense v-if="enemy.state === 'active'">
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