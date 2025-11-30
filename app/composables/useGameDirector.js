/**
 * O Gerenciador de Roteiro. Lê a config de nível, spawna inimigos, controla a progressão de sala/onda.
 */
export function useGameDirector() {
  const enemyManager = useEnemyManager();
  const currentRunStore = useCurrentRunStore();

  const startRun = () => {
    console.log('Game Director: Iniciando nova run e preparando primeira sala.');
    currentRunStore.isDoorActive = false;
    currentRunStore.isStageCompleted = false;
  }

  const update = (delta) => {
    // Lógica para gerenciar a progressão do jogo:
    // - Verificar se todas as ondas de inimigos foram derrotadas
    // - Avançar para a próxima sala/stage
    // - Spawnear inimigos conforme a configuração do nível
    const stage = currentRunStore.currentStage;

    
    if (! stage ) {
      return;
    };

    if (stage.type === 'combat') {
      handleCombatStage(delta, stage);
    } else if (stage.type === 'intro') {
      handleIntroStage(delta, stage);
    } else if (stage.type === 'upgrade') {
      handleUpgradenStage(delta, stage);
    }
  };

  const handleCombatStage = (delta, stage) => {
    // console.log('Game Director: Atualizando estágio de combate.', stage);
    if (currentRunStore.isStageCompleted) {
      return;
    }

    const currentWaveIndex = currentRunStore.roomCurrentWaveIndex;
    const waves = stage.waves;

    // Se não houver ondas, completar o estágio imediatamente
    if (waves.length === 0) {
      console.log('Game Director: Estágio de combate sem ondas. Completando estágio.');
      currentRunStore.completeStage();
      return;
    }

    const currentWave = waves[currentWaveIndex];

    // console.log('Game Director: Estágio de combate. Onda atual:', currentWaveIndex);

    if (! currentRunStore.isWaveInProgress) {
      enemyManager.spawnEnemyWave(currentWave);
      currentRunStore.isWaveInProgress = true;
      return;
    }

    if (currentRunStore.isWaveInProgress && enemyManager.activeEnemies.length === 0) {
      currentRunStore.isWaveInProgress = false;
      
      // if there are more waves, advance to the next wave
      if (currentWaveIndex + 1 < waves.length) {
        currentRunStore.roomCurrentWaveIndex += 1;
      } else {
        console.log('Game Director: Todas as ondas completadas. Estágio de combate completo.');
        currentRunStore.completeStage();
      }

      return;
    }

    // console.log('Onda atual:', currentWaveIndex, 'Inimigos ativos:', enemyManager.activeEnemies.value.length);
  }

  const handleIntroStage = (delta, stage) => {
    if (!currentRunStore.isStageCompleted) {
      console.log('Game Director: Estágio de introdução completo. Ativando porta para próxima sala.');
      currentRunStore.completeStage();
    }
  }

  const handleUpgradenStage = (delta, stage) => {
    console.log('Game Director: Atualizando estágio de upgrade.');
  }
  
  return {
    update,
  };
}
