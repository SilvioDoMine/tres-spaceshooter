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

const { emptyStatistics, recordMatch, sanitizeStatistics } = await import('../app/utils/statistics.ts');
const { isFreeUnlocked } = await import('../app/utils/shop.ts');
const { CHEST_FREE_UNLOCK_MATCHES } = await import('../app/data/shop.ts');

test('partidas somam vitórias, derrotas, tempo, abates, ouro e melhor sala', () => {
  let stats = emptyStatistics();
  stats = recordMatch(stats, { victory: false, durationSec: 95.26, enemiesKilled: 12, goldEarned: 300, roomsReached: 4, at: 1000 });
  stats = recordMatch(stats, { victory: true, durationSec: 300, enemiesKilled: 40, goldEarned: 900, roomsReached: 20, at: 2000 });
  stats = recordMatch(stats, { victory: false, durationSec: 10, enemiesKilled: 1, goldEarned: 0, roomsReached: 2, at: 3000 });

  assert.deepEqual(stats, {
    matchesPlayed: 3,
    victories: 1,
    defeats: 2,
    totalPlayTimeSec: 405.3,
    enemiesKilled: 53,
    goldEarned: 1200,
    bestRoomsReached: 20,
    firstMatchAt: 1000,
    lastMatchAt: 3000,
  });
});

test('valores inválidos da partida não quebram a soma', () => {
  const stats = recordMatch(emptyStatistics(), { victory: false, durationSec: NaN, enemiesKilled: -5, goldEarned: 'x', roomsReached: undefined, at: 50 });
  assert.equal(stats.matchesPlayed, 1);
  assert.equal(stats.totalPlayTimeSec, 0);
  assert.equal(stats.enemiesKilled, 0);
  assert.equal(stats.goldEarned, 0);
  assert.equal(stats.bestRoomsReached, 0);
});

test('saneamento descarta lixo e mantém partidas >= vitórias + derrotas', () => {
  assert.equal(sanitizeStatistics(null), null);
  assert.equal(sanitizeStatistics('abc'), null);
  const clean = sanitizeStatistics({ matchesPlayed: 1, victories: 2, defeats: 1, totalPlayTimeSec: -3, firstMatchAt: 'x', lastMatchAt: 99 });
  assert.equal(clean.matchesPlayed, 3);
  assert.equal(clean.totalPlayTimeSec, 0);
  assert.equal(clean.firstMatchAt, null);
  assert.equal(clean.lastMatchAt, 99);
});

test('baú grátis só libera depois da primeira partida', () => {
  assert.equal(CHEST_FREE_UNLOCK_MATCHES, 1);
  assert.equal(isFreeUnlocked(0), false);
  assert.equal(isFreeUnlocked(1), true);
  assert.equal(isFreeUnlocked(2, 3), false);
});
