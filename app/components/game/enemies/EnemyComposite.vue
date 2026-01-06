<script setup lang="js">
import { ref } from 'vue';
import { useLoop } from '@tresjs/core';

/**
 * EnemyComposite - Exemplo de inimigo composto (múltiplas partes)
 *
 * Este componente demonstra como criar um inimigo com múltiplas
 * partes visuais (corpo + acessórios).
 *
 * IMPORTANTE: Use TresGroup e apenas o corpo principal deve ter a ref
 * para o visual mesh (para colisões). As outras partes são apenas decorativas.
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

const orbitRef = ref(null);
let orbitAngle = 0;

// Animação: satélites orbitando o corpo principal
const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  if (orbitRef.value && props.enemy.state === 'active') {
    orbitAngle += delta * 2; // Velocidade de órbita
    orbitRef.value.rotation.y = orbitAngle;
  }
});
</script>

<template>
  <TresGroup>
    <!-- Corpo principal (este recebe a ref para colisões) -->
    <TresMesh
      :ref="setVisualMeshRef(enemy.id)"
      :name="`enemy-visual-${enemy.id}`"
    >
      <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
      <TresIcosahedronGeometry
        :args="[baseStats[enemy.type].size * 0.6]"
      />
    </TresMesh>

    <!-- Satélites orbitando (decorativo) -->
    <TresGroup ref="orbitRef">
      <!-- Satélite 1 -->
      <TresMesh :position="[baseStats[enemy.type].size * 1.2, 0, 0]">
        <TresMeshStandardMaterial
          :color="baseStats[enemy.type].color"
          :emissive="baseStats[enemy.type].color"
          :emissiveIntensity="0.5"
        />
        <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.15, 8, 8]" />
      </TresMesh>

      <!-- Satélite 2 -->
      <TresMesh :position="[-baseStats[enemy.type].size * 1.2, 0, 0]">
        <TresMeshStandardMaterial
          :color="baseStats[enemy.type].color"
          :emissive="baseStats[enemy.type].color"
          :emissiveIntensity="0.5"
        />
        <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.15, 8, 8]" />
      </TresMesh>

      <!-- Satélite 3 -->
      <TresMesh :position="[0, 0, baseStats[enemy.type].size * 1.2]">
        <TresMeshStandardMaterial
          :color="baseStats[enemy.type].color"
          :emissive="baseStats[enemy.type].color"
          :emissiveIntensity="0.5"
        />
        <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.15, 8, 8]" />
      </TresMesh>

      <!-- Satélite 4 -->
      <TresMesh :position="[0, 0, -baseStats[enemy.type].size * 1.2]">
        <TresMeshStandardMaterial
          :color="baseStats[enemy.type].color"
          :emissive="baseStats[enemy.type].color"
          :emissiveIntensity="0.5"
        />
        <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.15, 8, 8]" />
      </TresMesh>
    </TresGroup>

    <!-- Aura/Glow (opcional) -->
    <TresMesh>
      <TresMeshBasicMaterial
        :color="baseStats[enemy.type].color"
        :transparent="true"
        :opacity="0.2"
      />
      <TresIcosahedronGeometry
        :args="[baseStats[enemy.type].size * 0.7]"
      />
    </TresMesh>
  </TresGroup>
</template>
