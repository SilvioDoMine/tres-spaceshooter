<script setup lang="js">
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
  },
  opacity: {
    type: Number,
    default: 1
  }
});
</script>

<template>
  <TresMesh
    :ref="setVisualMeshRef(enemy.id)"
    :name="`enemy-visual-${enemy.id}`"
  >
    :name="`enemy-visual-${enemy.id}`"
  >
    <TresMeshStandardMaterial 
      :color="baseStats[enemy.type].color"
      :transparent="opacity < 1"
      :opacity="opacity"
    />
    <TresDodecahedronGeometry
      :args="[baseStats[enemy.type].size * 0.6]"
    />
  </TresMesh>
</template>
