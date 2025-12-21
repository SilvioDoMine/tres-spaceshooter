<script setup lang="js">
import { storeToRefs } from 'pinia';
import { useLoop } from '@tresjs/core';
import { useProjectileStore, projectilesType } from '~/stores/projectileStore';

const projectileStore = useProjectileStore();
// ✅ Usa storeToRefs para garantir reatividade correta com shallowRef
const { projectiles: activeProjectiles } = storeToRefs(projectileStore);

// Map para armazenar refs dos meshes de cada projétil
// Chave: projectile.id, Valor: mesh ref
const projectileRefs = new Map();

// Função para setar ref do mesh
const setProjectileMeshRef = (projectileId) => (el) => {
  if (el) {
    projectileRefs.set(projectileId, el);
  }
};

// ==================== GAME LOOP (60 FPS) ====================
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  // ✅ Verificação defensiva: garante que activeProjectiles.value existe
  if (!activeProjectiles.value) return;

  activeProjectiles.value.forEach(projectile => {
    const mesh = projectileRefs.get(projectile.id);
    if (!mesh) return;

    // ✅ MUTAÇÃO DIRETA: Atualiza posição sem disparar reatividade
    mesh.position.set(projectile.position.x, 1, projectile.position.z);
  });

  // Limpa refs de projéteis removidos
  const activeIds = new Set(activeProjectiles.value.map(p => p.id));
  for (const [id] of projectileRefs) {
    if (!activeIds.has(id)) {
      projectileRefs.delete(id);
    }
  }
});

onUnmounted(() => {
  projectileStore.cleanup();
  projectileRefs.clear();
});
</script>

<template>
  <TresGroup>
    <TresMesh
      v-for="projectile in activeProjectiles"
      :key="projectile.id"
      :ref="setProjectileMeshRef(projectile.id)"
      :name="`projectile-${projectile.id}`"
    >
      <TresMeshStandardMaterial :color="projectilesType[projectile.type].color" />
      <TresBoxGeometry :args="[
        projectilesType[projectile.type].size,
        projectilesType[projectile.type].size,
        projectilesType[projectile.type].size,
      ]" />
    </TresMesh>
  </TresGroup>
</template>
