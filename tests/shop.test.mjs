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

const {
  batchSize,
  chestButtonState,
  chestDropTable,
  freshShopState,
  gemPackCredit,
  isFreeReady,
  nextResetAt,
  openChestBatch,
  refreshShopState,
  resetDayKey,
  rollChestRarity,
  rollDailyShop,
  sanitizeShopState,
  formatCountdown,
} = await import('../app/utils/shop.ts');
const { CHESTS, DAILY_SHOP_SLOTS, GEM_PACKS } = await import('../app/data/shop.ts');
const { mulberry32 } = await import('../app/utils/talents.ts');

test('reset diário acontece às 04:00 de GMT-3 (07:00 UTC)', () => {
  const before = Date.UTC(2026, 8, 13, 6, 59, 59);
  const after = Date.UTC(2026, 8, 13, 7, 0, 0);
  assert.equal(resetDayKey(after), resetDayKey(before) + 1);
  assert.equal(nextResetAt(before), after);
  assert.equal(nextResetAt(after), Date.UTC(2026, 8, 14, 7, 0, 0));
  assert.equal(formatCountdown(8 * 3600_000 + 24 * 60_000 + 33_000), '08:24:33');
});

test('loja diária é determinística por dia, sem itens repetidos e segue o config', () => {
  const a = rollDailyShop(123, 500);
  const b = rollDailyShop(123, 500);
  const c = rollDailyShop(123, 501);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.offers.map(o => o.defId), c.offers.map(o => o.defId));
  assert.equal(new Set(a.offers.map(o => o.defId)).size, a.offers.length);
  assert.equal(a.offers.length, DAILY_SHOP_SLOTS.length);
  for (const offer of a.offers) {
    assert.equal(offer.rarity, 'gray');
    assert.deepEqual(offer.price, { currency: 'gems', amount: 35 });
    assert.equal(offer.stock, 1);
    assert.equal(offer.bought, 0);
  }
});

test('garantido força a raridade na 10ª abertura e zera ao sair', () => {
  const chest = CHESTS.silver;
  const neverGreen = () => 0; // sempre cai no primeiro peso (Comum)
  let pity = 0;
  for (let i = 0; i < 9; i++) {
    const roll = rollChestRarity(chest, pity, neverGreen);
    assert.equal(roll.rarity, 'gray');
    pity = roll.pity;
  }
  assert.equal(pity, 9);
  const tenth = rollChestRarity(chest, pity, neverGreen);
  assert.equal(tenth.rarity, 'green');
  assert.equal(tenth.forced, true);
  assert.equal(tenth.pity, 0);

  const natural = rollChestRarity(chest, 4, () => 0.99);
  assert.equal(natural.rarity, 'green');
  assert.equal(natural.pity, 0);
});

test('lote de chaves abre no máximo 10 por vez', () => {
  let keys = 22;
  const batches = [];
  while (keys > 0) {
    const size = batchSize(keys);
    batches.push(size);
    keys -= size;
  }
  assert.deepEqual(batches, [10, 10, 2]);

  const result = openChestBatch(CHESTS.obsidian, 10, 0, mulberry32(7));
  assert.equal(result.drops.length, 10);
  assert.ok(result.drops.some(drop => drop.rarity === 'purple'));
  assert.ok(result.drops.every(drop => drop.rarity === 'blue' || drop.rarity === 'purple'));
});

test('taxas de drop aproximam o config e a tabela soma 100%', () => {
  const rng = mulberry32(42);
  const counts = { blue: 0, purple: 0 };
  const rolls = 20000;
  for (let i = 0; i < rolls; i++) counts[rollChestRarity(CHESTS.obsidian, 0, rng).rarity]++;
  assert.ok(Math.abs(counts.purple / rolls - 0.04) < 0.006);

  for (const chest of Object.values(CHESTS)) {
    const table = chestDropTable(chest);
    const total = table.reduce((sum, row) => sum + row.itemPercent * row.items.length, 0);
    assert.ok(Math.abs(total - 100) < 1e-9);
  }
});

test('estado do botão do baú segue a prioridade grátis > chaves > gemas', () => {
  assert.equal(chestButtonState({ freeReady: true, keys: 3, gems: 999, gemCost: 80 }), 'free');
  assert.equal(chestButtonState({ freeReady: false, keys: 3, gems: 999, gemCost: 80 }), 'keys');
  assert.equal(chestButtonState({ freeReady: false, keys: 0, gems: 80, gemCost: 80 }), 'gems');
  assert.equal(chestButtonState({ freeReady: false, keys: 0, gems: 79, gemCost: 80 }), 'insufficient');

  const progress = { pity: 0, freeClaimedAt: 1000 };
  assert.equal(isFreeReady(CHESTS.silver, progress, 1000 + 24 * 3600_000 - 1), false);
  assert.equal(isFreeReady(CHESTS.silver, progress, 1000 + 24 * 3600_000), true);
  assert.equal(isFreeReady(CHESTS.obsidian, { pity: 0, freeClaimedAt: null }, 0), true);
});

test('bônus de gemas só na primeira compra, ou sempre com promoção', () => {
  const pack = GEM_PACKS[0];
  assert.equal(gemPackCredit(pack, [], false), 160);
  assert.equal(gemPackCredit(pack, [pack.id], false), 80);
  assert.equal(gemPackCredit(pack, [pack.id], true), 160);
});

test('virar o dia regenera loja e estoque do ouro, mantendo o resto', () => {
  const now = Date.UTC(2026, 8, 13, 12);
  const state = freshShopState(99, now);
  state.daily.offers[0].bought = 1;
  state.gold.bought['gold-2000'] = 2;
  state.keys.silver = 5;
  assert.equal(refreshShopState(state, now), state);

  const next = refreshShopState(state, now + 24 * 3600_000);
  assert.equal(next.daily.offers[0].bought, 0);
  assert.deepEqual(next.gold.bought, {});
  assert.equal(next.keys.silver, 5);
});

test('saneamento descarta lixo e mantém dados válidos', () => {
  const now = Date.UTC(2026, 8, 13, 12);
  assert.equal(sanitizeShopState(null, now), null);
  assert.equal(sanitizeShopState({ seed: 'x' }, now), null);

  const valid = freshShopState(5, now);
  valid.keys.obsidian = 3;
  valid.chests.silver = { pity: 4, freeClaimedAt: now - 1000 };
  valid.gemPacksPurchased = ['gems-80'];
  assert.deepEqual(sanitizeShopState(JSON.parse(JSON.stringify(valid)), now), valid);

  const broken = sanitizeShopState(
    {
      seed: 5,
      daily: { dayKey: 'a', offers: [{ defId: 'nope' }] },
      keys: { silver: -3, obsidian: 'abc' },
      chests: { silver: { pity: 999, freeClaimedAt: now + 99999 } },
      gemPacksPurchased: ['gems-80', 'fake', 'gems-80'],
      pendingPix: { id: 1 },
    },
    now,
  );
  const pix = { id: 'SIM1', packId: 'offer:supplyPack', amountBRL: 29.9, copyPaste: 'x', createdAt: now, expiresAt: now + 1000 };
  assert.deepEqual(sanitizeShopState({ seed: 5, pendingPix: pix }, now).pendingPix, pix);
  assert.equal(sanitizeShopState({ seed: 5, pendingPix: { ...pix, packId: 'offer:../x' } }, now).pendingPix, null);

  assert.deepEqual(broken.keys, { silver: 0, obsidian: 0 });
  assert.equal(broken.chests.silver.pity, 9);
  assert.equal(broken.chests.silver.freeClaimedAt, null);
  assert.deepEqual(broken.gemPacksPurchased, ['gems-80']);
  assert.equal(broken.pendingPix, null);
  assert.equal(broken.daily.offers.length, 3);
});
