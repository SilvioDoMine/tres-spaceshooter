<script setup lang="js">
import { useProjectileStore, projectilesType } from '~/stores/projectileStore';

const projectileStore = useProjectileStore();
const activeProjectiles = projectileStore.projectiles;

onUnmounted(() => {
  projectileStore.cleanup();
});
</script>

<template>
  <TresGroup>
    <TresMesh
      v-for="(projectile, index) in activeProjectiles"
      :key="index"
      :name="`projectile-${index}`"
      :position="[projectile.position.x, 1, projectile.position.z]"
    >
      <TresMeshStandardMaterial :color="projectilesType[projectile.type].color" />
      <TresBoxGeometry :args="[
        projectilesType[projectile.type].size, // x
        projectilesType[projectile.type].size, // y
        projectilesType[projectile.type].size, // z
      ]" />
    </TresMesh>
  </TresGroup>
</template>