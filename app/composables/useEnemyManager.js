import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { storeToRefs } from 'pinia';

// Lógica para gerenciar inimigos: spawn, atualização, remoção, etc.
export function useEnemyManager() {
  const enemyManagerStore = useEnemyManagerStore();
  const useCurrentRun = useCurrentRunStore();

  const { activeEnemies } = storeToRefs(enemyManagerStore);
  
  const update = (delta) => {
    // Lógica para gerenciar inimigos:
    // - Spawnear inimigos conforme instruções do GameDirector
    // - Atualizar estado dos inimigos (posição, vida, etc.)
    // - Remover inimigos derrotados
  };

  const spawnEnemyWave = (waveConfig) => {
    // Status base dos inimigos
    const baseStats = {
      asteroid: { speed: 3, health: 50, onHitDamage: 90 },
      ufo: { speed: 2, health: 100, onHitDamage: 1, distanceKeep: 10},
    };

    // Spawna inimigos conforme a configuração da wave
    waveConfig.enemies.forEach(enemyGroup => {
      // Desestruturação para obter tipo e quantidade
      const { enemyType, count } = enemyGroup;

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
          id: `${enemyType}_${Date.now()}_${i}`,
          type: enemyType,
          position: generateRandomSpawnPosition(),
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
  function takeDamage(enemyId, damage) {
    // Lógica para aplicar dano ao inimigo
    const enemy = activeEnemies.value.find(e => e.id === enemyId);

    if (! enemy) {
      console.warn(`Enemy Manager: No enemy found with ID "${enemyId}" to take damage.`);
      return;
    }

    enemy.health -= damage;

    // Se a saúde do inimigo chegar a zero ou menos, removê-lo
    if (enemy.health <= 0) {
      activeEnemies.value = activeEnemies.value.filter(e => e.id !== enemyId);
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
