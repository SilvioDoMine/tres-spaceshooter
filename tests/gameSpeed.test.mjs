import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canFastGame, clearedRoomSpeedBoost, nextGameSpeed, sanitizeGameSpeed } from '../app/utils/gameSpeed.js';

test('cleared room boost is 3x, 40% lower (1.8x) in fast game', () => {
  assert.equal(clearedRoomSpeedBoost(1), 3);
  assert.ok(Math.abs(clearedRoomSpeedBoost(2) - 1.8) < 1e-9);
  assert.ok(Math.abs(clearedRoomSpeedBoost(3) - 1.8) < 1e-9);
});

test('game speed cycles 1x → 2x → 3x → 1x', () => {
  assert.equal(nextGameSpeed(1), 2);
  assert.equal(nextGameSpeed(2), 3);
  assert.equal(nextGameSpeed(3), 1);
});

test('invalid saved speed falls back to 1x', () => {
  assert.equal(sanitizeGameSpeed('2'), 2);
  assert.equal(sanitizeGameSpeed(5), 1);
  assert.equal(sanitizeGameSpeed(null), 1);
  assert.equal(nextGameSpeed('lixo'), 2);
});

test('fast game only for completed chapters', () => {
  const progress = { maxUnlocked: 3, completed: [1], lastPlayed: 2 };
  assert.equal(canFastGame(progress, 1), true);
  assert.equal(canFastGame(progress, '1'), true);
  assert.equal(canFastGame(progress, 2), false);
  assert.equal(canFastGame(null, 1), false);
});
