import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import * as patterns from '../app/utils/combatPatterns.js';
import { CHAPTER_COUNT, CHAPTER_INFO, LEVELS } from '../app/games/levels/index.js';
import { completeChapter, emptyChapterProgress, playChapter, sanitizeChapterProgress } from '../app/utils/chapterProgress.js';
import { playableRoomCount } from '../app/utils/progression.js';
import {
  BASTION_SHIELD_HALF_ARC, CHAPTER_BOSSES, HIVE_HUNT_SHOT, HIVE_MUZZLES, HIVE_TURRET_SALVO, attackDirections, attackProfile,
  PLAYER_HITBOX_RADIUS, bastionShieldBlocks, chapterHealthMultiplier, enemyCategory, muzzlePosition,
  normalAsteroidFragmentStats, scaledEnemyHealth,
} from '../app/utils/combatPatterns.js';
import { HARPY, HIVE, HIVE_DRONE, MINI_HARPY, MINI_HIVE, createBossBehaviors } from '../app/utils/bossBehaviors.js';

const KNOWN_ENEMIES = new Set(['miniasteroid', 'asteroid', 'asteroidBoss', 'ufo', 'ufofast', 'kamikaze', 'miniboss', 'boss',
  'torusEnemy', 'compositeEnemy', 'miniHive', 'miniHarpy', ...CHAPTER_BOSSES]);
const BOSSES = { 1: ['asteroidBoss', 'boss'], 2: ['hiveBoss', 'harpyBoss'], 3: ['bastionBoss', 'colossusBoss'] };
const roomsOf = level => level.stages.filter(stage => stage.type !== 'intro');
const typesIn = stage => stage.waves.flatMap(w => w.enemies.map(g => g.enemyType));

test('three quick chapters preserve bosses and original combat tiers', () => {
  assert.equal(CHAPTER_COUNT, 3);
  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter++) {
    const level = LEVELS[chapter];
    assert.equal(level.chapter, chapter);
    assert.ok(CHAPTER_INFO[chapter]?.boss);
    assert.equal(level.stages[0].type, 'intro');
    assert.equal(playableRoomCount(level), [35, 38, 40][chapter - 1]);
    const rooms = roomsOf(level);
    rooms.forEach((stage, i) => {
      assert.equal(stage.type, stage.combatTier === 10 || stage.combatTier === 20 ? 'boss' : 'combat', `chapter ${chapter} room ${i + 1}`);
      typesIn(stage).forEach(type => assert.ok(KNOWN_ENEMIES.has(type), type));
    });
    assert.deepEqual(rooms.filter(s => s.type === 'boss').map(stage => stage.waves[0].enemies[0].enemyType), BOSSES[chapter]);
  }
  assert.ok(LEVELS[1].rewardExperience < LEVELS[2].rewardExperience && LEVELS[2].rewardExperience < LEVELS[3].rewardExperience);
});

test('mini-hive only shows up after the Hive has been beaten', () => {
  const appearances = level => roomsOf(level).map((stage, i) => typesIn(stage).includes('miniHive') ? i + 1 : null).filter(Boolean);
  assert.deepEqual(appearances(LEVELS[1]), []);
  const chapterTwo = appearances(LEVELS[2]);
  assert.ok(chapterTwo.length >= 4 && chapterTwo.every(room => room > roomsOf(LEVELS[2]).findIndex(s => s.type === 'boss') + 1));
  assert.ok(appearances(LEVELS[3]).length >= 4);
  assert.equal(enemyCategory('miniHive'), 'elite');
  assert.equal(enemyCategory('hiveDrone'), 'mini');
});

test('after the Harpy, chapter 3 fields every enemy met so far, including mini-hives and mini-harpies', () => {
  const roster = level => new Set(roomsOf(level).filter(stage => stage.type !== 'boss').flatMap(typesIn));
  const earlier = new Set([...roster(LEVELS[1]), ...roster(LEVELS[2])]);
  const chapterThree = roster(LEVELS[3]);
  for (const type of [...earlier, 'miniHive', 'miniHarpy']) assert.ok(chapterThree.has(type), `chapter 3 is missing ${type}`);
  assert.ok(!roster(LEVELS[1]).has('miniHarpy') && !roster(LEVELS[2]).has('miniHarpy'), 'mini-harpy only after the Harpy');
  assert.equal(enemyCategory('miniHarpy'), 'elite');
});

test('mini-harpy flies the Harpy loop with a shorter burst, a smaller dash and weaker shots', () => {
  const mini = { id: 'mh', type: 'miniHarpy', position: { x: 0, z: -8 }, speed: 1.2, size: 1.3, health: 100, maxHealth: 100, onHitDamage: 20 };
  const { behaviors, contacts } = bossHarness(mini);
  const modes = [];
  for (let t = 0, frame = 0; t < 25; t += .02, frame++) {
    behaviors.miniHarpy(mini, .02);
    if (modes.at(-1) !== mini.harpyMode) modes.push(mini.harpyMode);
    if (mini.harpyMode === 'burst' && frame % 10 === 0) mini.attackClock.volley += 1;
  }
  assert.deepEqual(modes.slice(0, 11), ['glide', 'turn', 'settle', 'burst', 'rest', 'glide', 'turn', 'settle', 'charge', 'dash', 'recover']);
  assert.ok(contacts.includes('dash'), 'the dash runs over the player');
  assert.ok(MINI_HARPY.dashLength < HARPY.dashLength && MINI_HARPY.dashHitRadius < HARPY.dashHitRadius);
  assert.ok(MINI_HARPY.burstShots[0] < HARPY.burstShots[0] && MINI_HARPY.glideSpeed < HARPY.glideSpeed);

  const glide = attackProfile('miniHarpy', 12, 0, { harpyMode: 'glide' });
  const burst = attackProfile('miniHarpy', 12, 0, { harpyMode: 'burst' });
  const bossGlide = attackProfile('harpyBoss', 20, 0, { harpyMode: 'glide' });
  assert.ok([glide, burst].every(p => p.projectile === 'harpyShot' && p.speed < bossGlide.speed));
  assert.ok(burst.converge && burst.muzzles.length === 2 && burst.burst);
});

test('chapter progress unlocks the next chapter and survives bad data', () => {
  assert.deepEqual(emptyChapterProgress(), { maxUnlocked: 1, completed: [], lastPlayed: 1 });
  let progress = completeChapter(emptyChapterProgress(), 1, 3);
  assert.deepEqual(progress, { maxUnlocked: 2, completed: [1], lastPlayed: 2 });
  progress = completeChapter(progress, 1, 3);
  assert.deepEqual(progress, { maxUnlocked: 2, completed: [1], lastPlayed: 1 });
  progress = completeChapter(completeChapter(progress, 2, 3), 3, 3);
  assert.deepEqual(progress, { maxUnlocked: 3, completed: [1, 2, 3], lastPlayed: 3 });
  assert.deepEqual(sanitizeChapterProgress({ maxUnlocked: 'x', completed: [9, -1, '2', 2] }, 3), { maxUnlocked: 3, completed: [2], lastPlayed: 3 });
  assert.deepEqual(sanitizeChapterProgress(null, 3), { maxUnlocked: 1, completed: [], lastPlayed: 1 });
  assert.equal(sanitizeChapterProgress({ maxUnlocked: 99 }, 3).maxUnlocked, 3);
});

test('lobby reopens on the last chapter played, or on a newly unlocked one', () => {
  // Capítulos 2 e 3 liberados, joga o 2: perdendo ou vencendo (sem liberar nada novo), fica no 2
  let progress = sanitizeChapterProgress({ maxUnlocked: 3, completed: [1, 2] }, 3);
  progress = playChapter(progress, 2, 3);
  assert.equal(progress.lastPlayed, 2);
  assert.equal(completeChapter(progress, 2, 3).lastPlayed, 2);
  // Vencer o capítulo mais alto libera um novo: vai para ele
  progress = playChapter(sanitizeChapterProgress({ maxUnlocked: 2, completed: [1] }, 3), 2, 3);
  assert.equal(completeChapter(progress, 2, 3).lastPlayed, 3);
  // Voltar ao 1 e vencê-lo não mexe no liberado nem pula de capítulo
  assert.equal(completeChapter(playChapter(progress, 1, 3), 1, 3).lastPlayed, 1);
  // Nunca aponta para um capítulo bloqueado
  assert.equal(sanitizeChapterProgress({ maxUnlocked: 2, lastPlayed: 3 }, 3).lastPlayed, 2);
});

test('chapter scaling leaves chapter 1 untouched and grows afterwards', () => {
  assert.deepEqual([1, 2, 3].map(chapterHealthMultiplier), [1, 1.45, 1.9]);
  assert.equal(scaledEnemyHealth(500, 16), 640);
  assert.equal(scaledEnemyHealth(500, 16, 2), 928);
  assert.deepEqual(normalAsteroidFragmentStats(2, 3), { count: 2, health: 119.7, baseXP: 5 });
});

test('chapter bosses are boss category with bounded, well-formed volleys', () => {
  const states = [
    { health: 100, maxHealth: 100 }, { health: 60, maxHealth: 100 }, { health: 30, maxHealth: 100 },
    { health: 100, maxHealth: 100, hiveMode: 'turret' }, { health: 30, maxHealth: 100, harpyMode: 'burst' },
  ];
  for (const type of CHAPTER_BOSSES) {
    assert.equal(enemyCategory(type), 'boss');
    for (const enemy of states) for (let volley = 0; volley < 6; volley++) {
      const p = attackProfile(type, 10, volley, enemy);
      assert.ok(p.count >= 1 && p.count <= 12, `${type} count`);
      assert.ok(p.charge < p.interval, `${type} telegraph fits the interval`);
      // Exceções propositais: a lança da Colmeia (rápida e letal) e a rajada seguida da Harpia
      if (type !== 'hiveBoss' && type !== 'harpyBoss') assert.ok(p.interval >= .9 && p.speed <= 7, `${type} timing`);
      const directions = attackDirections(p, { x: 0, z: 1 }, volley);
      assert.equal(directions.length, p.count);
      directions.forEach(d => assert.ok(Math.abs(Math.hypot(d.x, d.z) - 1) < 1e-9));
    }
  }
  assert.equal(attackProfile('colossusBoss', 20, 1, { health: 60, maxHealth: 100 }).pattern, 'broadside');
  const glide = attackProfile('harpyBoss', 20, 0, { harpyMode: 'glide' });
  const burst = attackProfile('harpyBoss', 20, 0, { harpyMode: 'burst' });
  assert.ok(glide.interval >= 1.9, 'low cadence while gliding');
  assert.ok(burst.interval <= .35 && burst.converge && burst.muzzles.length === 2, 'rapid converging wing-gun burst');
  const fastestHive = Math.max(attackProfile('hiveBoss', 10, 0, { hiveMode: 'hunt' }).speed, HIVE_TURRET_SALVO.speed);
  for (const p of [glide, burst]) {
    assert.equal(p.projectile, 'harpyShot');
    assert.ok(p.speed > fastestHive && p.speed <= fastestHive + 6, 'a bit faster than the fastest Hive shot');
    assert.ok(p.lockLead > 0 && p.lockLead < p.charge, 'tracks the player until just before firing');
  }
  assert.deepEqual(HARPY.burstShots, [12, 14, 18], 'burst is twice as long as before (6, 7, 9)');
  assert.ok(HARPY.burstTimeout >= HARPY.burstShots[2] * burst.interval, 'timeout never cuts the burst short');
});

test('hive fires twin shots from its two front exits; hunt shots are fast and the turret salvo faster still', () => {
  const hunt = attackProfile('hiveBoss', 10, 0, { hiveMode: 'hunt' });
  const salvo = [0, 1, 2, 3].map(volley => attackProfile('hiveBoss', 10, volley, { hiveMode: 'turret' }));
  for (const p of [hunt, ...salvo]) {
    assert.equal(p.muzzles, HIVE_MUZZLES);
    assert.equal(p.count * p.muzzles.length, 2);
    assert.ok(p.recoil > 0, 'every shot is followed by a grace period');
    assert.ok(p.charge < p.interval);
  }
  assert.ok([hunt, ...salvo].every(p => p.converge && p.lockLead > 0), 'converging shots that track until just before firing');
  assert.equal(hunt.projectile, 'hiveShot');
  assert.ok(hunt.range >= 30 && hunt.speed >= 18, 'normal shot is as fast as the old turret shot');
  assert.ok(salvo.every(p => p.projectile === 'enemyLance' && p.speed > hunt.speed + 5), 'turret shots are faster still');
  assert.deepEqual(salvo.map(p => p.salvoStep), [0, 1, 2, 0]);
  assert.deepEqual(salvo.map(p => p.ignoreVolleyGate), [false, true, true, false]);
  assert.ok(salvo[1].charge + salvo[0].interval - salvo[0].charge <= .2, 'three consecutive shots');
  assert.ok(salvo[2].interval - salvo[2].charge + salvo[0].charge <= 2, 'then a short reload');
  assert.equal(HIVE_TURRET_SALVO.volleys, 3);

  // Duas balas paralelas, uma em cada saída (±0,32 do tamanho, na proa)
  const size = 3, aim = { x: 0, z: 1 }, origin = { x: 0, y: 0, z: 0 };
  const [left, right] = HIVE_MUZZLES.map(m => muzzlePosition(origin, aim, m.side * size, m.forward * size));
  assert.ok(Math.abs(Math.hypot(left.x - right.x, left.z - right.z) - .64 * size) < 1e-9);
  assert.ok(Math.abs(left.z - right.z) < 1e-9 && left.z > 0, 'side by side, ahead of the hull');

  const mini = attackProfile('miniHive', 12, 0, {});
  assert.equal(mini.muzzles, HIVE_MUZZLES);
  assert.ok(mini.speed < hunt.speed);
});

test('broadside fires sideways and spiral arms advance each volley', () => {
  const aim = { x: 0, z: 1 };
  const broadside = attackDirections({ pattern: 'broadside', count: 6, spread: .2 }, aim, 0);
  broadside.forEach(d => assert.ok(Math.abs(d.z) < .25, 'perpendicular to the aim'));
  assert.equal(broadside.filter(d => d.x < 0).length, 3);
  const first = attackDirections({ pattern: 'spiral', count: 4, twist: .4 }, aim, 0);
  const second = attackDirections({ pattern: 'spiral', count: 4, twist: .4 }, aim, 1);
  assert.ok(Math.abs(Math.atan2(second[0].z, second[0].x) - Math.atan2(first[0].z, first[0].x) - .4) < 1e-9);
});

test('bastion shield plates block shots arriving through them and follow the rotation', () => {
  const bastion = { type: 'bastionBoss', position: { x: 0, z: 0 }, shieldRotation: 0 };
  const at = angle => ({ x: Math.cos(angle) * 2, z: Math.sin(angle) * 2 });
  assert.equal(bastionShieldBlocks(bastion, at(0)), true);
  assert.equal(bastionShieldBlocks(bastion, at(Math.PI / 4)), false);
  assert.equal(bastionShieldBlocks(bastion, at(BASTION_SHIELD_HALF_ARC + .01)), false);
  bastion.shieldRotation = Math.PI / 4;
  assert.equal(bastionShieldBlocks(bastion, at(-Math.PI / 4)), true);
  assert.equal(bastionShieldBlocks(bastion, at(0)), false);
  assert.equal(bastionShieldBlocks({ ...bastion, type: 'boss' }, at(-Math.PI / 4)), false);
  assert.equal(bastionShieldBlocks({ type: 'bastionBoss', position: { x: 0, z: 0 } }, at(0)), false);
});

function bossHarness(enemy, player = { x: 0, z: 0 }) {
  const active = { value: [enemy] }, hits = [], contacts = [], deaths = [];
  let serial = 0;
  const behaviors = createBossBehaviors({
    activeEnemies: active,
    playerPosition: { value: player },
    // hits: dano de quem encostou; contacts: em que etapa da Harpia foi (ex.: 'dash')
    applyCollisionDamage: source => { hits.push(source.onHitDamage); contacts.push(source.harpy?.mode); },
    enemyManager: {
      spawnEnemy: (type, options) => {
        const spawned = { id: `add${++serial}`, type, state: options.state ?? 'spawning', size: .7, health: 60,
          position: { ...options.position }, ...options.overrides };
        active.value.push(spawned);
        return spawned;
      },
      takeDamage: (id, _damage, type) => {
        const target = active.value.find(e => e.id === id);
        if (target) { target.state = 'dying'; deaths.push({ id, type }); }
      },
    },
  });
  return { behaviors, active, hits, contacts, deaths };
}

test('bosses attack by distance even off a narrow screen; regular enemies still need to be on screen', () => {
  const { canAttackFrom, ENEMY_ATTACK_RANGE } = patterns;
  for (const type of CHAPTER_BOSSES) {
    assert.equal(canAttackFrom({ type }, 6, false), true, `${type} fires with its center off screen`);
    assert.equal(canAttackFrom({ type }, ENEMY_ATTACK_RANGE.max + 1, true), false, `${type} out of range`);
    assert.equal(canAttackFrom({ type }, ENEMY_ATTACK_RANGE.min - .5, true), false, `${type} point blank`);
  }
  assert.equal(canAttackFrom({ type: 'ufo' }, 6, false), false);
  assert.equal(canAttackFrom({ type: 'ufo' }, 6, true), true);
  assert.equal(canAttackFrom({ type: 'miniHive' }, 6, false), false);
});

test('hive hunts slowly toward the player, then turns into a stationary turret while its fighters live', () => {
  const hive = { id: 'c', type: 'hiveBoss', position: { x: 0, z: -14 }, speed: 1, size: 3, health: 100, maxHealth: 100, onHitDamage: 50 };
  const { behaviors, active } = bossHarness(hive);
  const drones = () => active.value.filter(e => e.summonerId === 'c');

  behaviors.hiveBoss(hive, .1);
  assert.equal(hive.hiveMode, 'hunt');
  const start = hive.position.z;
  for (let t = .1; t < HIVE.huntDuration - .2; t += .1) behaviors.hiveBoss(hive, .1);
  assert.ok(hive.position.z > start, 'moves toward the player');
  assert.ok(hive.position.z - start <= hive.speed * HIVE.huntDuration + 1e-9, 'slowly');
  assert.equal(drones().length, 0);

  for (let t = 0; t < .5; t += .1) behaviors.hiveBoss(hive, .1);
  assert.equal(hive.hiveMode, 'turret');
  assert.equal(hive.hangarOpen, true);
  assert.equal(hive.holdFire, false, 'the boss keeps charging its lance while launching');

  const parked = { ...hive.position };
  for (let t = 0; t < 10; t += .1) behaviors.hiveBoss(hive, .1);
  assert.deepEqual(hive.position, parked, 'stationary in turret mode');
  assert.equal(drones().length, HIVE.launchCount);
  drones().forEach(d => {
    assert.equal(d.state, 'active', 'fighters leave the hangar already flying');
    assert.equal(d.bossThreat, true, 'Hive fighters hit like the boss');
    assert.ok(Math.abs(Math.hypot(d.launchDirection.x, d.launchDirection.z) - 1) < 1e-9);
  });
  assert.equal(hive.hiveMode, 'turret', 'stays a turret while fighters live');

  drones().forEach(d => { d.state = 'dying'; });
  behaviors.hiveBoss(hive, .1);
  assert.equal(hive.hiveMode, 'hunt');
  assert.equal(hive.hangarOpen, false);
});

function attacksHarness(player) {
  const bullets = [], run = { currentStageIndex: 10, getPlayerPosition: () => player };
  const context = vm.createContext({ ...patterns, playableRoomCount, Math,
    useCurrentRunStore: () => run,
    useProjectileStore: () => ({ projectiles: bullets, spawnProjectile: (...args) => bullets.push({ ownerType: 'enemy', args }) }),
    useState: () => ({ value: { x: 0, z: 0, width: 30, height: 23 } }),
  });
  const source = readFileSync(new URL('../app/composables/useEnemyAttacks.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replaceAll('export ', '');
  vm.runInContext(source + '\nglobalThis.attacks=useEnemyAttacks();', context);
  return { attacks: context.attacks, bullets };
}

// Onde a bala cruza a linha z = 0 (a do jogador nos testes)
const crossingX = shot => {
  const [, origin, direction] = shot.args;
  return origin.x + direction.x * (-origin.z / direction.z);
};

test('turret: reload, three quick shots aimed at the player, reload again', () => {
  const player = { x: 0, z: 0 };
  const { attacks, bullets } = attacksHarness(player);
  const hive = { id: 'h', type: 'hiveBoss', state: 'active', exactStats: true, size: 3, position: { x: 0, z: -8 },
    hiveMode: 'turret', attackClock: { remaining: 0, volley: 0, charging: false } };
  const volleys = [];
  // Recarga 1 s → tiros em ~1,0 / 1,16 / 1,32 → +0,5 s + recarga 1 s → próximo em ~2,82 (o seguinte viria em ~3,0)
  for (let t = 0; t < 2.9; t += .02) {
    // Durante a primeira recarga o jogador anda de lado
    if (volleys.length === 0) player.x += 2.5 * .02;
    const before = bullets.length;
    attacks.update([hive], .02);
    if (bullets.length > before) volleys.push({ t, x: player.x, shots: bullets.slice(before) });
    if (volleys.length === 0) assert.equal(hive.recoilTimer, undefined, 'no grace period before the first shot');
  }
  assert.equal(volleys.length, 4, 'three shots, reload, next salvo');
  assert.ok(volleys.every(v => v.shots.length === 2));
  [1, 2].forEach(i => assert.ok(volleys[i].t - volleys[i - 1].t <= .22, 'consecutive shots'));
  const reload = volleys[3].t - volleys[2].t;
  assert.ok(reload >= 1.2 && reload <= 1.8, `reload ${reload.toFixed(2)}s`);

  // Mira no jogador de verdade: acompanha a recarga e as duas balas cruzam onde ele está (sem ponto cego)
  volleys.forEach(({ x, shots }, i) => shots.forEach(shot => {
    const miss = Math.abs(crossingX(shot) - x);
    assert.ok(miss <= (i === 0 ? .4 : .05), `volley ${i + 1} misses by ${miss.toFixed(2)}`);
  }));
  assert.ok(crossingX(volleys[0].shots[0]) > 1.5, 'tracked the strafing player during the reload');
  volleys.flatMap(v => v.shots).forEach(s => assert.equal(s.args[9].speed, HIVE_TURRET_SALVO.speed));
  assert.ok(hive.recoilTimer > 0, 'grace period starts after the shot');
});

test('hunt shot: tracks while charging, converges on a player standing still between the exits', () => {
  const player = { x: 0, z: 0 };
  const { attacks, bullets } = attacksHarness(player);
  const hive = { id: 'h', type: 'hiveBoss', state: 'active', exactStats: true, size: 3, position: { x: 0, z: -9 },
    hiveMode: 'hunt', attackClock: { remaining: 0, volley: 0, charging: false } };
  for (let t = 0; t < 1 && bullets.length === 0; t += .02) attacks.update([hive], .02);
  assert.equal(bullets.length, 2);
  bullets.forEach(shot => {
    assert.ok(Math.abs(crossingX(shot)) < .01, 'both bullets pass through the player, not beside it');
    assert.equal(shot.args[0], 'hiveShot');
    assert.equal(shot.args[9].speed, HIVE_HUNT_SHOT.speed);
  });
  assert.notDeepEqual(bullets[0].args[1], bullets[1].args[1], 'fired from the two separate exits');
});

test('player hitbox matches the ship and hive projectiles are large', () => {
  assert.ok(PLAYER_HITBOX_RADIUS >= .5, 'the Kestrel is ~1.7 wide at game scale');
  const store = readFileSync(new URL('../app/stores/projectileStore.js', import.meta.url), 'utf8');
  assert.match(store, /PLAYER_HITBOX_RADIUS\+projectile\.size/);
  assert.match(store, /hiveShot: \{\.\.\.orb, size: \.4/);
  assert.match(store, /enemyLance: \{\.\.\.orb, size: \.4/);
  assert.match(store, /harpyShot: \{\.\.\.orb, size: \.4/);
});

test('after each shot the hive holds still facing where it fired, then resumes the chase', () => {
  const hive = { id: 'g', type: 'hiveBoss', position: { x: 0, z: -14 }, speed: 1, size: 3, health: 100, maxHealth: 100, onHitDamage: 50 };
  const { behaviors } = bossHarness(hive);
  behaviors.hiveBoss(hive, .1);
  assert.equal(hive.visualHeading, undefined, 'faces the player while chasing');

  hive.recoilTimer = HIVE_HUNT_SHOT.recoil;
  hive.recoilDirection = { x: 1, z: 0 };
  const held = { ...hive.position };
  for (let i = 0; i < 8; i++) {
    behaviors.hiveBoss(hive, .1);
    assert.deepEqual(hive.position, held);
    assert.equal(hive.visualHeading, Math.atan2(-1, -0), 'nose kept on the shot line');
  }
  for (let i = 0; i < 3; i++) behaviors.hiveBoss(hive, .1);
  assert.ok(hive.position.z > held.z, 'chasing again');
  assert.equal(hive.visualHeading, undefined);
});

test('mini-hive runs the same cycle with fewer fighters and holds fire while launching', () => {
  const mini = { id: 'm', type: 'miniHive', position: { x: 0, z: -12 }, speed: .9, size: 1.4, health: 100, maxHealth: 100, onHitDamage: 20 };
  const { behaviors, active } = bossHarness(mini);
  for (let t = 0; t < MINI_HIVE.huntDuration + 3; t += .1) behaviors.miniHive(mini, .1);
  assert.equal(mini.hiveMode, 'turret');
  assert.equal(mini.holdFire, true);
  const fighters = active.value.filter(e => e.summonerId === 'm');
  assert.equal(fighters.length, MINI_HIVE.launchCount);
  assert.ok(fighters.every(d => d.bossThreat === false), 'mini-hive fighters hit like regular enemies');
});

test('fighters launch fast, accelerate, turn wider the faster they fly, and self-destruct', () => {
  const drone = { id: 'd', type: 'hiveDrone', state: 'active', position: { x: 0, z: 0 }, size: .7, health: 60, onHitDamage: 70,
    launchDirection: { x: 1, z: 0 } };
  const player = { x: 0, z: 40 };
  const { behaviors, hits, deaths } = bossHarness(drone, player);

  behaviors.hiveDrone(drone, .02);
  assert.ok(drone.flight.speed > HIVE_DRONE.cruiseSpeed * 2, 'leaves the hangar fast');
  for (let t = .02; t < HIVE_DRONE.launchTime; t += .02) behaviors.hiveDrone(drone, .02);
  const cruising = drone.flight.speed;

  let previous = Math.atan2(drone.flight.dir.z, drone.flight.dir.x), speeds = [];
  for (let t = 0; t < 2; t += .02) {
    behaviors.hiveDrone(drone, .02);
    const angle = Math.atan2(drone.flight.dir.z, drone.flight.dir.x);
    const turned = Math.abs(Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous)));
    const allowed = Math.min(HIVE_DRONE.maxTurnRate, HIVE_DRONE.turnFactor / drone.flight.speed) * .02;
    assert.ok(turned <= allowed + 1e-9, 'turn rate limited by speed');
    speeds.push(drone.flight.speed);
    previous = angle;
  }
  assert.ok(speeds.at(-1) > cruising && speeds.every((s, i) => i === 0 || s >= speeds[i - 1]), 'keeps accelerating');
  assert.ok(Math.abs(drone.visualHeading - Math.atan2(-drone.flight.dir.x, -drone.flight.dir.z)) < 1e-9, 'nose follows the flight path');

  // Encosta no jogador: dano alto e se destrói
  player.x = drone.position.x; player.z = drone.position.z;
  behaviors.hiveDrone(drone, .02);
  assert.deepEqual(hits, [70]);
  assert.deepEqual(deaths, [{ id: 'd', type: 'collision' }]);

  // Sem alvo por tempo demais: se autodestrói sem causar dano
  const lost = { id: 'l', type: 'hiveDrone', state: 'active', position: { x: 0, z: 0 }, size: .7, health: 60, onHitDamage: 70 };
  const far = bossHarness(lost, { x: 500, z: 500 });
  for (let t = 0; t <= HIVE_DRONE.lifetime + .1; t += .1) if (lost.state === 'active') far.behaviors.hiveDrone(lost, .1);
  assert.deepEqual(far.deaths, [{ id: 'l', type: 'systemkill' }]);
  assert.equal(far.hits.length, 0);
});

test('harpy loop: fast glide, U-turn and burst; the next U-turn charges a long, wide dash', () => {
  const harpy = { id: 'h', type: 'harpyBoss', position: { x: 0, z: -9 }, speed: 1.2, size: 3.2, health: 100, maxHealth: 100, onHitDamage: 50 };
  const { behaviors, contacts } = bossHarness(harpy);
  const modes = [], glideDistances = [];
  // Mede a distância só depois de 1,5 s planando (já assentada na órbita)
  const inGlide = h => h.harpy.timer < HARPY.glideDuration[0] - 1.5;
  let frame = 0, topGlideSpeed = 0, dashStart = null, dashEnd = null;
  for (let t = 0; t < 30; t += .02, frame++) {
    const before = harpy.harpyMode;
    behaviors.harpyBoss(harpy, .02);
    const mode = harpy.harpyMode;
    if (modes.at(-1) !== mode) modes.push(mode);
    if (mode === 'glide') topGlideSpeed = Math.max(topGlideSpeed, harpy.harpy.speed);
    // Simula o useEnemyAttacks contando as rajadas
    if (mode === 'burst' && frame % 10 === 0) harpy.attackClock.volley += 1;
    if (mode === 'burst' || mode === 'charge') assert.equal(harpy.holdFire, mode === 'charge');
    if (['turn', 'settle', 'rest', 'dash', 'recover'].includes(mode)) assert.equal(harpy.holdFire, true);
    if (mode === 'glide' && inGlide(harpy)) glideDistances.push(Math.hypot(harpy.position.x, harpy.position.z));
    if (mode === 'dash' && before !== 'dash') dashStart = { x: harpy.position.x, z: harpy.position.z };
    if (before === 'dash' && mode !== 'dash') dashEnd = { ...harpy.position };
    if (mode === 'charge') {
      assert.equal(harpy.dashState, 'aim');
      assert.ok(harpy.dashWidth >= 4, 'thick dash hitbox, shown by the telegraph');
    }
  }
  assert.deepEqual(modes.slice(0, 12),
    ['glide', 'turn', 'settle', 'burst', 'rest', 'glide', 'turn', 'settle', 'charge', 'dash', 'recover', 'glide']);
  assert.ok(topGlideSpeed >= 7, 'glides fast');
  const meanDistance = glideDistances.reduce((a, b) => a + b, 0) / glideDistances.length;
  assert.ok(meanDistance >= HARPY.orbitNear && meanDistance <= HARPY.orbitFar + 1, `glides farther out (${meanDistance.toFixed(1)})`);
  assert.ok(HARPY.graceAfterTurn > 0 && HARPY.graceAfterBurst > 0 && HARPY.recover >= 1.5, 'grace periods between steps');
  assert.ok(dashStart && dashEnd);
  assert.ok(Math.abs(Math.hypot(dashEnd.x - dashStart.x, dashEnd.z - dashStart.z) - HARPY.dashLength) < .5, 'nearly edge-to-edge');
  assert.ok(HARPY.dashLength >= 24 && HARPY.dashSpeed >= 25);
  assert.ok(contacts.includes('dash'), 'the dash runs over the player');
});

test('harpy stops still for the burst and the dash wind-up', () => {
  const harpy = { id: 'h2', type: 'harpyBoss', position: { x: 0, z: -9 }, speed: 1.2, size: 3.2, health: 100, maxHealth: 100, onHitDamage: 50 };
  const { behaviors } = bossHarness(harpy);
  const settled = { burst: null, charge: null };
  let inMode = 0, last = null;
  for (let t = 0; t < 30; t += .02) {
    behaviors.harpyBoss(harpy, .02);
    const mode = harpy.harpyMode;
    inMode = mode === last ? inMode + .02 : 0;
    last = mode;
    if ((mode === 'burst' || mode === 'charge') && inMode > .5) {
      settled[mode] ??= { ...harpy.position };
      assert.deepEqual(harpy.position, settled[mode], `${mode}: stationary after braking`);
    }
    if (mode === 'glide') { settled.burst = null; settled.charge = null; }
  }
});

test('bastion spins faster below half health; colossus exposes the reactor and calls escorts in phase 3', () => {
  const bastion = { id: 'b', type: 'bastionBoss', position: { x: 0, z: -8 }, speed: .8, size: 3, health: 100, maxHealth: 100 };
  const { behaviors } = bossHarness(bastion);
  behaviors.bastionBoss(bastion, 1);
  const calm = bastion.shieldRotation;
  bastion.health = 40;
  behaviors.bastionBoss(bastion, 1);
  assert.ok(bastion.shieldRotation - calm > calm);

  const colossus = { id: 'k', type: 'colossusBoss', position: { x: 0, z: -10 }, speed: .9, size: 4.5, health: 100, maxHealth: 100 };
  const harness = bossHarness(colossus);
  harness.behaviors.colossusBoss(colossus, 3);
  assert.equal(colossus.damageTakenMultiplier, 1);
  assert.equal(harness.active.value.length, 1);
  colossus.health = 30;
  harness.behaviors.colossusBoss(colossus, 3);
  assert.equal(colossus.damageTakenMultiplier, 1.35);
  assert.equal(harness.active.value.filter(e => e.type === 'ufofast').length, 2);
});
