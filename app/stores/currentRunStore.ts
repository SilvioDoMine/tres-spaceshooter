import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { useSkillStore } from '~/stores/SkillStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useCombatTextStore } from '~/stores/useCombatTextStore';

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
  regenRate: 0, // porcentagem da vida por segundo
  projectiles: {
    shotCooldown: 1.25,
    shotSpeed: 10.0,
    size: 0.2,
    damage: 50,
    range: 8,
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
  const skillStore = useSkillStore();
  const playerStats = usePlayerStats();
  const combatTextStore = useCombatTextStore();
  const uiModalPause = useModal('pause-modal');
  const uiModalOver = useModal('play-over-modal');

  // -- ESTADO PERSISTENTE ENTRE PARTIDAS
  const totalGold = ref(0); // Gold total persistente entre partidas

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
  const maxHealth = ref(PlayerBaseStats.maxHealth * playerStats.getHealthMultiplier);
  const currentHealth = ref(PlayerBaseStats.maxHealth * playerStats.getHealthMultiplier);

  const skillRerollCount = ref(1);

  // ... (Outros estados como currentHealth, enemiesRemaining, etc.)
  // -- ESTADO DO NÍVEL
  const levelTimer = ref(0); // Tempo decorrido no nível atual
  const gameState = ref('init'); // 'init', 'playing', 'paused', 'gameover', 'victory'
  const isPlaying = computed(() => gameState.value === 'playing');
  const isPaused = computed(() => gameState.value === 'paused');
  const isGameOver = computed(() => gameState.value === 'gameover');
  const isVictory = computed(() => gameState.value === 'victory');
  const isInit = computed(() => gameState.value === 'init');
  const currentExp = ref(0);
  const currentLevel = ref(1);
  const currentGold = ref(0);

  const expToNextLevel = ref(getExpForLevel(currentLevel.value));

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

  function initializePermanentState() {
    totalGold.value = loadGold();
    console.log('Permanent state initialized. Total Gold:', totalGold.value);
  }

  function initializeLevel(levelConfiguration: any) {
    levelConfig.value = levelConfiguration;
    currentStageIndex.value = 0;
    levelTimer.value = 0;

    loadStage(levelConfiguration.stages[0]);
  }

  function endRun() {
    // import inside here projectilestore and use it the cleanup because of circular dependency issues

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
    playerRotation.value = { x: 0, y: 0, z: 0 };
    moveVector.value = { x: 0, y: 0, z: 0 };
    currentMoveSpeed.value = PlayerBaseStats.moveSpeed;
    shotCooldownTotal.value = PlayerBaseStats.projectiles.shotCooldown;
    shotCooldown.value = PlayerBaseStats.projectiles.shotCooldown;
    currentGold.value = 0;
    currentExp.value = 0;
    currentLevel.value = 1;
    expToNextLevel.value = getExpForLevel(currentLevel.value);
    skillRerollCount.value = 1;
    gameState.value = 'init';

    // Close modals
    uiModalPause.close();

    enemyManager.cleanup();
    skillStore.cleanup();
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
    currentMoveSpeed.value = PlayerBaseStats.moveSpeed;

    // Remoção de modal
    uiModalPause.close();
  }

  function completeStage() {
    console.log('Estágio completo!');
    isStageCompleted.value = true;
    isDoorActive.value = true;

    // Mesmo se tiver completado, se for uma sala de introdução, mantém a velocidade normal
    if (currentStage.value.type !== 'intro') {
      currentMoveSpeed.value = PlayerBaseStats.moveSpeed * 3;
    }
  }

  function nextStage() {
    if (levelConfig.value && currentStageIndex.value + 1 < levelConfig.value.stages.length) {
      currentStageIndex.value += 1;
      const stage = levelConfig.value.stages[currentStageIndex.value];
      // console.log('Indo para o próximo estágio:', currentStageIndex.value, stage);
      loadStage(stage);
    } else {
      gameVictoryRewards();
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

  function canPlayerMoveTo(x: number, y: number, z: number): boolean {
    // Verifica a colusão com o Stage X e Z
    const stage = currentStage.value;
    if (!stage) {
      return false; // Nenhum estágio carregado
    }

    const halfWidth = stage.width / 2 - 0.5;
    const halfHeight = stage.height / 2 - 0.5;

    if (x < -halfWidth || x > halfWidth || z < -halfHeight || z > halfHeight) {
      return false; // Fora dos limites do mapa
    }

    return true;
  }

  function takeDamage(amount: number) {
    currentHealth.value = Math.max(0, currentHealth.value - amount);

    // actual damage amount
    let actualDamage = Math.min(amount, currentHealth.value);

    // emit combat text
    combatTextStore.emitForTarget(
      PlayerBaseStats.id,
      'damage',
      actualDamage,
    );

    if (currentHealth.value <= 0) {
      console.log('Jogador morreu!');
      gameOver('You have been defeated.');
      // Lógica adicional de morte do jogador pode ser adicionada aqui
    }
  }

  function healPlayer(amount: number) {
    if (amount <= 0) {
      return;
    }

    currentHealth.value = Math.min(currentHealth.value + amount, maxHealth.value);

    // emit combat text
    combatTextStore.emitForTarget(
      PlayerBaseStats.id,
      'heal',
      amount,
    );
  }

  function setMaxHealth(newMaxHealth: number) {
    maxHealth.value = newMaxHealth;
    // Ajusta a saúde atual se necessário
    if (currentHealth.value > maxHealth.value) {
      currentHealth.value = maxHealth.value;
    }
  }

  function setMoveSpeed(newMoveSpeed: number) {
    currentMoveSpeed.value = newMoveSpeed;
  }

  function gameStart(levelConfiguration: any) {
    endRun(); // Reseta qualquer estado de jogo anterior

    initializeLevel(levelConfiguration);

    gameState.value = 'playing';
  }

  function gamePause() {
    if (isPlaying.value) {
      gameState.value = 'paused';
      uiModalPause.open();
    }
  }

  function gameResume() {
    if (isPaused.value) {
      uiModalPause.close();
      gameState.value = 'playing';
    }
  }

  function gameOver(message: string = 'You have been defeated.') {
    console.log('Game Over:', message);
    gameState.value = 'gameover';
    uiModalOver.open();
  }

  function gameVictoryRewards() {
    console.log('Calculating victory rewards...');

    saveGold(Number(totalGold.value) + Number(currentGold.value));
    totalGold.value += currentGold.value;
  }

  function gameVictory(message: string = 'Congratulations! You have won.') {
    console.log('Victory:', message);

    gameState.value = 'victory';
  }

  function gameLevelSelect() {
    gameState.value = 'paused';
    skillStore.startSkillSelection();
  }

  function loadGold(): number {
    if (import.meta.server) {
      return 0;
    }

    const savedGold = localStorage.getItem('playerGold');

    if (! savedGold) {
      console.log('No saved gold found, starting at 0.');
      return 0;
    }

    return parseInt(savedGold, 10);
  }

  function saveGold(goldAmount: number) {
    localStorage.setItem('playerGold', goldAmount.toString());
  }

  function addGold(amount: number) {
    currentGold.value += amount;
    saveGold(currentGold.value);
  }

  function addExp(amount: number) {
    const multiplier = (stageLevel: number) => {
      return 1 + (stageLevel - 1) * 0.5; // Exemplo: 10% a mais por nível de estágio acima do 1
    }

    currentExp.value += amount * multiplier(currentStageIndex.value + 1);

    while (currentExp.value >= expToNextLevel.value) {
      levelUp();
    }
  }

  function levelUp() {
    currentLevel.value += 1;
    currentExp.value = currentExp.value - expToNextLevel.value;
    expToNextLevel.value = getExpForLevel(currentLevel.value);
    console.log(`Parabéns! Você alcançou o nível ${currentLevel.value}!`);
    // Aqui você pode adicionar lógica adicional para recompensas de nível, etc.

    // Abre o modal de level up
    gameLevelSelect();
  }

  function resetExp() {
    currentExp.value = 0;
  }

  function getExpForLevel(level: number): number {
    const baseExp = 100;
    const exponent = 1.5;

    console.log(`Calculating EXP for level ${level}:`, Math.floor(baseExp * Math.pow(level, exponent)));

    return Math.floor(baseExp * Math.pow(level, exponent));
  }

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
    setMoveSpeed,
    canPlayerMoveTo,

    takeDamage, // Função para o jogador receber dano
    healPlayer, // Função para curar o jogador
    setMaxHealth, // Função para definir a saúde máxima do jogador
    currentHealth, // Saúde atual do jogador
    maxHealth, // Saúde máxima do jogador
    shotCooldownTotal, // Cooldown total do tiro
    shotCooldown, // Cooldown restante do tiro

    totalGold, // Gold total persistente
    currentGold, // Gold na partida atual
    currentExp, // Experiência na partida atual
    getExpForLevel, // Função para obter o nível atual do jogador (baseado em EXP)
    expToNextLevel, // EXP necessária para o próximo nível
    currentLevel, // Nível atual do jogador (baseado em EXP)
    addExp, // Função para adicionar EXP

    skillRerollCount, // Quantidade de rerolls disponíveis

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
    gameLevelSelect,

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

    // permanent state
    initializePermanentState,
  };
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCurrentRunStore, import.meta.hot))
}