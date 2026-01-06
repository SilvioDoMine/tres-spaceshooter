<script setup lang="js">
import { ref } from 'vue';
import { useLoop } from '@tresjs/core';

/**
 * EnemyTorus - Exemplo de inimigo com animação customizada
 *
 * Este componente demonstra como adicionar animações específicas
 * para um tipo de inimigo.
 */

const props = defineProps({
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

const meshRef = ref(null);

// Animação customizada: rotação contínua em múltiplos eixos
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (meshRef.value && props.enemy.state === 'active') {
    // Rotação contínua para dar um efeito de "spinning disk"
    meshRef.value.rotation.x += 0.02;
    meshRef.value.rotation.y += 0.01;
  }
});
</script>

<template>
  <TresMesh
    ref="meshRef"
    :ref="setVisualMeshRef(enemy.id)"
    :name="`enemy-visual-${enemy.id}`"
  >
    <TresMeshStandardMaterial
      :color="baseStats[enemy.type].color"
      :metalness="0.7"
      :roughness="0.3"
    />
    <TresTorusGeometry
      :args="[baseStats[enemy.type].size * 0.5, baseStats[enemy.type].size * 0.2, 16, 32]"
    />
  </TresMesh>
</template>
