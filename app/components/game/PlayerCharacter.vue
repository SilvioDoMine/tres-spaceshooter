<script setup lang="ts">
import { shallowRef } from 'vue';
import { useLoop } from '@tresjs/core';
import { useCurrentRunStore } from '~/stores/currentRunStore';
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

// Posição inicial (reativa - só dispara quando componente monta)
const initialPosition = currentRun.getPlayerPosition();

/**
 * ✅ OTIMIZAÇÃO: Template Ref para acesso direto ao mesh Three.js
 * Elimina completamente o overhead reativo em loops de 60 FPS
 */
const playerMeshRef = shallowRef<TresInstance | null>(null);
const hpMeshRef = shallowRef<TresInstance | null>(null);
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

/**
 * ✅ PADRÃO RECOMENDADO: Acessa mesh diretamente via template ref
 * Mutação direta sem overhead reativo - 25x mais rápido
 */
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (playerMeshRef.value && hpMeshRef.value) {
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

    currentPosition.value = { x: position.x, y: position.y, z: position.z };
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
    <TresMeshStandardMaterial color="red" :side="2" />
  </TresMesh>
  <TresMesh
    ref="hpMeshRef"
    name="PlayerHPIndicator"
  >
    <TresMeshStandardMaterial  :visible="false" color="pink" />
    <TresBoxGeometry :args="[1, 1, 1]" />
    <!-- HP -->
    <Suspense>
      <Text3D
        :position="[0, 0, 1]"
        :rotation="[ -Math.PI / 2, 0, 0 ]"
        :scale="[0.5, 0.5, 0.5]"
        :text="`HP: ${currentRun.currentHealth}`"
        font="/fonts/PoppinsBold.json"
        need-updates
        center
      >
        <TresMeshNormalMaterial />
      </Text3D>
    </Suspense>
  </TresMesh>

  <TresPerspectiveCamera
    :position="[currentPosition.x, currentPosition.y + 75, currentPosition.z]"
    :look-at="[currentPosition.x, currentPosition.y, currentPosition.z]"
    :fov="25"
    name="PlayerCamera"
  />
</template>
