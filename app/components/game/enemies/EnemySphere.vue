<script setup lang="js">
/**
 * EnemySphere - Exemplo de novo tipo de inimigo
 *
 * Este é um exemplo de como criar um novo tipo de inimigo.
 * Para usá-lo:
 * 1. Importe no EnemyManager.vue
 * 2. Adicione ao mapeamento enemyComponents com o nome 'sphere'
 * 3. Crie um novo tipo em baseStats com shape: 'sphere'
 */

defineProps({
  enemy: {
    type: Object,
    required: true
  },
  baseStats: {
    type: Object,
    required: true
  },
  setVisualMeshRef: {
    type: Function,
    required: true
  }
});
</script>

<template>
  <TresMesh
    :ref="setVisualMeshRef(enemy.id)"
    :name="`enemy-visual-${enemy.id}`"
  >
    <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
    <TresSphereGeometry
      :args="[baseStats[enemy.type].size * 0.5, 32, 32]"
    />
  </TresMesh>
</template>
