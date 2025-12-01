import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useEnemyManager } from '~/composables/useEnemyManager';

// Define o formato básico do vetor de posição 3D
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export const PlayerBaseStats = {
  id: 'player',
  color: 'yellow',
  maxHealth: 250,
  moveSpeed: 5.0, // unidades por segundo
  projectiles: {
    shotCooldown: 1.25,
    shotSpeed: 20.0,
    size: 0.2,
    damage: 50,
    range: 10,
  },
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  moveVector: { x: 0, y: 0, z: 0 },
}

/**
 * Guardar dados que persistem após o fim da partida.
 * Estado da partida atual (Habilidades pegas)
 *
 * OTIMIZAÇÃO: Usa shallowRef para dados atualizados em alta frequência (60 FPS)
 * seguindo as boas práticas do TresJS para evitar overhead reativo.
 */
export const useCurrentRunStore = defineStore('currentRun', () => {
  // -- COMPOSABLES
  const enemyManager = useEnemyManager();

  // -- ESTADO DO JOGADOR
  // ✅ ShallowRef: Apenas .value é reativo, mutations internas são ignoradas
  // Objetos internos simples para manipulação direta no game loop
  const playerPosition = shallowRef<Vector3>({ ...PlayerBaseStats.position });

  // Rotation
  const playerRotation = shallowRef<Vector3>({ ...PlayerBaseStats.rotation });

  // Vetor de movimento (direção) normalizado, de -1 a 1, calculado pelos controles
  const moveVector = shallowRef<Vector3>({ ...PlayerBaseStats.moveVector });

  // Velocidade atual (ref simples é ok, muda raramente)
  const currentMoveSpeed = ref(PlayerBaseStats.moveSpeed); // Exemplo: 5 unidades por segundo

  const shotCooldownTotal = ref(PlayerBaseStats.projectiles.shotCooldown); // Meio segundo entre tiros
  const shotCooldown = ref(PlayerBaseStats.projectiles.shotCooldown); // Tempo restante para o próximo tiro
  const maxHealth = ref(PlayerBaseStats.maxHealth);
  const currentHealth = ref(PlayerBaseStats.maxHealth);

  // ... (Outros estados como currentHealth, enemiesRemaining, etc.)
  // -- ESTADO DO NÍVEL
  const levelTimer = ref(0); // Tempo decorrido no nível atual
  const gameState = ref('init'); // 'init', 'playing', 'paused', 'gameover', 'victory'.
  const isPlaying = computed(() => gameState.value === 'playing');
  const isPaused = computed(() => gameState.value === 'paused');
  const isGameOver = computed(() => gameState.value === 'gameover');
  const isVictory = computed(() => gameState.value === 'victory');
  const isInit = computed(() => gameState.value === 'init');

  // -- PROGRESSÃO DE SALAS
  const levelConfig = ref(null); // Configuração do nível atual
  const currentStageIndex = ref(0); // Índice da sala atual no levelConfig
  const currentStage = ref(null);
  const stageTimer = ref(0); // Tempo decorrido na sala atual
  const isStageCompleted = ref(false);

  // -- ESTADO DA SALA
  const doorPosition = ref(null);
  const isDoorActive = ref(false);
  const doorSize = ref(null);
  const roomCurrentWaveIndex = ref(0);
  const isWaveInProgress = ref(false);

  function initializeLevel(levelConfiguration: any) {
    levelConfig.value = levelConfiguration;
    currentStageIndex.value = 0;
    levelTimer.value = 0;

    loadStage(levelConfiguration.stages[0]);
  }

  function endRun() {
    console.log('Encerrando a partida atual.');
    // Resetar todos os estados relacionados à partida
    levelConfig.value = null;
    currentStageIndex.value = 0;
    currentStage.value = null;
    levelTimer.value = 0;
    stageTimer.value = 0;
    isStageCompleted.value = false;
    doorPosition.value = null;
    doorSize.value = null;
    isDoorActive.value = false;
    roomCurrentWaveIndex.value = 0;
    isWaveInProgress.value = false;
    currentHealth.value = PlayerBaseStats.maxHealth;
    maxHealth.value = PlayerBaseStats.maxHealth;
    playerPosition.value = { x: 0, y: 0, z: 0 };
    moveVector.value = { x: 0, y: 0, z: 0 };

    enemyManager.cleanup();
  }

  function loadStage(stage: any) {
    console.log('Carregando estágio:', stage);

    currentStage.value = stage;
    isStageCompleted.value = false;
    stageTimer.value = 0;
    doorPosition.value = stage.door.position || null;
    doorSize.value = stage.door.size || null;
    isDoorActive.value = false;
    playerPosition.value = { ...stage.playerStartPosition };
    isWaveInProgress.value = false;
    roomCurrentWaveIndex.value = 0;
  }

  function completeStage() {
    console.log('Estágio completo!');
    isStageCompleted.value = true;
    isDoorActive.value = true;
  }

  function nextStage() {
    if (levelConfig.value && currentStageIndex.value + 1 < levelConfig.value.stages.length) {
      currentStageIndex.value += 1;
      const stage = levelConfig.value.stages[currentStageIndex.value];
      // console.log('Indo para o próximo estágio:', currentStageIndex.value, stage);
      loadStage(stage);
    } else {
      console.log('Todos os estágios completos! Vitória!');
      gameVictory();
    }
  }

  /**
   * Atualiza a posição do jogador substituindo o objeto inteiro.
   * Isso dispara reatividade apenas quando necessário (ex: para UI/debug).
   * Para updates de alta frequência, prefira mutar diretamente o objeto sem chamar esta função.
   */
  function setPlayerPosition(x: number, y: number, z: number) {
    // Substitui o objeto inteiro - isso dispara reatividade do shallowRef
    playerPosition.value = { x, y, z };
  }

  /**
   * Atualiza o vetor de movimento substituindo o objeto inteiro.
   * Chamado apenas quando o input muda (tecla pressionada/solta), não a cada frame.
   */
  function setMoveVector(x: number, y: number, z: number) {
    // Substitui o objeto inteiro - dispara reatividade apenas quando input muda
    moveVector.value = { x, y, z };
  }

  /**
   * Acessa diretamente os valores sem disparar reatividade.
   * Use este para leituras no game loop de alta frequência.
   */
  function getPlayerPosition() {
    return playerPosition.value;
  }

  function getPlayerRotation() {
    return playerRotation.value;
  }

  function setPlayerRotation(x: number, y: number, z: number) {
    playerRotation.value = { x, y, z };
  }

  function getMoveVector() {
    return moveVector.value;
  }

  function takeDamage(amount: number) {
    currentHealth.value = Math.max(0, currentHealth.value - amount);

    if (currentHealth.value <= 0) {
      console.log('Jogador morreu!');
      gameOver('You have been defeated.');
      // Lógica adicional de morte do jogador pode ser adicionada aqui
    }
  }

  function gameStart(levelConfiguration: any) {
    endRun(); // Reseta qualquer estado de jogo anterior

    initializeLevel(levelConfiguration);

    gameState.value = 'playing';
  }

  function gamePause() {
    console.log(isPlaying.value);
    if (isPlaying.value) {
      gameState.value = 'paused';
    }
  }

  function gameResume() {
    if (isPaused.value) {
      gameState.value = 'playing';
    }
  }

  function gameOver(message: string = 'You have been defeated.') {
    console.log('Game Over:', message);
    gameState.value = 'gameover';
  }

  function gameVictory(message: string = 'Congratulations! You have won.') {
    console.log('Victory:', message);
    gameState.value = 'victory';
  }

  // ... (Outras funções)

  return {
    playerPosition,
    getPlayerRotation,
    setPlayerRotation,
    moveVector,
    currentMoveSpeed,
    setPlayerPosition,
    setMoveVector,
    getPlayerPosition,
    getMoveVector,

    takeDamage,
    currentHealth,
    maxHealth,
    shotCooldownTotal,
    shotCooldown,

    // Estado do jogo
    gameState,
    isPlaying,
    isPaused,
    isGameOver,
    isVictory,
    isInit,
    gameStart,
    gamePause,
    gameResume,
    gameOver,
    gameVictory,

    // Portas
    doorPosition,
    doorSize,
    isDoorActive,
    isStageCompleted,
    levelTimer,
    nextStage,
    // ... (Outros retornos)

    // stage management
    completeStage,
    loadStage,
    initializeLevel,
    endRun,
    currentStage,
    currentStageIndex,
    levelConfig,
    stageTimer,
    roomCurrentWaveIndex,
    isWaveInProgress,
  };
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCurrentRunStore, import.meta.hot))
}