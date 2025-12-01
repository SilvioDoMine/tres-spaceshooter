import { defineStore } from 'pinia';
import { distance } from 'three/tsl';
import { ref, shallowRef } from 'vue';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { useCurrentRunStore } from '~/stores/currentRunStore';

export const projectilesType = {
  player: {
    speed: 15,
    damage: 50,
    size: 0.2,
    range: 7,
    color: 'blue',
  },
  ufo: {
    speed: 12,
    damage: 100,
    size: 0.25,
    range: 10,
    color: 'green',
  }
};

export const useProjectileStore = defineStore('projectileStore', () => {
  const enemyManager = useEnemyManager();
  const currentRunStore = useCurrentRunStore();

  const projectiles = ref([]);

  function update(deltaTime) {
    // Atualiza a lógica dos projéteis
    checkCollisions();

    projectiles.value.forEach((projectile, index) => {
      // Move o projétil na direção especificada
      const distance = projectile.speed * deltaTime;
      projectile.position.x += projectile.direction.x * distance;
      projectile.position.z += projectile.direction.z * distance;
      projectile.distanceTraveled += distance;

      // Verifica se o projétil atingiu seu alcance máximo
      if (projectile.distanceTraveled >= projectile.range) {
        projectiles.value.splice(index, 1); // Remove o projétil
        return;
      }
    });
  }
  
  function checkCollisions() {
    projectiles.value.forEach((projectile, pIndex) => {
      if (projectile.ownerType === 'player') {
        // Verifica colisão com inimigos
        enemyManager.activeEnemies.value.forEach((enemy, eIndex) => {
          if (
            isColliding(
              projectile.position,
              enemy.position,
              1 // threshold de colisão - AINDA chumbado porque o tamanho dos inimigos não está definido
            )
          ) {
            enemyManager.takeDamage(enemy.id, projectile.damage);
            projectiles.value.splice(pIndex, 1); // Remove o projétil
          }
        });
      } else if (projectile.ownerType === 'enemy') {
        // Verifica colisão com o jogador
        if (
          isColliding(
            projectile.position,
            currentRunStore.getPlayerPosition(),
            1 // threshold de colisão - AINDA chumbado porque o tamanho do jogador não está definido
          )
        ) {
          currentRunStore.takeDamage(projectile.damage);
          projectiles.value.splice(pIndex, 1); // Remove o projétil
        }
      }
    });
  }

  function isColliding(pos1, pos2, threshold) {
    return Math.hypot(pos1.x - pos2.x, pos1.z - pos2.z) < threshold;
  }

  function spawnProjectile(type, position, direction, ownerId, ownerType) {
    const config = projectilesType[type];

    if (! config) {
      console.warn(`Projectile type "${type}" not recognized.`);
      return;
    }

    projectiles.value.push({
      id: `projectile-${Date.now()}_${Math.random()}`,
      type: type,
      ownerId: ownerId,
      ownerType: ownerType,
      position: { ...position },
      direction: { ...direction },
      distanceTraveled: 0,
      ...config, // speed, damage, size, range, color
    });
  }

  function cleanup() {
    projectiles.value = [];
  }

  function nearestEnemyFromPlayer() {
    const playerPos = currentRunStore.getPlayerPosition();
    let nearestEnemy = null;
    let minDistance = Infinity;

    enemyManager.activeEnemies.value.forEach(enemy => {
      const dist = Math.hypot(
        enemy.position.x - playerPos.x,
        enemy.position.z - playerPos.z
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestEnemy = enemy;
      }
    });

    return nearestEnemy;
  }

  return {
    update,
    cleanup,

    spawnProjectile,
    checkCollisions,
    projectiles,

    nearestEnemyFromPlayer,
  };
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProjectileStore, import.meta.hot))
}