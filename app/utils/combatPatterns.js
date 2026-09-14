// World-space formations: parallel shots retain their spacing throughout flight.
export function shotFormation(count) {
  return Array.from({ length: count }, (_, i) => {
    const side = (i - (count - 1) / 2) * .70;
    return { side, forward: .9 - (count > 2 ? Math.abs(side) * .7 : 0) };
  });
}

export function rotateShot(direction, angle) {
  return { x: direction.x * Math.cos(angle) - direction.z * Math.sin(angle),
    z: direction.x * Math.sin(angle) + direction.z * Math.cos(angle) };
}

export function muzzlePosition(position, direction, side, forward = .9) {
  return { x: position.x + direction.x * forward - direction.z * side,
    y: position.y || 0, z: position.z + direction.z * forward + direction.x * side };
}

// A return loop rejoins its launch lane behind the ship; never tracks a target.
export function advanceShot(projectile, distance) {
  if (projectile.rearTurn && projectile.rearTurn.traveled < (Math.PI + 3) * projectile.rearTurn.radius) {
    const turn = projectile.rearTurn;
    const length = (Math.PI + 3) * turn.radius;
    const arc = Math.min(distance, length - turn.traveled);
    turn.traveled += arc;
    const t = turn.traveled / length, theta = Math.PI * t;
    const lateral = turn.side * turn.radius * 2 * Math.sin(theta) ** 2;
    const forward = turn.radius * (Math.sin(theta) - 3 * t * t * (3 - 2 * t));
    projectile.position.x = turn.origin.x + turn.forward.x * forward - turn.forward.z * lateral;
    projectile.position.z = turn.origin.z + turn.forward.z * forward + turn.forward.x * lateral;
    const dx = turn.side * 4 * Math.PI * Math.sin(theta) * Math.cos(theta);
    const dz = Math.PI * Math.cos(theta) - 18 * t * (1 - t);
    const norm = Math.hypot(dx, dz);
    projectile.direction = { x: (turn.forward.x * dz - turn.forward.z * dx) / norm,
      z: (turn.forward.z * dz + turn.forward.x * dx) / norm };
    distance -= arc;
  }
  projectile.position.x += projectile.direction.x * distance;
  projectile.position.z += projectile.direction.z * distance;
}

export function segmentHit(start, end, target, radius) {
  const dx = end.x - start.x, dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((target.x-start.x)*dx+(target.z-start.z)*dz)/lengthSquared)) : 0;
  return (start.x+dx*t-target.x)**2+(start.z+dz*t-target.z)**2 <= radius*radius ? t : null;
}

export const PROJECTILE_IFRAME = .50;
// Raio do jogador contra projéteis inimigos (a Kestrel tem ~1,7 de envergadura e ~1,4 de comprimento no jogo)
export const PLAYER_HITBOX_RADIUS = .5;
export const COLLISION_IFRAME = .35;
export const ENEMY_VOLLEY_GATE = .25;
export const WAVE_REST = 1.25;

export function clampRoom(room = 2) {
  return Math.max(2, Math.min(20, room));
}
export function roomProgress(room = 2) {
  return (clampRoom(room) - 2) / 18;
}
export function hpMultiplier(room = 2) {
  return Number((1 + .02 * (clampRoom(room) - 2)).toFixed(2));
}
export function xpMultiplier(room = 2) {
  return Number((1 + .08 * (clampRoom(room) - 2)).toFixed(2));
}
// A cada capítulo os inimigos comuns aguentam mais e batem mais forte (os bosses têm valores próprios).
function clampChapter(chapter = 1) {
  return Math.max(1, Math.min(3, Number(chapter) || 1));
}
export function chapterHealthMultiplier(chapter = 1) {
  return Number((1 + .45 * (clampChapter(chapter) - 1)).toFixed(2));
}
export function chapterDamageMultiplier(chapter = 1) {
  return Number((1 + .25 * (clampChapter(chapter) - 1)).toFixed(2));
}
export function scaledEnemyHealth(baseHealth, room, chapter = 1) {
  return Number((baseHealth * hpMultiplier(room) * chapterHealthMultiplier(chapter)).toFixed(6));
}
export function scaledEnemyExperience(baseXP, room) {
  return Math.round(baseXP * xpMultiplier(room));
}
export function normalAsteroidFragmentStats(room, chapter = 1) {
  return { count: 2, health: Number((scaledEnemyHealth(90, room, chapter) * .70).toFixed(6)), baseXP: 5 };
}
export const ASTEROID_BOSS_STAGES = Object.freeze([
  Object.freeze({ generation: 0, count: 1, health: 2600, xp: 900 }),
  Object.freeze({ generation: 1, count: 2, health: 700, xp: 100 }),
  Object.freeze({ generation: 2, count: 4, health: 250, xp: 25 }),
]);
export function asteroidBossEffectiveHealth() {
  return ASTEROID_BOSS_STAGES.reduce((total, stage) => total + stage.count * stage.health, 0);
}
// Kept for compatibility with existing diagnostics. stageIndex is zero-based.
export function combatTier(stageIndex = 1) {
  return roomProgress(stageIndex + 1);
}
export function createIFrameGate(duration) {
  let remaining = 0;
  return {
    update(delta) { remaining = Math.max(0, remaining - delta); if (remaining < 1e-9) remaining = 0; },
    consume() { if (remaining > 0) return false; remaining = duration; return true; },
    reset() { remaining = 0; },
    get remaining() { return remaining; },
  };
}

export function enemyCategory(type, enemy = {}) {
  if (type === 'miniasteroid' || type === 'hiveDrone') return 'mini';
  if (type === 'ufofast' || type === 'torusEnemy' || type === 'compositeEnemy' || type === 'miniHive' || type === 'miniHarpy') return 'elite';
  if (type === 'asteroidBoss' && (enemy.asteroidGeneration || 0) > 0) return 'fragment';
  if (type === 'asteroidBoss' || type === 'miniboss' || type === 'boss') return 'boss';
  if (CHAPTER_BOSSES.includes(type)) return 'boss';
  return 'common';
}

// Faixa de distância em que um inimigo pode atirar no jogador
export const ENEMY_ATTACK_RANGE = Object.freeze({ min: 3, max: 19 });

/**
 * Pode começar/continuar a carga do tiro? Inimigos comuns só atiram visíveis na tela.
 * Bosses são grandes e ficam na borda em telas estreitas (celular em pé): usam só a distância,
 * senão a carga é cancelada toda vez que o centro sai da tela e eles quase não atiram.
 */
export function canAttackFrom(enemy, distance, onScreen) {
  if (distance < ENEMY_ATTACK_RANGE.min || distance > ENEMY_ATTACK_RANGE.max) return false;
  return onScreen || enemyCategory(enemy.type, enemy) === 'boss';
}

export function finalBossPhase(enemy = {}) {
  const ratio = enemy.maxHealth ? enemy.health / enemy.maxHealth : 1;
  return ratio > .70 ? 1 : ratio > .40 ? 2 : 3;
}

export function attackProfile(type, room = 2, volley = 0, enemy = {}) {
  if (CHAPTER_BOSSES.includes(type)) return chapterBossProfile(type, volley, enemy);
  if (type === 'miniHive') return miniHiveProfile(room);
  if (type === 'miniHarpy') return miniHarpyProfile(enemy);
  const progress = roomProgress(room);
  const generation = type === 'asteroidBoss' ? (enemy.asteroidGeneration || 0) : 0;
  if (generation === 1) {
    const pattern = volley % 2 ? 'fan' : 'ring';
    return { category:'fragment', pattern, projectile:pattern === 'ring' ? 'enemyOrb' : 'enemyPlasma',
      count:pattern === 'ring' ? 5 : 3, interval:2.70, charge:.7, speed:4.71, damage:20, range:25 };
  }
  if (generation >= 2) {
    return { category:'fragment', pattern:'aim', projectile:'enemyOrb', count:1,
      interval:3.20, charge:.7, speed:4.31, damage:18, range:25 };
  }
  if (type === 'boss') {
    const phase = finalBossPhase(enemy);
    const values = phase === 1 ? {interval:1.85,movementSpeed:1.10,speed:6.20}
      : phase === 2 ? {interval:1.65,movementSpeed:1.25,speed:6.60}
      : {interval:1.45,movementSpeed:1.40,speed:6.90};
    const pattern = volley % 2 ? 'fan' : 'ring';
    return { category:'boss', phase, pattern, projectile:pattern === 'ring' ? 'enemyOrb' : 'enemyPlasma',
      count:pattern === 'ring' ? 10 : 5, charge:.9, damage:32, range:25, ...values };
  }
  const category = enemyCategory(type, enemy);
  const boss = category === 'boss';
  const pattern = boss ? (volley % 2 ? 'fan' : 'ring')
    : type === 'asteroid' || type === 'torusEnemy' ? 'ring'
    : type === 'ufofast' || type === 'compositeEnemy' ? 'fan'
    : 'aim';
  const projectile = pattern === 'ring' ? 'enemyOrb'
    : type === 'ufofast' && volley % 3 === 2 ? 'enemyMissile'
    : type === 'ufo' || type === 'ufofast' || boss || type === 'compositeEnemy' ? 'enemyPlasma' : 'enemyOrb';
  const intervalBase={mini:3.60,common:3.05,elite:2.85,boss:2.55}[category];
  const intervalDrop={mini:.90,common:.85,elite:.80,boss:.70}[category];
  const damageBase={mini:12,common:14,elite:16,boss:22}[category];
  const speedBase={mini:3.4,common:3.6,elite:4.0,boss:4.6}[category];
  const speedGrowth={mini:1.4,common:1.6,elite:1.6,boss:1.6}[category];
  return { category, pattern, projectile,
    count: pattern === 'ring' ? (boss ? 10 : 5) : pattern === 'fan' ? (boss ? 5 : 3) : 1,
    interval: intervalBase - intervalDrop * progress,
    speed: speedBase + speedGrowth * progress,
    damage: Math.round(damageBase + 10 * progress),
    charge: boss ? .9 : .7, range: 25 };
}

export function attackDirections(profile, aim, volley) {
  const angle = Math.atan2(aim.z, aim.x);
  return Array.from({ length: profile.count }, (_, i) => {
    let offset = 0;
    if (profile.pattern === 'ring') offset = Math.PI*2*(i+.5)/profile.count + volley*.23;
    else if (profile.pattern === 'fan') offset = (i-(profile.count-1)/2)*(profile.spread ?? .28);
    // Braços igualmente espaçados que avançam a cada rajada
    else if (profile.pattern === 'spiral') offset = Math.PI*2*i/profile.count + volley*(profile.twist ?? .32);
    // Metade para cada lado, perpendicular à mira
    else if (profile.pattern === 'broadside') {
      const half = Math.ceil(profile.count/2), left = i < half;
      const k = left ? i : i - half, n = left ? half : profile.count - half;
      offset = (left ? 1 : -1)*Math.PI/2 + (k-(n-1)/2)*(profile.spread ?? .22);
    }
    return { x: Math.cos(angle+offset), z: Math.sin(angle+offset) };
  });
}

// ==================== BOSSES DOS CAPÍTULOS 2 E 3 ====================
export const CHAPTER_BOSSES = Object.freeze(['hiveBoss', 'harpyBoss', 'bastionBoss', 'colossusBoss']);

const bossShot = (pattern, projectile, count, values) => ({ category: 'boss', pattern, projectile, count, range: 25, ...values });

// As duas saídas na proa da Colmeia (em múltiplos do tamanho do inimigo; mesmas posições de buildHive)
export const HIVE_MUZZLES = Object.freeze([Object.freeze({ side: -.32, forward: 1.14 }), Object.freeze({ side: .32, forward: 1.14 })]);
// lockLead: acompanha o jogador durante a carga e só trava a mira esse tempo antes do disparo.
// recoil: depois de disparar, a Colmeia fica parada apontando para onde atirou (grace period).
export const HIVE_HUNT_SHOT = Object.freeze({ interval: 1.8, charge: .7, lockLead: .12, speed: 18, damage: 40, range: 34, recoil: .9 });
// Torreta: recarga, 3 tiros seguidos (sem a trava global entre rajadas) e recarrega de novo
export const HIVE_TURRET_SALVO = Object.freeze({ volleys: 3, windUp: 1, followUpCharge: .05, gap: .1, cooldown: .5, lockLead: .12, speed: 28, damage: 60, range: 36, recoil: .5 });

// Canhões nas pontas das asas da Harpia (buildHarpy) e a rajada que ela dispara parada
export const HARPY_WING_GUNS = Object.freeze([Object.freeze({ side: -1.12, forward: .41 }), Object.freeze({ side: 1.12, forward: .41 })]);
// A Harpia é o boss final do capítulo: seu tiro é um pouco mais rápido que o mais rápido da Colmeia
export const HARPY_SHOT_SPEED = HIVE_TURRET_SALVO.speed + 4;
// Cada tiro que acerta pesa muito (150–200); o i-frame de projétil (0,5 s) limita a rajada a ~2 hits por segundo
export const HARPY_GLIDE_SHOT = Object.freeze({ charge: .5, lockLead: .12, speed: HARPY_SHOT_SPEED, damage: 180, range: 30 });
export const HARPY_BURST_SHOT = Object.freeze({ interval: .32, charge: .12, lockLead: .06, speed: HARPY_SHOT_SPEED, damage: 160, range: 30 });

/** Mini-harpia: mesmos tiros da Harpia (planando e rajada pelas asas), mais lentos e fracos. */
export const MINI_HARPY_SHOT = Object.freeze({ speed: 18, damage: 14, range: 26, glideInterval: 2.8, burstInterval: .38 });
export function miniHarpyProfile(enemy = {}) {
  const { speed, damage, range, glideInterval, burstInterval } = MINI_HARPY_SHOT;
  const shot = { category: 'elite', pattern: 'aim', projectile: 'harpyShot', count: 1, speed, damage, range };
  return enemy.harpyMode === 'burst'
    ? { ...shot, burst: true, interval: burstInterval, charge: .12, lockLead: .06, muzzles: HARPY_WING_GUNS, converge: true }
    : { ...shot, interval: glideInterval, charge: .5, lockLead: .12 };
}

/** Mini-colmeia: mesma rajada dupla, mais fraca, escalando com a sala. */
export function miniHiveProfile(room = 2) {
  const progress = roomProgress(room);
  return { category: 'elite', pattern: 'aim', projectile: 'hiveShot', count: 1, muzzles: HIVE_MUZZLES, converge: true, lockLead: .12,
    interval: 2.6 - .4 * progress, charge: .7, speed: 12 + 1.5 * progress, damage: Math.round(18 + 8 * progress), range: 30, recoil: .7 };
}

/** Rajadas de cada boss; dependem do estado que a IA escreve no inimigo (hangar, vida, fase). */
export function chapterBossProfile(type, volley = 0, enemy = {}) {
  if (type === 'hiveBoss') {
    // Pelas duas saídas da proa, convergindo no jogador (sem ponto cego entre as balas)
    const aimed = { muzzles: HIVE_MUZZLES, converge: true };
    if (enemy.hiveMode !== 'turret') return bossShot('aim', 'hiveShot', 1, { ...HIVE_HUNT_SHOT, ...aimed });
    // Torreta: `interval - charge` é a espera até a próxima carga começar
    const { volleys, windUp, followUpCharge, gap, cooldown, speed, damage, range, recoil, lockLead } = HIVE_TURRET_SALVO;
    const step = volley % volleys;
    const charge = step === 0 ? windUp : followUpCharge;
    return bossShot('aim', 'enemyLance', 1, {
      ...aimed, speed, damage, range, recoil, lockLead, charge, salvoStep: step,
      ignoreVolleyGate: step > 0,
      interval: step === volleys - 1 ? cooldown + charge : charge + gap,
    });
  }
  if (type === 'bastionBoss') {
    const enraged = enemy.maxHealth ? enemy.health / enemy.maxHealth <= .5 : false;
    const timing = { interval: enraged ? .9 : 1.15, charge: .35, enraged };
    return volley % 4 === 3
      ? bossShot('fan', 'enemyPlasma', 3, { ...timing, speed: 5.6, damage: 26 })
      : bossShot('spiral', 'enemyOrb', enraged ? 6 : 4, { ...timing, speed: 4.4, damage: 18, twist: .38 });
  }
  const phase = finalBossPhase(enemy);
  if (type === 'harpyBoss') {
    // Parada: disparos rápidos e seguidos pelos canhões das asas, convergindo no jogador
    if (enemy.harpyMode === 'burst') {
      return bossShot('aim', 'harpyShot', 1, { ...HARPY_BURST_SHOT, phase, burst: true, muzzles: HARPY_WING_GUNS, converge: true });
    }
    // Planando: um tiro de vez em quando
    return bossShot('aim', 'harpyShot', 1, { ...HARPY_GLIDE_SHOT, phase, interval: phase === 3 ? 1.9 : 2.4 });
  }
  // Colosso: baterias em leque, bordada na fase 2 e espiral do reator na fase 3
  if (phase === 1) {
    const timing = { phase, interval: 1.8, charge: .9, speed: 6, damage: 34 };
    return volley % 2
      ? bossShot('fan', 'enemyMissile', 3, { ...timing, spread: .12 })
      : bossShot('fan', 'enemyPlasma', 6, { ...timing, spread: .2 });
  }
  if (phase === 2) {
    const timing = { phase, interval: 1.6, charge: .85, speed: 6.4, damage: 36 };
    return volley % 2
      ? bossShot('broadside', 'enemyPlasma', 12, { ...timing, spread: .18 })
      : bossShot('fan', 'enemyPlasma', 5, timing);
  }
  return volley % 2
    ? bossShot('fan', 'enemyMissile', 3, { phase, interval: 1.1, charge: .6, speed: 7, damage: 38, spread: .3 })
    : bossShot('spiral', 'enemyOrb', 6, { phase, interval: 1.1, charge: .6, speed: 5.4, damage: 28, twist: .45 });
}

// Quatro placas de ±0,42 rad no anel do Bastião. shieldRotation é a rotação do anel no mundo (eixo Y).
export const BASTION_SHIELD_HALF_ARC = .42;
export function bastionShieldBlocks(enemy, point) {
  if (enemy?.type !== 'bastionBoss' || typeof enemy.shieldRotation !== 'number') return false;
  const angle = Math.atan2(point.z - enemy.position.z, point.x - enemy.position.x);
  for (let i = 0; i < 4; i++) {
    const diff = angle - (i * Math.PI / 2 - enemy.shieldRotation);
    if (Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff))) < BASTION_SHIELD_HALF_ARC) return true;
  }
  return false;
}
