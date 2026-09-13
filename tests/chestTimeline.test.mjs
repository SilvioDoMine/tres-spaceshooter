import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

// Os utils em TS usam import relativo sem extensão (padrão do Nuxt); o Node precisa do ".ts".
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

const { chestFrame, chestTimeline } = await import('../app/utils/chestTimeline.ts');

test('baú começa no alto, fechado e sem efeitos', () => {
  const frame = chestFrame(0, false);
  assert.ok(frame.y > 3);
  assert.equal(frame.lid, 0);
  assert.equal(frame.flash, 0);
  assert.equal(frame.rays, 0);
  assert.equal(frame.item, 0);
  assert.equal(frame.done, false);
});

test('tampa, clarão e item acontecem só depois da tremida', () => {
  const tl = chestTimeline(false);
  const beforeOpen = chestFrame(tl.shakeEnd - 0.01, false);
  assert.equal(beforeOpen.lid, 0);
  assert.equal(beforeOpen.flash, 0);
  assert.ok(Math.abs(beforeOpen.tilt) >= 0);

  const flashPeak = chestFrame(tl.shakeEnd + 0.06, false);
  assert.ok(flashPeak.flash > 0.9);

  const end = chestFrame(tl.end, false);
  assert.equal(end.done, true);
  assert.ok(Math.abs(end.lid - 1) < 1e-6);
  assert.ok(Math.abs(end.item - 1) < 1e-6);
  assert.equal(end.y, 0);
  assert.equal(end.tilt, 0);
});

test('raridade garantida segura mais a tremida', () => {
  assert.ok(chestTimeline(true).shakeEnd > chestTimeline(false).shakeEnd);
  const t = chestTimeline(false).shakeEnd + 0.1;
  assert.ok(chestFrame(t, false).lid > 0);
  assert.equal(chestFrame(t, true).lid, 0);
});
