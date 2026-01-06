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
    <TresMeshStandardMaterial 
      :color="baseStats[enemy.type].color"
      :transparent="opacity < 1"
      :opacity="opacity"
    />
    <TresConeGeometry
      :args="[baseStats[enemy.type].size * 0.5, baseStats[enemy.type].size, 16]"
      :rotateX="Math.PI / 2"
    />
  </TresMesh>
</template>
