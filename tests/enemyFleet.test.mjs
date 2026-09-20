import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as fleet from '../app/utils/enemyFleet.js';
import * as patterns from '../app/utils/combatPatterns.js';
import { LEVELS } from '../app/games/levels/index.js';
import { completeChapter, sanitizeChapterProgress } from '../app/utils/chapterProgress.js';
import { playableRoomCount } from '../app/utils/progression.js';

const models = new Map();
const player = { x: 3, y: 0, z: -15 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 2e-5, `${a} != ${b}`);
test('all 17 runtime GLBs load; transformed physical exits match combat at multiple headings/scales', async () => {
  assert.equal(Object.keys(fleet.ENEMY_FLEET).length, 17);
  for (const [type, entry] of Object.entries(fleet.ENEMY_FLEET)) {
    const bytes = readFileSync(new URL('../public' + entry.url, import.meta.url));
    const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    models.set(type, scene);
    for (const yaw of [0, .73, -2.1]) for (const size of [.75, 1.5, 3]) {
      const enemy = { type, size, position: { x: 7, y: .2, z: -5 } };
      scene.position.set(7, .2, -5); scene.rotation.y = yaw; scene.scale.setScalar(size);
      for (const rotor of [0, -.84]) {
        scene.traverse(part => { if (['ring_rotor', 'radial_rotor', 'radial_emitter'].includes((part.userData.name || part.name).replace(/\.\d+$/, ''))) part.rotation.y = rotor; });
        scene.updateMatrixWorld(true);
        for (const socket of entry.sockets.filter(s => s.role.startsWith('muzzle_'))) {
          let marker;
          scene.traverse(part => { if (part.userData.role === socket.role) marker = part; });
          assert.ok(marker, `${type}/${socket.role}`);
          const position = marker.getWorldPosition(new Vector3());
          const actual = fleet.fleetSocketWorld(enemy, socket, yaw, rotor);
          near(position.x, actual.origin.x); near(position.y, actual.origin.y); near(position.z, actual.origin.z);
          const axis = new Vector3(0, 0, -1).transformDirection(marker.matrixWorld);
          near(axis.x, actual.direction.x); near(axis.z, actual.direction.z);
        }
      }
    }
  }
});

test('salvos use one distinct physical exit per round, matching phases and fragment generations', () => {
  for (const type of Object.keys(fleet.ENEMY_FLEET).filter(t => !['angel', 'hiveDrone', 'kamikaze'].includes(t))) {
    for (const health of [100, 60, 30]) for (const generation of [0, 1, 2]) for (let volley = 0; volley < 6; volley++) {
      const enemy = { type, health, maxHealth: 100, size: 1, position: { x: 0, y: 0, z: 0 },
        asteroidGeneration: generation, harpyMode: volley % 2 ? 'burst' : 'glide',
        attackClock: { charging: true, aim: { x: 0, z: -1 }, target: player } };
      const profile = patterns.attackProfile(type, 20, volley, enemy);
      const shots = fleet.fleetSalvo(enemy, profile, volley, player);
      assert.equal(shots.length, profile.count * (profile.muzzles?.length || 1), type);
      assert.equal(new Set(shots.map(s => s.role)).size, shots.length, type);
      for (const shot of shots) {
        near(Math.hypot(shot.direction.x, shot.direction.z), 1);
        assert.ok(Math.hypot(shot.origin.x, shot.origin.z) > .1);
      }
    }
  }
  for (const type of ['hiveBoss', 'harpyBoss', 'bastionBoss', 'colossusBoss']) assert.equal(fleet.ENEMY_FLEET[type], undefined);
});

test('new chapters unlock in sequence and the director waits for the last wave in every room', () => {
  let progress = sanitizeChapterProgress({ completed: [1, 2, 3], maxUnlocked: 3 }, 5);
  assert.equal(progress.maxUnlocked, 4);
  progress = completeChapter(progress, 4, 5); assert.equal(progress.maxUnlocked, 5);
  for (const chapter of [4, 5]) {
    const level = LEVELS[chapter];
    assert.equal(playableRoomCount(level), chapter === 4 ? 38 : 20);
    for (const stage of level.stages.slice(1)) {
      const active = { value: [] }, spawned = [];
      const run = { currentStage: stage, isStageCompleted: false, roomCurrentWaveIndex: 0, isWaveInProgress: false,
        stageTimer: 0, levelTimer: 0, gameSpeed: 1, completeStage() { this.isStageCompleted = true; } };
      const context = vm.createContext({ WAVE_REST: patterns.WAVE_REST, Math, console: { log() {} },
        useCurrentRunStore: () => run,
        useEnemyManager: () => ({ activeEnemies: active, spawnEnemyWave(wave) { spawned.push(wave); active.value = [{}]; } }) });
      const source = readFileSync(new URL('../app/composables/useGameDirector.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replaceAll('export ', '');
      vm.runInContext(source + '\nglobalThis.director=useGameDirector();', context);
      for (let i = 0; i < stage.waves.length; i++) {
        for (let frame = 0; frame < 30 && spawned.length <= i; frame++) context.director.update(.1);
        assert.equal(spawned.length, i + 1);
        assert.equal(run.isStageCompleted, false);
        active.value = []; context.director.update(.1);
        assert.equal(run.isStageCompleted, i === stage.waves.length - 1);
      }
      assert.deepEqual(spawned, stage.waves);
    }
  }
});

test('enemy beams follow the physical muzzle, respect damage grace and stop on freeze/death', () => {
  const enemy = { id: 'leviathan', type: 'chapter4Boss', state: 'active', visualScale: 1.5, position: { x: 0, y: 0, z: 0 } };
  const enemies = [enemy], hits = [], target = { x: 0, y: 0, z: -10 };
  const context = vm.createContext({ ...patterns, ...fleet, Math, console,
    defineStore: (_, setup) => setup, shallowRef: value => ({ value }), emitImpact() {},
    PlayerBaseStats: { projectiles: {} }, usePlayerStats: () => ({}), useSkillStore: () => ({}),
    useEnemyManager: () => ({ activeEnemies: { value: enemies } }),
    useCurrentRunStore: () => ({ getPlayerPosition: () => target, takeDamage: amount => hits.push(amount) }),
    useAudio: () => ({ playCombatSound() {} }) });
  const source = readFileSync(new URL('../app/stores/projectileStore.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replaceAll('export ', '').replace(/^if\(import.meta.hot\).*$/gm, '');
  vm.runInContext(source + '\nglobalThis.store=useProjectileStore();', context);
  const store = context.store;
  const spawn = () => store.spawnProjectile('enemyBeam', { x: 0, y: 0, z: 0 }, { x: 0, z: -1 }, enemy.id, 'enemy', 1, 0, 100, [],
    { beam: true, beamAge: 0, beamYaw: 0, beamDuration: .8, beamWidth: .28, range: 24, muzzleRole: 'muzzle_siege_beam' });
  spawn(); store.update(.1);
  near(store.projectiles.value[0].position.z, -2.57 * 1.5);
  assert.equal(hits.length, 1); store.update(.1); assert.equal(hits.length, 1);
  enemy.elementState = { freeze: true }; store.update(.1); assert.equal(store.projectiles.value.length, 0);
  enemy.elementState = null; spawn(); enemy.state = 'dying'; store.update(.1); assert.equal(store.projectiles.value.length, 0);
  enemy.state = 'active'; spawn(); target.x = 4; store.update(.1); assert.equal(hits.length, 1);
  for (let i = 0; i < 10; i++) store.update(.1);
  assert.equal(store.projectiles.value.length, 0);
});
