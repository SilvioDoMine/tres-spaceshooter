import { emitImpact } from '~/utils/combatEffects'
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { useSkillStore } from '~/stores/SkillStore';
import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useStatisticsStore } from '~/stores/useStatisticsStore';
import { useChapterProgressStore } from '~/stores/useChapterProgressStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useCombatTextStore } from '~/stores/useCombatTextStore';
import { useModal } from '~/composables/useModal';
import { useLevelAccount } from '~/composables/useLevelAccount';
import { playableRoomCount } from '~/utils/progression';
import { MATCH_END_EQUIPMENT_RARITY } from '~/data/equipment';
import { useEquipmentStore } from '~/stores/useEquipmentStore';
import type { OwnedEquipment } from '~/utils/equipment';
import { incomingHit, type DamageContext, type DamageSource } from '~/utils/shipAttributes';
import { useHeartStore } from '~/stores/useHeartStore';
import { useLootStore } from '~/stores/useLootStore';
import { useEquipmentEffectsStore } from '~/stores/useEquipmentEffectsStore';
import { applyElementalHit, createElementState, emitElementalFx, resetElementState, thawElementState, tickElementState } from '~/utils/elementalStatus';
import { COLLISION_IFRAME, COLLISION_KNOCKBACK, createIFrameGate } from '~/utils/combatPatterns';

type PlayerDamageContext = DamageContext & { elements?: any; text?: string };

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
  moveSpeed: 7.0, // unidades por segundo
  regenRate: 0, // porcentagem da vida por segundo
  projectiles: {
    shotCooldown: .85,
    shotSpeed: 19.0,
    size: 0.2,
    damage: 50,
    range: 11,
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
  const uiModalVictory = useModal('play-victory-modal');
  const levelAccount = useLevelAccount();

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

  // Fogo, gelo e raio aplicados na nave do jogador (objeto simples, lido no game loop)
  const playerElements = createElementState();

  // Colisão: i-frame só de colisão (a nave pisca) e empurrão para longe de quem encostou (lidos no game loop)
  const collisionGate = createIFrameGate(COLLISION_IFRAME);
  const knockback = { x: 0, z: 0 };

  // Velocidade atual (ref simples é ok, muda raramente)
  const currentMoveSpeed = ref(PlayerBaseStats.moveSpeed); // Exemplo: 5 unidades por segundo

  const shotCooldownTotal = ref(PlayerBaseStats.projectiles.shotCooldown); // Meio segundo entre tiros
  const shotCooldown = ref(PlayerBaseStats.projectiles.shotCooldown); // Tempo restante para o próximo tiro
  const maxHealth = ref(PlayerBaseStats.maxHealth * playerStats.getHealthMultiplier);
  const currentHealth = ref(PlayerBaseStats.maxHealth * playerStats.getHealthMultiplier);

  const skillRerollCount = ref(0);

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
  let goldRemainder = 0;
  const runEquipment = ref<OwnedEquipment | null>(null); // Equipamento ganho ao fim da partida

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
    resetElementState(playerElements);
    resetCollision();
    currentMoveSpeed.value = PlayerBaseStats.moveSpeed;
    shotCooldownTotal.value = PlayerBaseStats.projectiles.shotCooldown;
    shotCooldown.value = PlayerBaseStats.projectiles.shotCooldown;
    currentGold.value = 0;
    goldRemainder = 0;
    runEquipment.value = null;
    currentExp.value = 0;
    currentLevel.value = 1;
    expToNextLevel.value = getExpForLevel(currentLevel.value);
    skillRerollCount.value = 0;
    gameState.value = 'init';

    // Close modals
    uiModalPause.close();

    enemyManager.cleanup();
    skillStore.cleanup();
    useHeartStore().cleanup();
    useLootStore().cleanup();
    useEquipmentEffectsStore().cleanup();
  }

  function loadStage(stage: any) {
    useSpatialDilation().reset(stage);
    console.log('Carregando estágio:', stage);

    currentStage.value = stage;
    isStageCompleted.value = false;
    stageTimer.value = 0;
    const door = stage.door?.position;
    doorPosition.value = door ? { x: Math.max(-stage.width / 2 + 2, Math.min(stage.width / 2 - 2, door.x)), y: 0, z: Math.max(-stage.height / 2 + 5, Math.min(stage.height / 2 - 3, door.z)) } : null;
    doorSize.value = stage.door.size || null;
    isDoorActive.value = false;
    playerPosition.value = { ...stage.playerStartPosition };
    resetElementState(playerElements);
    resetCollision();
    isWaveInProgress.value = false;
    roomCurrentWaveIndex.value = 0;
    currentMoveSpeed.value = playerStats.moveSpeed;
    // Saiu da sala com corações vindo: a cura ainda conta
    useHeartStore().collectAll();
    // Espólio que não chegou a voar (ex.: debug pulando sala) não perde o ouro nem a EXP
    useLootStore().collectAll();

    // Remoção de modal
    uiModalPause.close();
  }

  function completeStage() {
    console.log('Estágio completo!');
    // Aprendizado conta cada sala concluída uma única vez
    if (!isStageCompleted.value && currentStage.value?.type !== 'intro') skillStore.onRoomCleared();
    isStageCompleted.value = true;
    isDoorActive.value = true;

    // Mesmo se tiver completado, se for uma sala de introdução, mantém a velocidade normal
    if (currentStage.value.type !== 'intro') {
      currentMoveSpeed.value = playerStats.moveSpeed * 3;
    }
  }

  function nextStage() {
    if (levelConfig.value && currentStageIndex.value + 1 < levelConfig.value.stages.length) {
      currentStageIndex.value += 1;
      const stage = levelConfig.value.stages[currentStageIndex.value];
      // console.log('Indo para o próximo estágio:', currentStageIndex.value, stage);
      loadStage(stage);
    } else {
      // Vencer o capítulo libera o próximo
      useChapterProgressStore().markCompleted(Number(levelConfig.value?.chapter) || 1);
      gameVictoryRewards(true);
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
    return !!currentStage.value && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
  }

  function takeDamage(amount: number, context: DamageSource | PlayerDamageContext = 'environment') {
    if(amount<=0 || currentHealth.value<=0)return;
    const { source, attackerId, elements, text } = typeof context === 'string'
      ? { source: context, attackerId: undefined, elements: undefined, text: undefined }
      : context;
    const equipmentEffects = useEquipmentEffectsStore();
    const hit = incomingHit(amount, source, playerStats.combatStats);
    if (hit.dodged) {
      combatTextStore.emitForTarget(PlayerBaseStats.id, 'dodge', 'DESVIO');
      equipmentEffects.onDodge();
      return;
    }
    if (equipmentEffects.blockIncoming(source)) {
      combatTextStore.emitForTarget(PlayerBaseStats.id, 'shield', 'BLOQUEIO');
      return;
    }
    amount = hit.damage;
    if (amount <= 0) return;
    const position = getPlayerPosition();
    // Congelado: dano de outra fonte quebra o gelo e causa a segunda parcela de dano bruto
    const shatter = thawElementState(playerElements);
    if (shatter > 0) emitElementalFx({ kind: 'shatter', x: position.x, z: position.z, size: 1.2 });
    applyPlayerDamage(amount, source, attackerId, text || 'damage');
    if (shatter > 0) applyPlayerDamage(shatter, 'environment', undefined, 'freeze');
    if (elements && currentHealth.value > 0) {
      const result = applyElementalHit(playerElements, elements, amount);
      if (result.lightning > 0) {
        emitElementalFx({ kind: 'chain', points: [{ x: position.x, z: position.z }] });
        applyPlayerDamage(result.lightning, 'environment', undefined, 'shock');
      }
      if (result.froze && currentHealth.value > 0) {
        emitElementalFx({ kind: 'freeze', x: position.x, z: position.z, size: 1.2 });
        applyPlayerDamage(result.freezeDamage, 'environment', undefined, 'freeze');
      }
    }
  }

  /**
   * Encostar em inimigo: dano de colisão, i-frame só de colisão e empurrão para longe de `from`.
   * Retorna false se a nave ainda estava imune.
   */
  function takeCollision(amount: number, from?: { x: number; z: number }) {
    if (currentHealth.value <= 0 || !collisionGate.consume()) return false;
    takeDamage(amount, 'collision');
    if (currentHealth.value <= 0) return true;
    const position = getPlayerPosition();
    const dx = position.x - (from?.x ?? position.x), dz = position.z - (from?.z ?? position.z);
    const distance = Math.hypot(dx, dz);
    // Encostou bem no centro: empurra para trás da nave
    const yaw = getPlayerRotation().y;
    const direction = distance > 1e-6 ? { x: dx / distance, z: dz / distance } : { x: Math.sin(yaw), z: Math.cos(yaw) };
    knockback.x = direction.x * COLLISION_KNOCKBACK.speed;
    knockback.z = direction.z * COLLISION_KNOCKBACK.speed;
    return true;
  }

  /** Avança o i-frame de colisão e devolve o deslocamento do empurrão neste frame. */
  function updateCollision(delta: number) {
    collisionGate.update(delta);
    const step = { x: knockback.x * delta, z: knockback.z * delta };
    const decay = Math.exp(-COLLISION_KNOCKBACK.decay * delta);
    knockback.x *= decay;
    knockback.z *= decay;
    return step;
  }

  /** Segundos restantes de imunidade a colisão (a nave pisca enquanto for > 0). */
  function getCollisionGrace() {
    return collisionGate.remaining;
  }

  function resetCollision() {
    collisionGate.reset();
    knockback.x = 0;
    knockback.z = 0;
  }

  /** Subtrai a vida do jogador, com texto, feedback e game over. */
  function applyPlayerDamage(amount: number, source: DamageSource, attackerId: string | undefined, textType: string) {
    if (amount <= 0 || currentHealth.value <= 0) return;
    const previousHealth=currentHealth.value;
    currentHealth.value = Math.max(0, currentHealth.value - amount);
    useEquipmentEffectsStore().onPlayerDamaged(previousHealth, currentHealth.value, source, attackerId);
    const position=getPlayerPosition();
    // Ticks elementais não repetem impacto e som a cada meio segundo
    const direct = textType === 'damage';
    if (direct || currentHealth.value === 0) emitImpact(position.x,position.z,currentHealth.value===0,'player');

    // actual damage amount
    let actualDamage = Math.min(amount, previousHealth);

    // emit combat text
    combatTextStore.emitForTarget(
      PlayerBaseStats.id,
      textType,
      Math.round(actualDamage),
    );

    if (currentHealth.value <= 0) {
      console.log('Jogador morreu!');
      gameOver('You have been defeated.');
      // Lógica adicional de morte do jogador pode ser adicionada aqui
    } else if (direct) {
      useAudio().playSound('hit-soft1');
    }
  }

  /** Queimadura e gelo que expira na nave do jogador. */
  function updateElements(delta: number) {
    if (currentHealth.value <= 0) return;
    const { burn, thaw } = tickElementState(playerElements, delta);
    if (thaw > 0) {
      const position = getPlayerPosition();
      emitElementalFx({ kind: 'shatter', x: position.x, z: position.z, size: 1.2 });
      takeDamage(thaw, { source: 'environment', text: 'freeze' });
    }
    if (burn > 0) takeDamage(burn, { source: 'environment', text: 'burn' });
  }

  function getPlayerElements() {
    return playerElements;
  }

  function healPlayer(amount: number, showText = true) {
    if (amount <= 0) {
      return;
    }

    amount = Math.min(amount, Math.max(0, maxHealth.value - currentHealth.value));
    if (amount <= 0 || currentHealth.value <= 0) return;
    currentHealth.value += amount;

    if (!showText) {
      return;
    }

    // emit combat text
    combatTextStore.emitForTarget(
      PlayerBaseStats.id,
      'heal',
      Math.round(amount),
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
    playerStats.initialize(useEquipmentStore().stats);
    useEquipmentEffectsStore().initialize(playerStats.attributes.effects);
    maxHealth.value = playerStats.maxHealth;
    currentHealth.value = maxHealth.value;
    shotCooldownTotal.value = playerStats.attributes.shotCooldown;
    shotCooldown.value = shotCooldownTotal.value;
    skillRerollCount.value = playerStats.attributes.skillRerolls;

    initializeLevel(levelConfiguration);

    gameState.value = 'playing';
    for (let i = 0; i < playerStats.attributes.startingSkillChoices; i++) gameLevelSelect();
  }

  function gamePause() {
    if (isPlaying.value) {
      gameState.value = 'paused';
      uiModalPause.open();
      useAudio().startBackgroundMusicAbafado();
    }
  }

  function gameResume() {
    if (isPaused.value) {
      uiModalPause.close();
      gameState.value = 'playing';
      useAudio().stopBackgroundMusicAbafado();
    }
  }

  function gameOver(message: string = 'You have been defeated.') {
    console.log('Game Over:', message);
    gameVictoryRewards();
    gameState.value = 'gameover';
    uiModalOver.open();
    // Toda derrota (morte, debug...) passa por aqui: corta a música da fase e toca o sting
    useAudio().stopBackgroundMusic();
    useAudio().playResultSound('defeat');
  }

  function gameVictoryRewards(completedChapter = false) {
    console.log('Calculating victory rewards...');
    // Acabou com moedas no chão: o ouro delas ainda conta (a EXP é só da run e fica para trás)
    useLootStore().collectAll(false);

    saveGold(Number(totalGold.value) + Number(currentGold.value));
    totalGold.value += currentGold.value;

    const roomsReached = playableRoomCount(levelConfig.value, currentStageIndex.value);

    // Estatísticas da conta (a Loja libera os baús grátis depois da 1ª partida)
    const killed = Object.values(useEnemyManagerStore().killedEnemies as Record<string, number>).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0,
    );
    useStatisticsStore().recordMatch({
      victory: completedChapter,
      durationSec: Number(levelTimer.value) || 0,
      enemiesKilled: killed,
      goldEarned: Number(currentGold.value) || 0,
      roomsReached,
    });

    const expGained = levelAccount.calculateExpReward(levelConfig.value, roomsReached, completedChapter);

    console.log(`Player gained ${expGained} EXP from victory.`);

    levelAccount.addExp(expGained);

    // Só a vitória (capítulo concluído) dá um equipamento aleatório; derrota rende apenas ouro e EXP
    runEquipment.value = completedChapter
      ? useEquipmentStore().grantRandom(MATCH_END_EQUIPMENT_RARITY)
      : null;

    enemyManager.missionsOnComplete();
    useMissions().handleEvent('play-time', parseFloat((levelTimer.value / 60).toFixed(1))); // em minutos com float de até 1 casa decimal
  }

  function gameVictory(message: string = 'Congratulations! You have won.') {
    console.log('Victory:', message);

    gameState.value = 'victory';
    uiModalVictory.open();
    // Abafa a música da fase para a fanfarra aparecer
    useAudio().startBackgroundMusicAbafado(0.4);
    useAudio().playResultSound('victory');
    useMissions().handleEvent('stage-complete', 1);
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

  /** Gasta do gold persistente (ex.: sorteio de talentos). Retorna false se não tiver o suficiente. */
  function spendGold(amount: number): boolean {
    const total = Number(totalGold.value) || 0;
    if (amount < 0 || total < amount) return false;

    totalGold.value = total - amount;
    saveGold(totalGold.value);
    return true;
  }

  function addGold(amount: number) {
    const reward = Math.max(0, amount) * playerStats.attributes.battleGoldMultiplier + goldRemainder;
    const wholeGold = Math.floor(reward + 1e-9);
    currentGold.value += wholeGold;
    goldRemainder = Math.max(0, reward - wholeGold);
  }

  /** Soma no gold persistente e salva (loja, missões, ofertas) */
  function addPersistentGold(amount: number) {
    if (!(amount > 0)) return;
    totalGold.value = (Number(totalGold.value) || 0) + Math.floor(amount);
    saveGold(totalGold.value);
  }

  function addExp(amount: number) {
    currentExp.value += amount;

    while (currentExp.value >= expToNextLevel.value) {
      levelUp();
    }
  }

  function levelUp() {
    currentLevel.value += 1;
    healPlayer(maxHealth.value * playerStats.attributes.levelUpHealFraction);
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
    takeCollision, // Colisão com inimigo: dano, i-frame de colisão e empurrão
    updateCollision, // Avança o i-frame de colisão e devolve o empurrão do frame
    getCollisionGrace, // Tempo restante de imunidade a colisão
    updateElements, // Ticks de fogo e gelo na nave do jogador
    getPlayerElements, // Estado elemental da nave do jogador
    healPlayer, // Função para curar o jogador
    setMaxHealth, // Função para definir a saúde máxima do jogador
    currentHealth, // Saúde atual do jogador
    maxHealth, // Saúde máxima do jogador
    shotCooldownTotal, // Cooldown total do tiro
    shotCooldown, // Cooldown restante do tiro

    totalGold, // Gold total persistente
    spendGold, // Gasta do gold persistente e salva
    addPersistentGold, // Soma no gold persistente e salva
    addGold,
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
    runEquipment,
  };
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCurrentRunStore, import.meta.hot))
}


