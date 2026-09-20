import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { ref, shallowRef, reactive } from 'vue';

// Os utils em TS usam import relativo sem extensão (padrão do Nuxt); o Node precisa do ".ts".
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});
const { emptyEquipmentEffects } = await import('../app/utils/equipment.ts');

/** Sobe a store real de efeitos com a partida, os atributos e os inimigos dublados. */
function effectsHarness({ gear = {}, fireTrail = null, damage = 100 } = {}) {
  const hits = [];
  const enemies = shallowRef([]);
  const run = {
    isPlaying: true, currentHealth: 300, maxHealth: 300,
    position: { x: 0, y: 0, z: 0 }, move: { x: 1, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    getPlayerPosition() { return run.position; },
    getMoveVector() { return run.move; },
    getPlayerRotation() { return run.rotation; },
    healPlayer() {},
  };
  const stats = { damage, fireTrail };
  const manager = {
    activeEnemies: enemies,
    takeDamage: (id, amount, type, options) => hits.push({ id, amount, type, options }),
  };
  const context = vm.createContext({
    ref, shallowRef, Math, console: { log() {}, warn() {} },
    defineStore: (_id, setup) => { let store; return () => store ??= reactive(setup()); },
    emptyEquipmentEffects,
    useCurrentRunStore: () => run,
    usePlayerStats: () => stats,
    useEnemyManager: () => manager,
    emitImpact() {},
  });
  const source = readFileSync(new URL('../app/stores/useEquipmentEffectsStore.ts', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replaceAll('export ', '')
    .replace(/if\s*\(import\.meta\.hot\)[\s\S]*$/, '');
  vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.useEquipmentEffectsStore=useEquipmentEffectsStore;', context);
  const store = context.useEquipmentEffectsStore();
  store.initialize({ ...emptyEquipmentEffects(), ...gear });
  // Dois passos separados por .55 de distância depositam dois pontos de rastro
  const walk = () => { store.update(.1); run.position = { x: run.position.x + 1, y: 0, z: 0 }; store.update(.1); };
  const enemyAt = (x, z, id = 'e1') => { enemies.value = [{ id, state: 'active', size: 1, position: { x, y: 0, z } }]; };
  return { store, run, stats, enemies, hits, walk, enemyAt };
}

test('without the comet thruster or the card the ship leaves no trail', () => {
  const { store, walk, hits, enemyAt } = effectsHarness();
  enemyAt(0, .65);
  walk();
  assert.equal(store.trail.length, 0);
  assert.equal(hits.length, 0);
});

test('fire trail card alone lights the trail and burns for its share of the damage', () => {
  const { store, walk, hits, enemyAt } = effectsHarness({ fireTrail: { damage: .12, width: 1 } });
  enemyAt(0, .65);
  walk();
  assert.equal(store.trail.length, 2);
  assert.equal(store.trail[0].width, 1);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].amount, 100 * .12);
  assert.equal(hits[0].type, 'equipment');
  assert.equal(hits[0].options.text, 'burn'); // sai como fogo
});

test('card and comet thruster share one trail: widest width, summed damage', () => {
  const { store, walk, hits, enemyAt } = effectsHarness({
    gear: { cometTrailWidth: .9, cometTrailDamageMultiplier: .25 },
    fireTrail: { damage: .12, width: 1 },
  });
  enemyAt(0, .65);
  walk();
  assert.equal(store.trail[0].width, 1); // 1 da carta > .9 do propulsor
  assert.ok(Math.abs(hits[0].amount - 100 * .37) < 1e-12);
});

test('comet thruster alone keeps dealing plain equipment damage', () => {
  const { walk, hits, enemyAt } = effectsHarness({ gear: { cometTrailWidth: .9, cometTrailDamageMultiplier: .25 } });
  enemyAt(0, .65);
  walk();
  assert.equal(hits[0].amount, 25);
  assert.equal(hits[0].options.text, undefined);
});

test('the same enemy only burns twice per second while standing on the trail', () => {
  const { store, walk, hits, enemyAt } = effectsHarness({ fireTrail: { damage: .12, width: 1 } });
  enemyAt(0, .65);
  walk();
  assert.equal(hits.length, 1);
  store.update(.1); store.update(.1);
  assert.equal(hits.length, 1, 'ainda no cooldown');
  store.update(.4);
  assert.equal(hits.length, 2);
});

test('changing rooms clears the trail left behind without dropping the equipment', () => {
  const { store, run, walk, enemyAt } = effectsHarness({
    gear: { cometTrailWidth: .9, cometTrailDamageMultiplier: .25 },
    fireTrail: { damage: .12, width: 1 },
  });
  enemyAt(0, .65);
  walk();
  assert.ok(store.trail.length > 0);

  store.resetRoom();
  assert.equal(store.trail.length, 0);
  assert.equal(store.orbPositions.length, 0);
  assert.equal(store.flare, null);
  // O equipamento continua valendo na sala nova
  assert.equal(store.effects.cometTrailWidth, .9);

  // Entrou na sala nova longe daqui: o primeiro passo deposita ali, não interpola do ponto antigo
  run.position = { x: 40, y: 0, z: 40 };
  store.update(.1);
  assert.equal(store.trail.length, 1);
  assert.equal(store.trail[0].x, 40);
});
