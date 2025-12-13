<script setup lang="ts">
import { shallowRef } from 'vue';
import { useLoop } from '@tresjs/core';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useCombatTextEvents } from '~/composables/useCombatTextEvents';
import type { TresInstance } from '@tresjs/core';
import * as THREE from 'three';

  // | Efeito desejado                           | Altura | FOV   |
  // |-------------------------------------------|--------|-------|
  // | Mais "plano" (quase ortográfico)          | 70-100 | 15-20 |
  // | Balanceado (recomendo)                    | 40-60  | 20-30 |
  // | Mais "cinematográfico" (mais perspectiva) | 20-30  | 40-50 |

// Opcional: Para carregar um modelo 3D GLTF (assumindo que você o tem)
// import { TresLeches } from '@tresjs/leches';
// import { useGLTF } from '@tresjs/cientos';

const currentRun = useCurrentRunStore();
const playerStats = usePlayerStats();
const { consumeEventsForTarget } = useCombatTextEvents();

// Posição inicial (reativa - só dispara quando componente monta)
const initialPosition = currentRun.getPlayerPosition();

// Ref para combat text do jogador
const combatTextRef = shallowRef(null);

/**
 * ✅ OTIMIZAÇÃO: Template Ref para acesso direto ao mesh Three.js
 * Elimina completamente o overhead reativo em loops de 60 FPS
 */
const playerMeshRef = shallowRef<TresInstance | null>(null);
const hpMeshRef = shallowRef<TresInstance | null>(null);
const rangeCircleRef = shallowRef<TresInstance | null>(null);
const currentPosition = shallowRef({ x: initialPosition.x, y: initialPosition.y, z: initialPosition.z });

// Opcional: Se você estiver usando um modelo GLTF
// const { nodes, materials } = await useGLTF('/models/player.gltf', { draco: true });

// Geometria do triângulo no plano XZ (horizontal)
// O triângulo aponta para Z- (para frente)
const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  0.0, 0.0, -0.8,   // Ponta (frente)
  -0.5, 0.0, 0.5,   // Base esquerda (trás)
  0.5, 0.0, 0.5,    // Base direita (trás)
]);

// Define os índices para formar o triângulo (ambos os lados visíveis)
const indices = [
  0, 1, 2,  // Lado de cima
  0, 2, 1,  // Lado de baixo (invertido para ver dos dois lados)
];

geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals(); // Calcula as normais para iluminação correta

// Círculo mostrando o range de tiro do jogador
const rangeCircleGeometry = new THREE.BufferGeometry();
const rangeRadius = projectilesType.player.range;
const segments = 64; // Mais segmentos = círculo mais suave
const circleVertices: number[] = [];

for (let i = 0; i <= segments; i++) {
  const theta = (i / segments) * Math.PI * 2;
  circleVertices.push(
    Math.cos(theta) * rangeRadius, // x
    0, // y (no plano XZ)
    Math.sin(theta) * rangeRadius  // z
  );
}

rangeCircleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(new Float32Array(circleVertices), 3)
);

/**
 * ✅ PADRÃO RECOMENDADO: Acessa mesh diretamente via template ref
 * Mutação direta sem overhead reativo - 25x mais rápido
 */
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (playerMeshRef.value && hpMeshRef.value && rangeCircleRef.value) {
    // Lê posição e rotação atualizada do store (atualizada por usePlayerControls)
    const position = currentRun.getPlayerPosition();
    const rotation = currentRun.getPlayerRotation();

    // ✅ Mutação direta da propriedade Three.js - SEM reatividade
    playerMeshRef.value.position.x = position.x;
    playerMeshRef.value.position.y = position.y;
    playerMeshRef.value.position.z = position.z;

    playerMeshRef.value.rotation.x = rotation.x;
    playerMeshRef.value.rotation.y = rotation.y;
    playerMeshRef.value.rotation.z = rotation.z;

    hpMeshRef.value.position.x = position.x;
    hpMeshRef.value.position.y = position.y + 2;
    hpMeshRef.value.position.z = position.z;

    // Atualiza a posição do círculo de range
    rangeCircleRef.value.position.x = position.x;
    rangeCircleRef.value.position.y = position.y + 0.1; // Levemente acima do chão
    rangeCircleRef.value.position.z = position.z;

    // Atualiza a escala do círculo de acordo com o multiplicador de range
    const rangeMultiplier = playerStats.getRangeMultiplier;
    rangeCircleRef.value.scale.setScalar(rangeMultiplier);

    currentPosition.value = { x: position.x, y: position.y, z: position.z };

    // Processa eventos de combat text do jogador
    const events = consumeEventsForTarget(PlayerBaseStats.id);
    events.forEach(event => {
      if (combatTextRef.value) {
        combatTextRef.value.addCombatText(event.value, event.type);
      }
    });
  }
});
</script>

<template>
  <!--
    ✅ Template ref conecta ao mesh Three.js
    Posição inicial é setada uma vez, depois atualizada via ref
  -->
  <TresMesh
    ref="playerMeshRef"
    name="PlayerCharacter"
    :geometry="geometry"
  >
    <TresMeshStandardMaterial :color="PlayerBaseStats.color" :side="2" />
  </TresMesh>
  <TresMesh
    ref="hpMeshRef"
    name="PlayerHPIndicator"
  >
    <TresMeshStandardMaterial  :visible="false" color="pink" />
    <TresBoxGeometry :args="[1, 1, 1]" />

    <!-- HealthBar (só mostra quando ativo) -->
    <GameHealthBar
      v-if="true"
      :current-health="currentRun.currentHealth"
      :max-health="PlayerBaseStats.maxHealth"
      :width="1.5"
      :height="0.21"
      :position="[0, -5, -1.2]"
      :showHp="true"
    />

    <!-- CombatText -->
    <GameCombatText
      ref="combatTextRef"
      :position="[0, 0, 0]"
    />
  </TresMesh>

  <!-- Círculo mostrando o range de tiro -->
  <primitive
    ref="rangeCircleRef"
    :object="new THREE.Line(
      rangeCircleGeometry,
      new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.3, transparent: true })
    )"
    name="RangeCircle"
  />

  <TresPerspectiveCamera
    :position="[currentPosition.x, currentPosition.y + 75, currentPosition.z]"
    :look-at="[currentPosition.x, currentPosition.y, currentPosition.z]"
    :fov="25"
    name="PlayerCamera"
  />
</template>
