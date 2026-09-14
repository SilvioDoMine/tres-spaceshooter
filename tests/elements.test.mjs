import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ELEMENT_RULES, applyElementalHit, createElementState, elementChainTargets, thawElementState, tickElementState,
} from '../app/utils/elementalStatus.js';

const near = (a, b) => Math.abs(a - b) < 1e-9;
const run = (state, seconds, step = .1) => {
  const total = { burn: 0, thaw: 0 };
  for (let t = 0; t < seconds - 1e-9; t += step) {
    const r = tickElementState(state, step);
    total.burn += r.burn; total.thaw += r.thaw;
  }
  return total;
};

test('fire burns a constant fraction of the hit per second and refreshes with the strongest burn', () => {
  const state = createElementState();
  assert.equal(applyElementalHit(state, { fire: { burn: .15, duration: 3 } }, 100).burning, true);
  assert.ok(near(run(state, 3).burn, 45));
  assert.equal(state.burn, null);

  applyElementalHit(state, { fire: { burn: .15, duration: 3 } }, 100);
  run(state, 2);
  applyElementalHit(state, { fire: { burn: .15, duration: 3 } }, 40); // mais fraco: não reduz o dps
  assert.equal(state.burn.dps, 15);
  assert.ok(near(state.burn.remaining, 3));
  // Ticks independem do frame rate
  const coarse = createElementState(), fine = createElementState();
  applyElementalHit(coarse, { fire: { burn: .2, duration: 3 } }, 50);
  applyElementalHit(fine, { fire: { burn: .2, duration: 3 } }, 50);
  assert.ok(near(run(coarse, 3, .5).burn, run(fine, 3, 1 / 60).burn));
});

test('ice freezes with raw damage, shatters on thaw once and then grants immunity', () => {
  const state = createElementState();
  const payload = { ice: { damage: .35, shatter: .35, duration: 1.5 } };
  const hit = applyElementalHit(state, payload, 100);
  assert.equal(hit.froze, true);
  assert.ok(near(hit.freezeDamage, 35));
  assert.equal(applyElementalHit(state, payload, 100).froze, false); // já congelado
  assert.ok(near(thawElementState(state), 35));
  assert.equal(thawElementState(state), 0);
  assert.equal(state.immunity, ELEMENT_RULES.ice.immunity);
  assert.equal(applyElementalHit(state, payload, 100).froze, false); // imune
  run(state, ELEMENT_RULES.ice.immunity);
  assert.equal(applyElementalHit(state, payload, 100).froze, true);
  assert.ok(near(run(state, 1.5).thaw, 35)); // expira sozinho e também quebra
  assert.equal(state.freeze, null);
});

test('bosses stay frozen for a shorter time', () => {
  const state = createElementState();
  applyElementalHit(state, { ice: { damage: .35, shatter: .35, duration: 2 } }, 100, { boss: true });
  assert.ok(near(state.freeze.duration, 2 * ELEMENT_RULES.ice.bossDurationFactor));
});

test('lightning adds bonus damage, shocks the target and chains hop by hop within range', () => {
  const state = createElementState();
  const hit = applyElementalHit(state, { lightning: { bonus: .25, chains: 2, range: 5 } }, 80);
  assert.equal(hit.lightning, 20);
  assert.equal(state.shock, ELEMENT_RULES.lightning.shockTime);
  const at = (id, x) => ({ id, position: { x, z: 0 } });
  const enemies = [at('origin', 0), at('far', 20), at('b', 8), at('a', 4)];
  // a está a 4 da origem; b está a 4 de a (8 da origem): o salto parte do alvo anterior
  assert.deepEqual(elementChainTargets({ x: 0, z: 0 }, enemies, 5, 2, ['origin']).map(e => e.id), ['a', 'b']);
  assert.deepEqual(elementChainTargets({ x: 0, z: 0 }, enemies, 5, 1, ['origin']).map(e => e.id), ['a']);
  assert.deepEqual(elementChainTargets({ x: 0, z: 0 }, enemies, 3, 2, ['origin']), []);
});

test('combined payload applies every element from the same hit', () => {
  const state = createElementState();
  const hit = applyElementalHit(state, {
    fire: { burn: .15, duration: 3 }, ice: { damage: .5, shatter: .5, duration: 2 }, lightning: { bonus: .4, chains: 2, range: 11 },
  }, 100);
  assert.deepEqual({ burning: hit.burning, froze: hit.froze }, { burning: true, froze: true });
  assert.ok(near(hit.freezeDamage, 50) && near(hit.lightning, 40));
  assert.deepEqual(applyElementalHit(state, { fire: { burn: 1, duration: 1 } }, 0), { burning: false, froze: false, freezeDamage: 0, lightning: 0 });
});
