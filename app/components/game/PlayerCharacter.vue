<script setup lang="ts">
import { shallowRef } from 'vue';
import { useLoop } from '@tresjs/core';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import type { TresInstance } from '@tresjs/core';
import * as THREE from 'three';
import { CameraUtils } from '~/utils/CameraUtils';

// Interface para o Stage
interface Stage {
  width: number;
  height: number;
  [key: string]: any;
}

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

// Posição inicial (reativa - só dispara quando componente monta)
const initialPosition = currentRun.getPlayerPosition();

/**
 * ✅ OTIMIZAÇÃO: Template Ref para acesso direto ao mesh Three.js
 * Elimina completamente o overhead reativo em loops de 60 FPS
 */
const playerMeshRef = shallowRef<TresInstance | null>(null);
const hpMeshRef = shallowRef<TresInstance | null>(null);
const rangeCircleRef = shallowRef<TresInstance | null>(null);
const currentPosition = shallowRef({ x: initialPosition.x, y: initialPosition.y, z: initialPosition.z });

// ==================== CONFIGURAÇÃO DA CÂMERA ====================
const CAMERA_HEIGHT = 75;
const CAMERA_FOV = 25;
const ASPECT_RATIO = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;

// Posição calculada da câmera (atualizada a cada frame)
const cameraPosition = shallowRef({ x: initialPosition.x, y: CAMERA_HEIGHT, z: initialPosition.z });

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

// ==================== GAME LOOP (60 FPS) ====================
/**
 * Loop principal de atualização do jogador
 * ✅ Otimizado: Mutação direta sem overhead reativo
 */
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (!playerMeshRef.value || !hpMeshRef.value || !rangeCircleRef.value) return;

  const position = currentRun.getPlayerPosition();
  const rotation = currentRun.getPlayerRotation();

  // Atualiza posição e rotação do jogador
  playerMeshRef.value.position.set(position.x, position.y, position.z);
  playerMeshRef.value.rotation.set(rotation.x, rotation.y, rotation.z);

  // Atualiza barra de HP
  hpMeshRef.value.position.set(position.x, position.y + 2, position.z);

  // Atualiza círculo de range
  rangeCircleRef.value.position.set(position.x, position.y + 0.1, position.z);
  rangeCircleRef.value.scale.setScalar(playerStats.getRangeMultiplier);

  currentPosition.value = { x: position.x, y: position.y, z: position.z };

  // Calcula posição da câmera com limites do stage
  const stage = currentRun.currentStage as Stage | null;
  if (stage?.width && stage?.height) {
    const mapBounds = CameraUtils.stageToMapBounds(stage.width, stage.height);
    cameraPosition.value = CameraUtils.calculateCameraPosition(
      { x: position.x, z: position.z },
      mapBounds,
      CAMERA_HEIGHT,
      CAMERA_FOV,
      ASPECT_RATIO
    );
  } else {
    // Fallback: segue o jogador diretamente
    cameraPosition.value = { x: position.x, y: CAMERA_HEIGHT, z: position.z };
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

    <!-- Combat text -->
    <GameCombatText
      :position="[0, -5, -1.75]"
      :entity-id="PlayerBaseStats.id"
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
    :position="[cameraPosition.x, cameraPosition.y, cameraPosition.z]"
    :look-at="[cameraPosition.x, 0, cameraPosition.z]"
    :fov="CAMERA_FOV"
    name="PlayerCamera"
  />
</template>
