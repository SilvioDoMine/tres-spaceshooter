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
export function scaledEnemyHealth(baseHealth, room) {
  return Number((baseHealth * hpMultiplier(room)).toFixed(6));
}
export function scaledEnemyExperience(baseXP, room) {
  return Math.round(baseXP * xpMultiplier(room));
}
export function normalAsteroidFragmentStats(room) {
  return { count: 2, health: Number((scaledEnemyHealth(90, room) * .70).toFixed(6)), baseXP: 5 };
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
  if (type === 'miniasteroid') return 'mini';
  if (type === 'ufofast' || type === 'torusEnemy' || type === 'compositeEnemy') return 'elite';
  if (type === 'asteroidBoss' && (enemy.asteroidGeneration || 0) > 0) return 'fragment';
  if (type === 'asteroidBoss' || type === 'miniboss' || type === 'boss') return 'boss';
  return 'common';
}

export function finalBossPhase(enemy = {}) {
  const ratio = enemy.maxHealth ? enemy.health / enemy.maxHealth : 1;
  return ratio > .70 ? 1 : ratio > .40 ? 2 : 3;
}

export function attackProfile(type, room = 2, volley = 0, enemy = {}) {
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
    const offset = profile.pattern === 'ring' ? Math.PI*2*(i+.5)/profile.count + volley*.23
      : profile.pattern === 'fan' ? (i-(profile.count-1)/2)*.28 : 0;
    return { x: Math.cos(angle+offset), z: Math.sin(angle+offset) };
  });
}
