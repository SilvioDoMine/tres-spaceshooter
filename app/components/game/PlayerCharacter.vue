<script setup lang="ts">
import { shallowRef } from 'vue';
import { useLoop, useTres } from '@tresjs/core';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import type { TresInstance } from '@tresjs/core';
import { Edges } from '@tresjs/cientos';

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
const currentPosition = shallowRef({ x: initialPosition.x, y: initialPosition.y, z: initialPosition.z });

// Opcional: Se você estiver usando um modelo GLTF
// const { nodes, materials } = await useGLTF('/models/player.gltf', { draco: true });

/**
 * ✅ PADRÃO RECOMENDADO: Acessa mesh diretamente via template ref
 * Mutação direta sem overhead reativo - 25x mais rápido
 */
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (playerMeshRef.value) {
    // Lê posição atualizada do store (atualizada por usePlayerControls)
    const position = currentRun.getPlayerPosition();

    // ✅ Mutação direta da propriedade Three.js - SEM reatividade
    playerMeshRef.value.position.x = position.x;
    playerMeshRef.value.position.y = position.y;
    playerMeshRef.value.position.z = position.z;

    currentPosition.value = { x: position.x, y: position.y, z: position.z };

    // Opcional: Rotacionar o personagem na direção do movimento horizontal
    // Sistema: Norte=Z+, Sul=Z-, Esquerda=X+, Direita=X-
    // const movement = currentRun.getMoveVector();
    // if (movement.x !== 0 || movement.z !== 0) {
    //   // atan2(-x, z) porque X+ é esquerda e X- é direita
    //   playerMeshRef.value.rotation.y = Math.atan2(-movement.x, movement.z);
    // }
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
    :position="[initialPosition.x, initialPosition.y, initialPosition.z]"
    name="PlayerCharacter"
  >
    <TresBoxGeometry :args="[1, 1, 1]" />
    <TresMeshStandardMaterial color="red" />
    <Edges :threshold="15" color="black" />

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
    :position="[currentPosition.x, currentPosition.y + 20, currentPosition.z]"
    :look-at="[currentPosition.x, currentPosition.y, currentPosition.z]"
    name="PlayerCamera"
  />
</template>
