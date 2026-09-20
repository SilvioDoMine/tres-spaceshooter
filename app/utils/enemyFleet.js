import { ENEMY_FLEET } from '../data/enemyFleetCatalog.js';
export { ENEMY_FLEET } from '../data/enemyFleetCatalog.js';

export function fleetScale(enemy) {
  return enemy.visualScale ?? enemy.size ?? 1;
}

const wrapAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

/** Para onde o casco *deveria* estar virado agora. O rumo aplicado é o suavizado. */
export function fleetHeadingTarget(enemy, player) {
  if (enemy.beamLock?.remaining > 0) return enemy.beamLock.yaw;
  if (enemy.fleetRecoil > 0) return enemy.firedYaw;
  const clock = enemy.attackClock;
  const aim = clock?.charging && clock.aim;
  if (!aim) return enemy.visualHeading ?? Math.atan2(enemy.position.x - player.x, enemy.position.z - player.z);
  const nose = Math.atan2(-aim.x, -aim.z);
  // Bordada: os canhões ficam nos flancos, então é o bordo que precisa encarar
  // o alvo. Apontando o nariz, a salva saía de través enquanto a proa mirava.
  if (clock.profile?.pattern === 'broadside') return nose + (clock.broadsideSide ?? 1) * Math.PI / 2;
  return nose;
}

export function fleetHeading(enemy, player) {
  return enemy.fleetYaw ?? fleetHeadingTarget(enemy, player);
}

/** Gira o casco até o rumo alvo a uma taxa limitada, para a manobra ser lida
 *  como manobra. Visual e disparo leem o mesmo `fleetYaw`, então a salva nunca
 *  sai de um ângulo que o modelo não está mostrando. */
export function advanceFleetHeading(enemy, player, delta) {
  const target = fleetHeadingTarget(enemy, player);
  const current = enemy.fleetYaw;
  if (current === undefined || !Number.isFinite(current)) { enemy.fleetYaw = target; return target; }
  // Trava instantânea enquanto o feixe queima: aí o rumo é resultado, não meta.
  if (enemy.beamLock?.remaining > 0) { enemy.fleetYaw = target; return target; }
  const turn = enemy.attackClock?.charging ? 3.4 : 2.2;
  enemy.fleetYaw = current + wrapAngle(target - current) * Math.min(1, delta * turn);
  return enemy.fleetYaw;
}

export function fleetRotorAngle(enemy, profile, volley) {
  // Na varredura o emissor avança uma fração do vão entre bocas a cada passo,
  // de modo que os passos somados fechem o círculo — é isso que vira espiral.
  if (profile.sweep) {
    const arc = (Math.PI * 2) / profile.count;
    return -(profile.sweepStep / profile.sweepSteps) * arc - Math.floor(volley / profile.sweepSteps) * .21;
  }
  return profile.pattern === 'ring' ? -(Math.PI / profile.count + volley * .23) : 0;
}

const radialGroup = name => ['radial_emitter', 'ring_rotor', 'radial_rotor'].includes(name);
export function fleetSocketWorld(enemy, socket, yaw, rotor = 0) {
  const localYaw = radialGroup(socket.group) ? rotor : 0;
  const angle = yaw + localYaw, c = Math.cos(angle), s = Math.sin(angle);
  const [x, y, z] = socket.position, [dx, , dz] = socket.direction;
  const scale = fleetScale(enemy);
  const norm = Math.hypot(dx, dz) || 1;
  return { role: socket.role,
    origin: { x: enemy.position.x + (c * x + s * z) * scale,
      y: (enemy.position.y || 0) + y * scale, z: enemy.position.z + (-s * x + c * z) * scale },
    direction: { x: (c * dx + s * dz) / norm, z: (-s * dx + c * dz) / norm } };
}

/** One physical exit per projectile. Never multiply a fan by every muzzle. */
export function fleetSockets(type, profile, enemy = {}) {
  const sockets = ENEMY_FLEET[type]?.sockets ?? [];
  let selected;
  if (type === 'chapter4Boss') {
    const prefix = profile.beam ? 'muzzle_siege_beam' : profile.projectile === 'enemyMissile' ? 'muzzle_missile_' : 'muzzle_broadside_';
    selected = sockets.filter(s => s.role.startsWith(prefix));
  } else if (type === 'chapter5Boss' && profile.beam) {
    selected = sockets.filter(s => s.role.startsWith('muzzle_beam_'));
  } else if (type === 'miniHive') {
    selected = sockets.filter(s => s.role.startsWith('muzzle_hive_'));
  } else if (type === 'miniHarpy') {
    selected = sockets.filter(s => profile.burst ? s.role.startsWith('muzzle_wing_') : s.role === 'muzzle_glide');
  } else if (profile.pattern === 'ring') {
    selected = sockets.filter(s => /^muzzle_(ring|radial)_/.test(s.role));
    selected.sort((a, b) => Number(a.role.split('_').at(-1)) - Number(b.role.split('_').at(-1)));
    if (selected.length > profile.count) selected = selected.filter((_, i) => i % (selected.length / profile.count) === 0);
  } else if (profile.pattern === 'fan') {
    selected = sockets.filter(s => s.role.startsWith('muzzle_fan_')).sort((a, b) => a.position[0] - b.position[0]);
    if (selected.length > profile.count) selected = selected.slice((selected.length - profile.count) / 2, (selected.length + profile.count) / 2);
  } else {
    // The terminal Geode uses its real centre barrel, also visible in the small fragment.
    selected = sockets.filter(s => s.role === (type === 'asteroidBoss' && enemy.asteroidGeneration >= 2 ? 'muzzle_fan_2' : 'muzzle_front'));
  }
  return selected;
}

export function fleetSalvo(enemy, profile, volley, player) {
  if (!ENEMY_FLEET[enemy.type]) return null;
  const yaw = fleetHeading(enemy, player);
  const rotor = fleetRotorAngle(enemy, profile, volley);
  return fleetSockets(enemy.type, profile, enemy).map(socket => {
    const shot = fleetSocketWorld(enemy, socket, yaw, rotor);
    // Paired forward guns converge gently; the rest follow the actual barrel axes.
    if (profile.converge) {
      const target = enemy.attackClock?.target ?? player;
      const dx = target.x - shot.origin.x, dz = target.z - shot.origin.z, d = Math.hypot(dx, dz);
      if (d > .001 && (dx * shot.direction.x + dz * shot.direction.z) / d > .5) shot.direction = { x: dx / d, z: dz / d };
    }
    return shot;
  });
}
