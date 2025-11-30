// Lógica para gerenciar inimigos: spawn, atualização, remoção, etc.
export function useEnemyManager() {
  const activeEnemies = ref([]);

  const update = (delta) => {
    // Lógica para gerenciar inimigos:
    // - Spawnear inimigos conforme instruções do GameDirector
    // - Atualizar estado dos inimigos (posição, vida, etc.)
    // - Remover inimigos derrotados
  };

  const spawnEnemyWave = (waveConfig) => {
    // {
    //   enemies: [
    //     { enemyType: 'asteroid', count: 4 },
    //     { enemyType: 'ufo', count: 2 },
    //   ]
    // }
    console.log('Enemy Manager: Spawning enemy wave:', waveConfig);

    const baseStats = {
      asteroid: { speed: 1, health: 3, onHitDamage: 1 },
      ufo: { speed: 2, health: 5, onHitDamage: 1 },
    };

    waveConfig.enemies.forEach(enemyGroup => {
      const { enemyType, count } = enemyGroup;
      for (let i = 0; i < count; i++) {
        const enemyStats = baseStats[enemyType];
        if (enemyStats) {
          const newEnemy = {
            id: `${enemyType}_${Date.now()}_${i}`,
            type: enemyType,
            position: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, z: 0 },
            ...enemyStats,
          };
          activeEnemies.value.push(newEnemy);
          console.log('Enemy Manager: Spawned enemy:', newEnemy);
        } else {
          console.warn(`Enemy Manager: Unknown enemy type "${enemyType}"`);
        }
      }
    });
  }

  return {
    activeEnemies,
    update,
    spawnEnemyWave,
  };
}
