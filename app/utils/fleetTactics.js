// Specializations retain their encounter's health/EXP budget and combat tier.
export const FLEET_SPECIALIZATIONS = Object.freeze(['sniper', 'skirmisher', 'broadside', 'spiral']);
export const SPECIALIST_BASES = Object.freeze(['ufo', 'ufofast', 'torusEnemy', 'compositeEnemy']);

export function specializeEncounter(waves, chapter, room) {
  return waves.map((wave, waveIndex) => {
    let slot = 0;
    return { ...wave, enemies: wave.enemies.map(group => {
      if (!SPECIALIST_BASES.includes(group.enemyType)) return { ...group };
      const index = slot++;
      // One leading specialty per encounter; escorts rotate through the original fleet.
      if (index > 0 && (room + index + waveIndex) % 3 === 0) return { ...group };
      const fleetRole = FLEET_SPECIALIZATIONS[(room + chapter + waveIndex * 2 + index) % 4];
      return { ...group, fleetRole, visualModel: `c${chapter}_${fleetRole}` };
    }) };
  });
}

export function specialistProfile(role, volley, room) {
  const p = Math.max(0, Math.min(1, (room - 1) / 19));
  const common = { category: 'elite', projectile: 'enemyPlasma', range: 25 };
  if (role === 'sniper') return { ...common, pattern: 'aim', count: 1, interval: 4.2,
    charge: 1.25, lockLead: .45, speed: 9 + p * 2, telegraph: true, recoil: .35 };
  if (role === 'skirmisher') return { ...common, pattern: 'aim', count: 1,
    interval: volley % 3 === 2 ? 3.3 : .62, charge: volley % 3 === 0 ? .65 : .25,
    lockLead: .2, speed: 5.5 + p, recoil: .15 };
  if (role === 'broadside') return { ...common, pattern: 'broadside', count: 4,
    interval: 3.8, charge: 1, speed: 4.5 + p, spread: .12, recoil: .3 };
  if (role === 'spiral') return { ...common, projectile: 'enemyOrb', pattern: 'spiral', count: 3,
    interval: 2.9, charge: .9, speed: 3.8 + p, twist: .42 };
  return null;
}

export function moveSpecialist(enemy, player, dt) {
  if (!FLEET_SPECIALIZATIONS.includes(enemy.fleetRole)) return false;
  if (enemy.recoilTimer > 0) { enemy.recoilTimer = Math.max(0, enemy.recoilTimer - dt); return true; }
  const dx = player.x - enemy.position.x, dz = player.z - enemy.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < .001) return true;
  const role = enemy.fleetRole;
  enemy.tacticTime = (enemy.tacticTime || 0) + dt;
  let radial = 0, strafe = 0, speed = enemy.speed;
  if (role === 'sniper') {
    radial = distance > 13 ? 1 : distance < 9 ? -1 : 0;
    if (enemy.attackClock?.charging) radial = 0;
    speed *= .75;
  } else if (role === 'skirmisher') {
    const retreat = (enemy.attackClock?.volley || 0) > 0 && enemy.attackClock.volley % 3 === 0;
    radial = distance > 9 ? 1 : retreat && distance < 10 ? -1 : distance < 5 ? -1 : .25;
    strafe = .55; speed *= 1.15;
  } else if (role === 'broadside') {
    radial = distance > 10 ? 1 : distance < 6 ? -1 : 0;
    strafe = enemy.attackClock?.charging ? 0 : .45; speed *= .65;
  } else {
    radial = distance > 9 ? 1 : distance < 6 ? -1 : 0;
    strafe = .8;
  }
  const scale = speed * dt / distance / Math.max(1, Math.hypot(radial, strafe));
  enemy.position.x += (dx * radial - dz * strafe) * scale;
  enemy.position.z += (dz * radial + dx * strafe) * scale;
  return true;
}
