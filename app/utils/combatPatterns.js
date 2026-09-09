// World-space formations: parallel shots retain their spacing throughout flight.
export function shotFormation(count) {
  return Array.from({ length: count }, (_, i) => {
    const side = (i - (count - 1) / 2) * .48;
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

// Stage progression is finite and capped; no health/damage runaway.
export function combatTier(stageIndex = 0, stageCount = 22) {
  return Math.max(0, Math.min(1, stageIndex / Math.max(1, stageCount - 1)));
}

export function attackProfile(type, tier, volley = 0) {
  const boss = /boss/i.test(type);
  const pattern = boss ? (volley % 2 ? 'fan' : 'ring')
    : type === 'asteroid' || type === 'torusEnemy' ? 'ring'
    : type === 'ufofast' || type === 'compositeEnemy' ? 'fan'
    : 'aim';
  const projectile = pattern === 'ring' ? 'enemyOrb'
    : type === 'ufofast' && volley % 3 === 2 ? 'enemyMissile'
    : type === 'ufo' || type === 'ufofast' || boss || type === 'compositeEnemy' ? 'enemyPlasma' : 'enemyOrb';
  return { pattern, projectile, count: pattern === 'ring' ? (boss ? 10 : 5) : pattern === 'fan' ? (boss ? 5 : 3) : 1,
    speed: (boss ? 4.4 : 3.4) + tier * 1.4,
    damage: Math.round((boss ? 24 : 14) + tier * 12),
    cooldown: (boss ? 2.4 : type === 'miniasteroid' ? 3.8 : 3.1) - tier * .55,
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
