import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useSkillStore, SkillsList } from '~/stores/SkillStore';

export const projectilesType = {
  player: {
    speed: PlayerBaseStats.projectiles.shotSpeed,
    damage: PlayerBaseStats.projectiles.damage,
    size: PlayerBaseStats.projectiles.size,
    range: PlayerBaseStats.projectiles.range,
    color: PlayerBaseStats.color,
  },
  ufo: {
    speed: 12,
    damage: 100,
    size: 0.25,
    range: 10,
    color: baseStats.ufo.color,
  },
  ufofast: {
    speed: 8,
    damage: 150,
    size: 0.3,
    range: 20,
    color: baseStats.ufofast.color,
  },
  boss: {
    speed: 8,
    damage: 200,
    size: 0.5,
    range: 20,
    color: baseStats.boss.color,
  },
  miniboss: {
    speed: 12,
    damage: 200,
    size: 0.5,
    range: 20,
    color: baseStats.miniboss.color,
  }
};

export const useProjectileStore = defineStore('projectileStore', () => {
  const enemyManager = useEnemyManager();
  const currentRunStore = useCurrentRunStore();
  const playerStats = usePlayerStats();
  const skillStore = useSkillStore(); // ✅ OTIMIZAÇÃO: Inicializa uma vez fora do loop

  // ✅ OTIMIZAÇÃO: shallowRef para arrays mutados diretamente
  const projectiles = shallowRef([]);

  function update(deltaTime) {
    // Atualiza a lógica dos projéteis
    checkCollisions();

    // ✅ OTIMIZAÇÃO: Filtra projéteis expirados ao invés de splice no loop
    const projectilesToKeep = [];

    projectiles.value.forEach((projectile) => {
      // Move o projétil na direção especificada
      let distance = projectile.speed * deltaTime;

      // If if player projectile, apply projectile speed multiplier
      if (projectile.ownerType === 'player') {
        distance *= playerStats.getProjectileSpeedMultiplier;
      }

      // ✅ MUTAÇÃO DIRETA: Sem overhead de reatividade
      projectile.position.x += projectile.direction.x * distance;
      projectile.position.z += projectile.direction.z * distance;
      projectile.distanceTraveled += distance;

      // Verifica se o projétil atingiu seu alcance máximo
      let projectileRange = projectile.range;

      if (projectile.ownerType === 'player') {
        projectileRange *= playerStats.getRangeMultiplier;
      }

      // Só mantém projéteis que não expiraram E não foram marcados para remoção
      if (projectile.distanceTraveled < projectileRange && !projectile._markedForRemoval) {
        projectilesToKeep.push(projectile);
      }
    });

    // ✅ Atualiza array uma única vez
    projectiles.value = projectilesToKeep;
  }
  
  function checkCollisions() {
    // ✅ OTIMIZAÇÃO: Marca projéteis para remoção ao invés de splice direto
    projectiles.value.forEach((projectile) => {
      if (projectile.ownerType === 'player') {
        // Verifica colisão com inimigos
        enemyManager.activeEnemies.value.forEach((enemy) => {
          if (
            isColliding(
              projectile.position,
              enemy.position,
              1 // threshold de colisão - AINDA chumbado porque o tamanho dos inimigos não está definido
            )
          ) {
            if (projectile.hitsList.includes(enemy.id)) {
              return; // Já atingiu esse inimigo antes
            }

            projectile.hitsList.push(enemy.id);

            // Aplica dano ao inimigo
            enemyManager.takeDamage(enemy.id, projectile.damage, 'shot');

            if (projectile.currentHits <= 1) {
              projectile._markedForRemoval = true; // ✅ Marca para remoção
            } else {
              projectile.currentHits -= 1;
            }

            // if ricochet skill, calculate new direction towards nearest enemy
            if (skillStore.hasSkill('ricochet_shot')) {
              const skillLevel = skillStore.getSkillLevel('ricochet_shot');
              // o range do ricochete é igual ao do projetil normal. Nível aumenta a quantidade de bounces depois.
              const nearestEnemy = nearestEnemyFromPlayer();

              if (! nearestEnemy) {
                return; // sem inimigos próximos, não faz ricochete
              }

              // se o inimigo mais próximo for o mesmo que foi atingido, não faz ricochete
              if (nearestEnemy.id === enemy.id) {
                return;
              }

              if (projectile.bounces <= 0) {
                return; // Não tem bounces restantes
              }

              const newBounces = projectile.bounces - 1;
              // Calcula o dano do projétil ricocheteado
              const newDamage = projectile.damage * SkillsList.ricochet_shot.levels[skillLevel].value;

              // Calcula a direção do projétil para o inimigo mais próximo
              const dirX = nearestEnemy.position.x - projectile.position.x;
              const dirZ = nearestEnemy.position.z - projectile.position.z;
              const length = Math.hypot(dirX, dirZ);

              // Cria um novo projétil na direção do inimigo mais próximo
              const newDirection = {
                x: dirX / length,
                z: dirZ / length,
              };
              
              spawnProjectile(
                projectile.type,
                { ...projectile.position },
                newDirection,
                projectile.ownerId,
                projectile.ownerType,
                projectile.originalHits, // mantém a contagem original de hits
                newBounces,
                newDamage,
                [...projectile.hitsList]
              )
            }
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

          if (projectile.currentHits <= 1) {
            projectile._markedForRemoval = true; // ✅ Marca para remoção
          } else {
            projectile.currentHits -= 1;
          }
        }
      }
    });
  }

  function isColliding(pos1, pos2, threshold) {
    return Math.hypot(pos1.x - pos2.x, pos1.z - pos2.z) < threshold;
  }

  function spawnProjectile(type, position, direction, ownerId, ownerType, hits = 1, bounces = 0, damage = 0, ignoreEnemies = []) {
    const config = projectilesType[type];

    if (! config) {
      console.warn(`Projectile type "${type}" not recognized.`);
      return;
    }

    // Play sound
    if (ownerType === 'player') {
      const randomPitch = 0.5 + Math.random() * 1; // Entre 0.5 e 1.0
      useAudio().playSound('shoot-player', 1, 1);
    } else {
      const enemySound = baseStats[ownerType]?.shotSound;

      if (enemySound) {
        useAudio().playSound(enemySound);
      }
    }

    // ✅ OTIMIZAÇÃO: Não mutamos o config compartilhado, aplicamos damage diretamente
    projectiles.value.push({
      id: `projectile-${Date.now()}_${Math.random()}`,
      type: type,
      ownerId: ownerId,
      ownerType: ownerType,
      position: { ...position },
      direction: { ...direction },
      distanceTraveled: 0,
      originalHits: hits,
      currentHits: hits,
      hitsList: ignoreEnemies,
      bounces: bounces,
      ...config, // speed, size, range, color (mas não damage)
      damage: damage || config.damage, // ✅ Sobrescreve damage sem mutar config
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
      // if enemy is spawning, ignore
      if (enemy.state === 'spawning') return;

      const dist = Math.hypot(
        enemy.position.x - playerPos.x,
        enemy.position.z - playerPos.z
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestEnemy = enemy;
      }
    });

    // Se o inimigo mais próximo estiver longe do range do tiro, retorna null
    // NOTA: Essa mecanica pode ser removida.
    if (minDistance > (projectilesType.player.range * playerStats.getRangeMultiplier)) {
      return null;
    }

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