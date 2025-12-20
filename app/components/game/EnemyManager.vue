<script setup lang="js">
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';

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
      rotation: 0,
    };
  }

  if (enemy.state === 'dying') {
    // Durante morte: fade out + encolhimento + rotação
    const progress = enemy.deathProgress; // 0 a 1
    const scale = 1 - progress; // 1 a 0 (encolhe)
    const opacity = 1 - progress; // 1 a 0 (fade out)
    const rotation = progress * Math.PI * 2; // 0 a 2π (rotação completa)

    return {
      scale,
      opacity,
      transparent: true,
      rotation,
    };
  }

  // Inimigos ativos: escala e opacidade normais
  return {
    scale: 1,
    opacity: 1,
    transparent: false,
    rotation: 0,
  };
};

onUnmounted(() => {
  enemyManager.cleanup();
});
</script>

<template>
  <TresGroup>
    <TresGroup
      v-for="(enemy, index) in activeEnemies"
      :key="index"
    >
      <!-- Geometria visual do inimigo (ROTACIONA) -->
      <TresMesh
        :name="`enemy-visual-${index}`"
        :position="[enemy.position.x, enemy.position.y, enemy.position.z]"
        :scale="getEnemyVisuals(enemy).scale"
        :rotation="[0, getEnemyVisuals(enemy).rotation, 0]"
      >
        <TresMeshStandardMaterial
          :color="baseStats[enemy.type].color"
          :opacity="getEnemyVisuals(enemy).opacity"
          :transparent="getEnemyVisuals(enemy).transparent"
        />

        <TresBoxGeometry
          :args="[baseStats[enemy.type].size, baseStats[enemy.type].size, baseStats[enemy.type].size]"
        />
      </TresMesh>

      <!-- UI elements (NÃO ROTACIONAM) -->
      <TresGroup
        :name="`enemy-ui-${index}`"
        :position="[enemy.position.x, enemy.position.y, enemy.position.z]"
      >
        <!-- HealthBar (só mostra quando ativo) -->
        <GameHealthBar
          v-if="enemy.state === 'active'"
          :current-health="enemy.health"
          :max-health="baseStats[enemy.type].health"
          :width="baseStats[enemy.type].size * 0.9"
          :height="0.2"
          :position="[0, 0, -baseStats[enemy.type].size * 0.7]"
          color="red"
          :hiddenFull="true"
        />

        <!-- Combat Text -->
        <GameCombatText
          :position="[0, 0, -baseStats[enemy.type].size]"
          :entity-id="enemy.id"
        />
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>