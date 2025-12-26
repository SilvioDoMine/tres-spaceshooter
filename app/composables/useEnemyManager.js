import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { storeToRefs } from 'pinia';

export const baseStats = {
  asteroid: {
    color: 'gray',
    shape: 'dodecahedron',
    speed: 3,
    health: 65,
    onHitDamage: 100,
    size: 1.25,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: {min: 60, max: 100},
      gold: {min: 0, max: 10}
    }
  },
  ufo: {
    color: 'green',
    shape: 'square',
    size: 1,
    speed: 2,
    health: 120,
    onHitDamage: 150,
    distanceKeep: 10,
    shotDamage: 50,
    cooldownTotalShot: 2,
    shotSound: 'shoot7',
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: {min: 100, max: 250},
      gold: {min: 5, max: 15}
    }
  },
  ufofast: {
    color: 'hotpink',
    shape: 'square',
    size: 1,
    speed: 2.2,
    health: 180,
    onHitDamage: 500,
    distanceKeep: 20,
    shotDamage: 100,
    cooldownTotalShot: 1.75,
    shotSound: 'shoot2',
    deathSound: 'hit-hard2',
    hitSound: 'hit-soft2',
    drops: {
      exp: {min: 200, max: 350},
      gold: {min: 10, max: 25}
    }
  },
  kamikaze: {
    color: 'red',
    shape: 'cone',
    size: 1,
    speed: 3.5,
    health: 80,
    onHitDamage: 300,
    distanceKeep: 7,
    chargeRecoveryCooldown: 3, // Cooldown após charge (segundos)
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft3',
    drops: {
      exp: {min: 150, max: 300},
      gold: {min: 10, max: 20}
    }
  },
  miniboss: {
    color: 'green',
    shape: 'square',
    size: 3,
    speed: 1.1,
    health: 600,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 200,
    cooldownTotalShot: 2,
    shotSound: 'shoot7',
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: {min: 400, max: 600},
      gold: {min: 100, max: 200}
    }
  },
  boss: {
    color: 'hotpink',
    shape: 'square',
    size: 3,
    speed: 1.1,
    health: 1200,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 300,
    cooldownTotalShot: 1,
    shotSound: 'shoot2',
    deathSound: 'enemy-death2',
    hitSound: 'hit-soft3',
    drops: {
      exp: {min: 0, max: 0},
      gold: {min: 100, max: 200}
    }
  },
  kamikazeBoss: {
    color: 'red',
    shape: 'cone',
    size: 2,
    speed: 3,
    health: 800,
    onHitDamage: 9999,
    distanceKeep: 10,
    chargeRecoveryCooldown: 1, // Sem cooldown após charge
    deathSound: 'enemy-death3',
    hitSound: 'hit-soft3',
    drops: {
      exp: {min: 500, max: 800},
      gold: {min: 150, max: 300}
    }
  }
};

// Lógica para gerenciar inimigos: spawn, atualização, remoção, etc.
export function useEnemyManager() {
  const enemyManagerStore = useEnemyManagerStore();
  const useCurrentRun = useCurrentRunStore();

  const { activeEnemies } = storeToRefs(enemyManagerStore);
  
  const update = (delta) => {
    // Atualiza o timer de spawn e morte dos inimigos
    activeEnemies.value.forEach(enemy => {
      if (enemy.state === 'spawning') {
        enemy.spawnTimer -= delta;

        // Calcula o progresso do spawn (0 a 1)
        enemy.spawnProgress = 1 - (enemy.spawnTimer / enemy.totalSpawnTime);
        enemy.spawnProgress = Math.max(0, Math.min(1, enemy.spawnProgress)); // Clamp entre 0 e 1

        // Quando o timer acabar, muda para ativo
        if (enemy.spawnTimer <= 0) {
          enemy.state = 'active';
          enemy.spawnTimer = 0;
          enemy.spawnProgress = 1;
        }
      }

      if (enemy.state === 'dying') {
        enemy.deathTimer -= delta;

        // Calcula o progresso da morte (0 a 1)
        enemy.deathProgress = 1 - (enemy.deathTimer / enemy.totalDeathTime);
        enemy.deathProgress = Math.max(0, Math.min(1, enemy.deathProgress)); // Clamp entre 0 e 1
      }
    });

    // Remove inimigos que terminaram a animação de morte
    activeEnemies.value = activeEnemies.value.filter(enemy =>
      !(enemy.state === 'dying' && enemy.deathTimer <= 0)
    );
  };

  const spawnEnemyWave = (waveConfig) => {
    // Spawna inimigos conforme a configuração da wave
    waveConfig.enemies.forEach(enemyGroup => {
      // Desestruturação para obter tipo, quantidade e delay
      const { enemyType, count, delay = 1.5 } = enemyGroup;

      // Spawna a quantidade especificada de inimigos do tipo dado
      for (let i = 0; i < count; i++) {

        // Pego os stats base do inimigo
        const enemyStats = baseStats[enemyType];

        if (! enemyStats) {
          console.warn(`Enemy Manager: Unknown enemy type "${enemyType}"`);
          return;
        }

        // Crio um novo inimigo com posição aleatória
        const newEnemy = {
          id: `${enemyType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
          type: enemyType,
          position: generateRandomSpawnPosition(),
          cooldownShot: enemyStats.cooldownTotalShot, // tempo inicial para o inimigo poder atirar
          state: 'spawning', // Estado inicial: spawning (invulnerável)
          spawnTimer: delay, // Tempo em segundos até ficar ativo (vem da configuração da wave)
          totalSpawnTime: delay, // Armazena o tempo total para calcular o progresso
          spawnProgress: 0, // 0 a 1, usado para efeitos visuais
          ...enemyStats,
        };

        // Adiciono o inimigo à lista de inimigos ativos
        activeEnemies.value.push(newEnemy);
      }
    });
  }

  /**
   * Quando um inimigo toma dano
   */
  function takeDamage(enemyId, damage, type) {
    // Lógica para aplicar dano ao inimigo
    const enemy = activeEnemies.value.find(e => e.id === enemyId);

    if (! enemy) {
      console.warn(`Enemy Manager: No enemy found with ID "${enemyId}" to take damage.`);
      return;
    }

    // Inimigos em spawning ou morrendo são invulneráveis
    if (enemy.state === 'spawning' || enemy.state === 'dying') {
      return;
    }

    enemy.health -= damage;

    // combat text
    useCombatTextStore().emitForTarget(
      enemyId,
      'damage',
      damage
    );

    // Se a saúde do inimigo chegar a zero ou menos, inicia animação de morte
    const randomPitch = 0.9 + Math.random() * 0.2; // Entre 0.9 e 1.1

    if (enemy.health <= 0) {
      enemy.state = 'dying';
      enemy.deathTimer = 0.8; // Duração da animação de morte (segundos)
      enemy.totalDeathTime = 0.8;
      enemy.deathProgress = 0;

      if (type === 'shot') {
        // Reproduz som de inimigo morto
        useAudio().playSound(enemy.deathSound, 1, randomPitch);

        // Drop dos inimigos no chão
        const minGold = enemy.drops?.gold?.min || 0;
        const maxGold = enemy.drops?.gold?.max || 0;
        const goldDropped = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
        useCurrentRun.currentGold += goldDropped;

        const minExp = enemy.drops?.exp?.min || 0;
        const maxExp = enemy.drops?.exp?.max || 0;
        const expDropped = Math.floor(Math.random() * (maxExp - minExp + 1)) + minExp;
        useCurrentRun.addExp(expDropped);
      }
    } else {
      if (type === 'shot') {
        // Reproduz som de hit suave

        useAudio().playSound(enemy.hitSound, 1, randomPitch);
      }
    }
  }

  /**
   * Limpa os inimigos ativos (ex: ao desmontar o componente)
   */
  function cleanup() {
    activeEnemies.value = [];
  }

  /**
   * Retorna uma posição aleatória para spawnar um inimigo.
   * Devemos escolher uma posição aleatória dentro dos limites do mapa.
   * O Y deve ser fixo (ex: 0) para manter os inimigos na mesma altura.
   * 
   * @returns { x: number, y: number, z: number }
   */
  function generateRandomSpawnPosition() {
    const stageWidth = useCurrentRun.currentStage.width;
    const stageHeight = useCurrentRun.currentStage.height;

    const playerX = useCurrentRun.playerPosition.x;
    const playerZ = useCurrentRun.playerPosition.z;

    // Evitar spawnar muito perto do jogador
    // Podemos definir uma distância mínima (ex: 5 unidades)
    // Se não existir espaço suficiente, spawne no limite máximo.
    const minDistanceFromPlayer = 10;

    // Lembrar de subtrair o tamanho do inimigo das bordas, se necessário
    // adicionar um espaçamento entre o jogador e o spawn dos inimigos
    let x, y = 0, z;
    do {
      x = Math.random() * stageWidth - stageWidth / 2;
      z = Math.random() * stageHeight - stageHeight / 2;
    } while (Math.hypot(x - playerX, z - playerZ) < minDistanceFromPlayer);



    // let x = Math.random() * stageWidth - stageWidth / 2;
    // let y = 0; // Altura fixa
    // let z = Math.random() * stageHeight - stageHeight / 2;

    return { x, y, z };
  }

  return {
    activeEnemies,
    takeDamage,
    update,
    spawnEnemyWave,
    cleanup,
  };
}
