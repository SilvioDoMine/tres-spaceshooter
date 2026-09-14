import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useMissions } from '~/composables/useMissions';
import { storeToRefs } from 'pinia';
import { emitImpact } from '~/utils/combatEffects';
import { chapterDamageMultiplier, enemyCategory, normalAsteroidFragmentStats, roomProgress, scaledEnemyExperience, scaledEnemyHealth } from '~/utils/combatPatterns';
import { playableRoomCount } from '~/utils/progression';
import { headshotKills, outgoingHit, siphonHeal } from '~/utils/shipAttributes';
import { useHeartStore } from '~/stores/useHeartStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useEquipmentEffectsStore } from '~/stores/useEquipmentEffectsStore';
import { applyElementalHit, elementChainTargets, elementStateOf, emitElementalFx, ELEMENT_RULES, thawElementState, tickElementState } from '~/utils/elementalStatus';

// Tipos de dano que vêm do jogador (dão recompensa ao matar)
const PLAYER_DAMAGE_TYPES = ['shot', 'equipment', 'reflect', 'elemental'];

export const baseStats = {
  miniasteroid: {
    color: 'gray',
    shape: 'dodecahedron',
    speed: 1.5,
    health: 90,
    baseXP: 20,
    onHitDamage: 400,
    size: 0.75,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 20, max: 20 },
      gold: { min: 0, max: 10 }
    }
  },
  asteroid: {
    color: 'gray',
    shape: 'dodecahedron',
    speed: 3,
    health: 500,
    baseXP: 90,
    onHitDamage: 900,
    size: 1.25,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 90, max: 90 },
      gold: { min: 0, max: 10 }
    }
  },
  asteroidBoss: {
    color: 'gray',
    shape: 'dodecahedron',
    speed: 2,
    health: 2600,
    baseXP: 900,
    fixedXP: true,
    asteroidGeneration: 0,
    onHitDamage: 9999,
    size: 2.25,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 900, max: 900 },
      gold: { min: 0, max: 10 }
    }
  },
  ufo: {
    color: 'green',
    shape: 'square',
    size: 1,
    speed: 2,
    health: 130,
    baseXP: 40,
    onHitDamage: 150,
    distanceKeep: 10,
    shotDamage: 50,
    cooldownTotalShot: 2,
    shotSound: 'shoot7',
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 40, max: 40 },
      gold: { min: 5, max: 15 }
    }
  },
  ufofast: {
    color: 'hotpink',
    shape: 'square',
    size: 1,
    speed: 2.2,
    health: 180,
    baseXP: 55,
    onHitDamage: 500,
    distanceKeep: 20,
    shotDamage: 100,
    cooldownTotalShot: 1.75,
    shotSound: 'shoot2',
    deathSound: 'hit-hard2',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 55, max: 55 },
      gold: { min: 10, max: 25 }
    }
  },
  kamikaze: {
    color: '#ff4d4d',
    shape: 'cone',
    size: 1,
    speed: 3.5,
    health: 120,
    baseXP: 60,
    onHitDamage: 300,
    distanceKeep: 7,
    chargeRecoveryCooldown: 3, // Cooldown após charge (segundos)
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 60, max: 60 },
      gold: { min: 10, max: 20 }
    }
  },
  miniboss: {
    color: 'green',
    shape: 'square',
    size: 3,
    speed: 1.1,
    health: 1400,
    baseXP: 300,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 200,
    cooldownTotalShot: 2,
    shotSound: 'shoot7',
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 300, max: 300 },
      gold: { min: 100, max: 200 }
    }
  },
  boss: {
    color: 'hotpink',
    shape: 'square',
    size: 3,
    speed: 1.1,
    health: 7800,
    baseXP: 0,
    fixedXP: true,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 300,
    cooldownTotalShot: 1,
    shotSound: 'shoot2',
    deathSound: 'enemy-death2',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 100, max: 200 }
    }
  },
  // ==================== BOSSES DOS CAPÍTULOS 2 E 3 ====================
  // Modelo próprio (EnemyBoss). Movimento em utils/bossBehaviors.js, rajadas em chapterBossProfile.
  // Vida exata (não escala com sala nem capítulo).
  hiveBoss: {
    color: '#d8952a',
    shape: 'square',
    model: 'hive',
    exactStats: true,
    size: 3,
    speed: 1,
    health: 5200,
    baseXP: 0,
    fixedXP: true,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 200,
    cooldownTotalShot: 2,
    shotSound: 'shoot7',
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 150, max: 250 }
    }
  },
  // Mini-colmeia: aparece depois da Colmeia (Capítulo 2 sala 11+ e Capítulo 3). Escala com sala e capítulo.
  miniHive: {
    color: '#d8952a',
    shape: 'square',
    model: 'hive',
    size: 1.4,
    speed: .9,
    health: 420,
    baseXP: 110,
    shotSound: 'shoot7',
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 110, max: 110 },
      gold: { min: 20, max: 40 }
    }
  },
  // Caça kamikaze lançado pelas colmeias (dano de contato vem de quem lança). Não atira nem dá recompensa.
  hiveDrone: {
    color: '#ffb13b',
    shape: 'cone',
    size: .7,
    speed: 3,
    health: 60,
    baseXP: 0,
    fixedXP: true,
    holdFire: true,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 0, max: 0 }
    }
  },
  // Mini-harpia: aparece depois da Harpia (Capítulo 3). Escala com sala e capítulo.
  miniHarpy: {
    color: '#ff4f9e',
    shape: 'square',
    model: 'harpy',
    size: 1.3,
    speed: 1.2,
    health: 380,
    baseXP: 120,
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 120, max: 120 },
      gold: { min: 25, max: 45 }
    }
  },
  harpyBoss: {
    color: '#ff4f9e',
    shape: 'square',
    model: 'harpy',
    exactStats: true,
    size: 3.2,
    speed: 1.2,
    health: 9500,
    baseXP: 0,
    fixedXP: true,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 300,
    cooldownTotalShot: 1,
    shotSound: 'shoot2',
    deathSound: 'enemy-death2',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 200, max: 300 }
    }
  },
  bastionBoss: {
    color: '#62f2ff',
    shape: 'square',
    model: 'bastion',
    exactStats: true,
    size: 3,
    speed: .8,
    health: 7000,
    baseXP: 0,
    fixedXP: true,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 250,
    cooldownTotalShot: 2,
    shotSound: 'shoot7',
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 250, max: 350 }
    }
  },
  colossusBoss: {
    color: '#ff5a26',
    shape: 'square',
    model: 'colossus',
    exactStats: true,
    size: 4.5,
    speed: .9,
    health: 13000,
    baseXP: 0,
    fixedXP: true,
    onHitDamage: 999,
    distanceKeep: 20,
    shotDamage: 350,
    cooldownTotalShot: 1,
    shotSound: 'shoot2',
    deathSound: 'enemy-death2',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 300, max: 450 }
    }
  },
  kamikazeBoss: {
    color: '#ff4d4d',
    shape: 'cone',
    size: 2,
    speed: 3,
    health: 1600,
    onHitDamage: 9999,
    distanceKeep: 10,
    chargeRecoveryCooldown: 1, // Sem cooldown após charge
    deathSound: 'enemy-death3',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 500, max: 800 },
      gold: { min: 150, max: 300 }
    }
  },

  // ==================== INIMIGOS EXEMPLO ====================
  // Estes são exemplos de como criar novos tipos de inimigos
  // Você pode modificá-los, removê-los ou criar novos baseados neles

  // Exemplo 1: Inimigo Esfera Simples
  angel: {
    color: 'cyan',
    shape: 'sphere',
    speed: 0,
    health: 1,
    onHitDamage: 0,
    size: 1.2,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 0, max: 0 },
      gold: { min: 0, max: 0 }
    }
  },

  // Exemplo 2: Inimigo Torus (disco) com animação customizada
  torusEnemy: {
    color: 'orange',
    shape: 'torus', // ← Este inimigo tem rotação customizada no componente
    speed: 2.0,
    health: 180,
    baseXP: 70,
    onHitDamage: 180,
    size: 1.0,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: { min: 70, max: 70 },
      gold: { min: 15, max: 25 }
    }
  },

  // Exemplo 3: Inimigo Composto (corpo + satélites)
  compositeEnemy: {
    color: 'fuchsia',
    shape: 'composite', // ← Este inimigo tem múltiplas partes visuais
    speed: 1.8,
    health: 220,
    baseXP: 80,
    onHitDamage: 220,
    size: 1.5,
    deathSound: 'enemy-death1',
    hitSound: 'hit-soft3',
    drops: {
      exp: { min: 80, max: 80 },
      gold: { min: 20, max: 40 }
    }
  }
};

const onDeathBehavior = {
  asteroid: (enemy) => {
    // Todo asteroide grande se divide em exatamente dois fragmentos.
    const enemyManager = useEnemyManager();
    const currentRun = useCurrentRunStore();
    const fragmentStats = normalAsteroidFragmentStats(enemy.room, currentRun.levelConfig?.chapter || 1);
    const miniasteroidCount = fragmentStats.count;

    // Calcula direção do player pro asteroid (direção em que ele estava vindo)
    const dirToPlayer = {
      x: currentRun.playerPosition.x - enemy.position.x,
      z: currentRun.playerPosition.z - enemy.position.z,
    };
    const length = Math.sqrt(dirToPlayer.x ** 2 + dirToPlayer.z ** 2) || 1;

    // Direção invertida (oposta ao movimento) - asteroids vão pra trás
    const baseDirection = {
      x: -dirToPlayer.x / length,
      z: -dirToPlayer.z / length,
    };

    for (let i = 0; i < miniasteroidCount; i++) {
      // Distribui em cone: ângulo varia de -60° a +60° dependendo do índice
      const coneAngle = ((i / (miniasteroidCount - 1 || 1)) - 0.5) * (Math.PI / 1.5); // -60° a +60°
      const speed = 4 + Math.random() * 2; // Velocidade entre 2 e 4

      // Adiciona um pequeno random extra ao ângulo pra não ficar muito uniforme
      const finalAngle = coneAngle + (Math.random() - 0.5) * 0.3; // ±0.15 rad de variação

      // Rotaciona a direção base pelo ângulo do cone
      const cos = Math.cos(finalAngle);
      const sin = Math.sin(finalAngle);
      const rotatedDirection = {
        x: baseDirection.x * cos - baseDirection.z * sin,
        z: baseDirection.x * sin + baseDirection.z * cos,
      };

      // Posição de spawn: forma um cone atrás do asteroid
      const coneDepth = 0.5 + Math.random() * 0.3; // Profundidade no cone (0.5-0.8)
      const coneWidth = Math.abs(finalAngle) * 1.5; // Largura proporcional ao ângulo

      const spawnPosition = {
        x: enemy.position.x + baseDirection.x * coneDepth + rotatedDirection.x * coneWidth,
        y: enemy.position.y,
        z: enemy.position.z + baseDirection.z * coneDepth + rotatedDirection.z * coneWidth,
      };

      enemyManager.spawnEnemy('miniasteroid', {
        position: spawnPosition,
        delay: 0,
        state: 'active', // Já spawna ativo
        overrides: {
          speed: speed,
          health: fragmentStats.health,
          maxHealth: fragmentStats.health,
          baseXP: fragmentStats.baseXP,
          fixedXP: false,
          room: enemy.room,
          isAsteroidFragment: true,
          direction: { ...rotatedDirection }, // Define direção inicial
        }
      });
    }
  },
  asteroidBoss: (enemy) => {
    const generation = enemy.asteroidGeneration || 0;
    if (generation >= 2) return;

    const enemyManager = useEnemyManager();
    const currentRun = useCurrentRunStore();

    // Calcula direção base (do asteroid pro player)
    const dirToPlayer = {
      x: currentRun.playerPosition.x - enemy.position.x,
      z: currentRun.playerPosition.z - enemy.position.z,
    };
    const length = Math.sqrt(dirToPlayer.x ** 2 + dirToPlayer.z ** 2) || 1;

    const baseDirection = {
      x: dirToPlayer.x / length,
      z: dirToPlayer.z / length,
    };

    for (let i = 0; i < 2; i++) {
      const angle = (i === 0) ? Math.PI / 6 : -Math.PI / 6; // 30° e -30° (spread menor)
      const speed = 2 + Math.random();
      const nextGeneration = generation + 1;
      const fragmentHealth = nextGeneration === 1 ? 700 : 250;
      const fragmentXP = nextGeneration === 1 ? 100 : 25;

      // Rotaciona a direção base pelo ângulo
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedDirection = {
        x: baseDirection.x * cos - baseDirection.z * sin,
        z: baseDirection.x * sin + baseDirection.z * cos,
      };

      // Spawna com uma pequena separação lateral
      const lateralOffset = 1.5 * (i === 0 ? 1 : -1);
      const spawnPosition = {
        x: enemy.position.x + lateralOffset * baseDirection.z,
        y: enemy.position.y,
        z: enemy.position.z - lateralOffset * baseDirection.x,
      };

      enemyManager.spawnEnemy('asteroidBoss', {
        position: spawnPosition,
        delay: 0,
        state: 'active',
        overrides: {
          speed: speed,
          health: fragmentHealth,
          maxHealth: fragmentHealth,
          baseXP: fragmentXP,
          fixedXP: true,
          asteroidGeneration: nextGeneration,
          room: 10,
          // Opcional: dar uma direção inicial levemente desviada
          initialDirection: { ...rotatedDirection },
        }
      });
    }
  },
  hiveBoss: (enemy) => dismissSummons(enemy),
  miniHive: (enemy) => dismissSummons(enemy),
  colossusBoss: (enemy) => dismissSummons(enemy),
}

// Os reforços chamados por um boss caem junto com ele
function dismissSummons(boss) {
  const enemyManager = useEnemyManager();
  enemyManager.activeEnemies.value
    .filter(enemy => enemy.summonerId === boss.id && enemy.state !== 'dying')
    .forEach(enemy => enemyManager.takeDamage(enemy.id, enemy.health, 'systemkill'));
}

// Lógica para gerenciar inimigos: spawn, atualização, remoção, etc.
export function useEnemyManager() {
  const enemyManagerStore = useEnemyManagerStore();
  const useCurrentRun = useCurrentRunStore();
  const { handleEvent } = useMissions();

  const { activeEnemies, killedEnemies } = storeToRefs(enemyManagerStore);

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

    // Efeitos elementais: ticks de queimadura e gelo que expira (cópia: mortes podem gerar fragmentos)
    for (const enemy of [...activeEnemies.value]) {
      if (enemy.state !== 'active' || !enemy.elementState) continue;
      const { burn, thaw } = tickElementState(enemy.elementState, delta);
      if (thaw > 0) {
        emitElementalFx({ kind: 'shatter', x: enemy.position.x, z: enemy.position.z, size: enemy.size || 1 });
        takeDamage(enemy.id, thaw, 'elemental', { text: 'freeze' });
      }
      if (burn > 0 && enemy.state === 'active') takeDamage(enemy.id, burn, 'elemental', { text: 'burn' });
    }

    // Remove inimigos que terminaram a animação de morte
    activeEnemies.value = activeEnemies.value.filter(enemy =>
      !(enemy.state === 'dying' && enemy.deathTimer <= 0)
    );
  };

  /**
   * Spawna um único inimigo
   * @param {string} enemyType - Tipo do inimigo (ex: 'asteroid', 'ufo')
   * @param {object} options - Opções de spawn
   * @param {object} options.position - Posição customizada { x, y, z } (padrão: aleatória)
   * @param {number} options.delay - Delay até ficar ativo em segundos (padrão: 1.5)
   * @param {string} options.state - Estado inicial (padrão: 'spawning')
   * @param {object} options.overrides - Propriedades para sobrescrever stats base
   * @returns {object} - O inimigo criado
   */
  const spawnEnemy = (enemyType, options = {}) => {
    const enemyStats = baseStats[enemyType];

    if (!enemyStats) {
      console.warn(`Enemy Manager: Unknown enemy type "${enemyType}"`);
      return null;
    }

    const {
      position = generateRandomSpawnPosition(),
      delay = 1.5,
      state = 'spawning',
      overrides = {},
    } = options;

    const room = playableRoomCount(useCurrentRun.levelConfig, useCurrentRun.currentStageIndex);
    const progress = roomProgress(room);
    const category = enemyCategory(enemyType);
    const exactBossHealth = enemyType === 'asteroidBoss' || enemyType === 'boss' || Boolean(enemyStats.exactStats);
    const chapter = useCurrentRun.levelConfig?.chapter || 1;
    const health = exactBossHealth ? enemyStats.health : scaledEnemyHealth(enemyStats.health, room, chapter);
    // Os bosses dos capítulos já têm valores próprios; os demais escalam com o capítulo
    const contactScale = enemyStats.exactStats ? 1 : chapterDamageMultiplier(chapter);
    const contact = Math.round(contactScale * (enemyType === 'kamikaze'
      ? 34 + 18 * progress
      : category === 'boss'
        ? 48 + 16 * progress
        : 22 + 14 * progress));
    // Crio um novo inimigo
    const newEnemy = {
      id: `${enemyType}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type: enemyType,
      position: { ...position },
      cooldownShot: enemyStats.cooldownTotalShot,
      state: state,
      spawnTimer: delay,
      totalSpawnTime: delay,
      spawnProgress: state === 'spawning' ? 0 : 1,
      ...enemyStats,
      room,
      health,
      maxHealth: health,
      onHitDamage: enemyType==='angel'?0:contact,
      ...overrides, // Permite sobrescrever qualquer propriedade
    };

    // Adiciono o inimigo à lista de inimigos ativos
    activeEnemies.value.push(newEnemy);

    return newEnemy;
  };

  const spawnEnemyWave = (waveConfig) => {
    // Spawna inimigos conforme a configuração da wave
    waveConfig.enemies.forEach(enemyGroup => {
      // Desestruturação para obter tipo, quantidade e delay
      const { enemyType, count, delay = 1.5 } = enemyGroup;

      // Spawna a quantidade especificada de inimigos do tipo dado
      for (let i = 0; i < count; i++) {
        spawnEnemy(enemyType, {
          delay: Math.max(.8, delay),
        });
      }
    });
  };

  const spawnAngel = () => {
    spawnEnemy('angel', {
      position: { x: 0, y: 0, z: -2 },
      delay: 0,
      state: 'angel',
    });
  };

  /**
   * Quando um inimigo toma dano
   */
  function takeDamage(enemyId, damage, type, options = {}) {
    // Lógica para aplicar dano ao inimigo
    const enemy = activeEnemies.value.find(e => e.id === enemyId);

    if (!enemy) {
      console.warn(`Enemy Manager: No enemy found with ID "${enemyId}" to take damage.`);
      return;
    }

    // Inimigos em spawning ou morrendo são invulneráveis
    if (enemy.state === 'spawning' || enemy.state === 'dying') {
      return;
    }

    // Blindagem/ponto fraco dos bosses (reator do Colosso)
    if (type === 'shot' && enemy.damageTakenMultiplier) {
      damage *= enemy.damageTakenMultiplier;
    }

    const equipmentEffects = useEquipmentEffectsStore();
    const playerDamage = PLAYER_DAMAGE_TYPES.includes(type);
    // O dano elemental já nasceu do golpe com os multiplicadores aplicados
    if (playerDamage && type !== 'elemental') damage *= equipmentEffects.damageMultiplierFor(enemy);
    // Base dos efeitos elementais: dano do golpe antes do crítico
    const elementalBase = damage;
    const playerStats = usePlayerStats();
    const hit = type === 'shot' && options.canCrit !== false
      ? outgoingHit(damage, playerStats.combatStats, Math.random, equipmentEffects.criticalBonusFor(enemyId))
      : { damage, critical: false };
    // Tiro Certeiro: elimina na hora inimigos que não são chefes (aparece como crítico)
    if (type === 'shot' && hit.damage < enemy.health && headshotKills(playerStats.headshotChance, enemyCategory(enemy.type, enemy))) {
      hit.damage = enemy.health;
      hit.critical = true;
    }
    // Congelado: dano de qualquer outra fonte quebra o gelo e causa a segunda parcela de dano bruto
    const shatter = enemy.elementState?.freeze && type !== 'systemkill' ? thawElementState(enemy.elementState) : 0;
    if (shatter > 0) emitElementalFx({ kind: 'shatter', x: enemy.position.x, z: enemy.position.z, size: enemy.size || 1 });
    if (options.shock) elementStateOf(enemy).shock = ELEMENT_RULES.lightning.shockTime;

    dealDamage(enemy, hit.damage, hit.critical ? 'critical' : (options.text || 'damage'), playerDamage);
    if (shatter > 0 && enemy.health > 0) dealDamage(enemy, shatter, 'freeze', playerDamage);
    if (options.elements && enemy.health > 0) applyElements(enemy, options.elements, elementalBase);
  }

  /** Aplica fogo, gelo e raio de um golpe já contabilizado. */
  function applyElements(enemy, payload, hitDamage) {
    const boss = enemyCategory(enemy.type, enemy) === 'boss';
    const result = applyElementalHit(elementStateOf(enemy), payload, hitDamage, { boss });
    if (result.lightning > 0) {
      const origin = { x: enemy.position.x, z: enemy.position.z };
      // Só o dano extra do raio passa adiante, de alvo em alvo, dentro do alcance da arma
      const hops = payload.lightning.chains > 0
        ? elementChainTargets(origin, activeEnemies.value.filter(e => e.state === 'active'), payload.lightning.range || 0, payload.lightning.chains, [enemy.id])
        : [];
      dealDamage(enemy, result.lightning, 'shock', true);
      emitElementalFx({ kind: 'chain', points: [origin, ...hops.map(target => ({ x: target.position.x, z: target.position.z }))] });
      for (const target of hops) takeDamage(target.id, result.lightning, 'elemental', { text: 'shock', shock: true });
    }
    if (result.froze && enemy.health > 0) {
      emitElementalFx({ kind: 'freeze', x: enemy.position.x, z: enemy.position.z, size: enemy.size || 1 });
      dealDamage(enemy, result.freezeDamage, 'freeze', true);
    }
  }

  /** Subtrai a vida, mostra o texto e resolve a morte (recompensas só para dano do jogador). */
  function dealDamage(enemy, damage, textType, playerDamage) {
    if (!(damage > 0) || enemy.state === 'dying') return;
    const enemyId = enemy.id;
    const direct = textType === 'damage' || textType === 'critical';
    enemy.health -= damage;
    // Ticks elementais não repetem a faísca de impacto, só a explosão final
    if (direct || enemy.health <= 0) emitImpact(enemy.position.x, enemy.position.z, enemy.health <= 0);

    // combat text
    useCombatTextStore().emitForTarget(
      enemyId,
      textType,
      Math.round(damage)
    );

    const onDeathBehaviorFunc = onDeathBehavior[enemy.type];

    // Se a saúde do inimigo chegar a zero ou menos, inicia animação de morte
    const randomPitch = 0.9 + Math.random() * 0.2; // Entre 0.9 e 1.1

    if (enemy.health <= 0) {
      enemy.state = 'dying';
      enemy.elementState = null;
      enemy.deathTimer = 0.8; // Duração da animação de morte (segundos)
      enemy.totalDeathTime = 0.8;
      enemy.deathProgress = 0;

      // Fragmentation is part of the enemy itself, independent of how it died.
      if (onDeathBehaviorFunc) {
        onDeathBehaviorFunc(enemy);
      }

      if (playerDamage) {
        // Reproduz som de inimigo morto
        useAudio().playSound(enemy.deathSound, 1, randomPitch);

        // Drop dos inimigos no chão
        const minGold = enemy.drops?.gold?.min || 0;
        const maxGold = enemy.drops?.gold?.max || 0;
        const goldDropped = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
        useCurrentRun.addGold(goldDropped);
        useHeartStore().tryDrop(enemy.position);

        const expDropped = enemy.fixedXP
          ? (enemy.baseXP || 0)
          : scaledEnemyExperience(enemy.baseXP || 0, enemy.room);
        useCurrentRun.addExp(expDropped);

        // Sifão: chance, por abate, de curar 5% da vida máxima
        const siphon = siphonHeal(usePlayerStats().siphonChance, useCurrentRun.maxHealth);
        if (siphon > 0) useCurrentRun.healPlayer(siphon);

        // Atualiza a contagem de inimigos mortos no run atual
        if (killedEnemies.value[enemy.type]) {
          killedEnemies.value[enemy.type] += 1;
        } else {
          killedEnemies.value[enemy.type] = 1;
        }

        console.log(`Enemy Manager: Enemy of type "${enemy.type}" killed. Total killed this run: ${killedEnemies.value[enemy.type]}`);
      }
    } else {
      if (playerDamage && direct) {
        // Reproduz som de hit suave
        useAudio().playSound(enemy.hitSound, 1, randomPitch);
      }
    }
  }

  function damageArea(position, radius, damage, excludedId = null, options = {}) {
    const targets = activeEnemies.value.filter(enemy => enemy.state === 'active' && enemy.id !== excludedId
      && Math.hypot(enemy.position.x - position.x, enemy.position.z - position.z) <= radius + enemy.size * .35);
    for (const enemy of targets) takeDamage(enemy.id, damage, 'shot', options);
    emitImpact(position.x, position.z, false, 'hit');
    return targets.length;
  }

  /**
   * Limpa os inimigos ativos (ex: ao desmontar o componente)
   */
  function cleanup() {
    activeEnemies.value = [];
    killedEnemies.value = {};
  }

  /**
   * Retorna uma posição aleatória para spawnar um inimigo.
   * Devemos escolher uma posição aleatória dentro dos limites do mapa.
   * O Y deve ser fixo (ex: 0) para manter os inimigos na mesma altura.
   * 
   * @returns { x: number, y: number, z: number }
   */
  function generateRandomSpawnPosition() {
    const player = useCurrentRun.getPlayerPosition();
    const angle = Math.random() * Math.PI * 2;
    const radius = 12 + Math.random() * 7;
    return { x: player.x + Math.cos(angle) * radius, y: 0, z: player.z + Math.sin(angle) * radius };
  }
  function missionsOnComplete() {
    const enemiesCount = Object.values(killedEnemies.value)
      .reduce((total, count) => total + count, 0);

    if (enemiesCount >= 0) {
      handleEvent('kill-enemies', enemiesCount);
    }
  }

  return {
    activeEnemies,
    takeDamage,
    damageArea,
    update,
    spawnEnemy,
    spawnEnemyWave,
    spawnAngel,
    cleanup,

    // missions
    missionsOnComplete,
  };
}

