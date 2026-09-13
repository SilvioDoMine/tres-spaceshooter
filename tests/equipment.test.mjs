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
  aggregateGearBonuses,
  canFuse,
  computePlayerStats,
  fusableUids,
  fuse,
  mechanicStorage,
  sanitizeInventory,
  sortEquipment,
  starterInventory,
  upgradeableSlots,
} = await import('../app/utils/equipment.ts');
const { emptyTalentBonuses } = await import('../app/utils/talents.ts');

const equipped = (overrides = {}) => ({
  weapon: null, wings: null, cockpit: null, generator: null, forcefield: null, thrusters: null, ...overrides,
});
const inventory = (items, equippedSlots = {}) => ({ nextUid: 100, items, equipped: equipped(equippedSlots) });
const cannon = (uid, rarity = 'gray') => ({ uid, defId: 'canhao-plasma', rarity });

test('below epic needs 3 identical pieces', () => {
  const inv = inventory([cannon(1), cannon(2), cannon(3)]);
  assert.equal(canFuse(inv, 1, [2]), false);
  assert.equal(canFuse(inv, 1, [2, 3]), true);

  const result = fuse(inv, 1, [2, 3]);
  assert.deepEqual(result.items, [cannon(1, 'green')]);
});

test('epic and above need only 2 pieces; mythic does not fuse', () => {
  const epic = inventory([cannon(1, 'purple'), cannon(2, 'purple')]);
  assert.equal(canFuse(epic, 1, [2]), true);
  assert.deepEqual(fuse(epic, 1, [2]).items, [cannon(1, 'orange')]);

  const mythic = inventory([cannon(1, 'red'), cannon(2, 'red')]);
  assert.equal(canFuse(mythic, 1, [2]), false);
  assert.equal(fusableUids(mythic).size, 0);
});

test('materials must be the same item, same rarity, unique and not equipped', () => {
  const inv = inventory([cannon(1), cannon(2), cannon(3), cannon(4, 'green'), { uid: 5, defId: 'lanca-ionica', rarity: 'gray' }], { weapon: 3 });
  assert.equal(canFuse(inv, 1, [2, 3]), false, 'equipped material');
  assert.equal(canFuse(inv, 1, [2, 4]), false, 'different rarity');
  assert.equal(canFuse(inv, 1, [2, 5]), false, 'different item');
  assert.equal(canFuse(inv, 1, [2, 2]), false, 'duplicated material');
});

test('equipped main piece fuses and stays equipped', () => {
  const inv = inventory([cannon(1), cannon(2), cannon(3)], { weapon: 1 });
  const result = fuse(inv, 1, [2, 3]);
  assert.equal(result.equipped.weapon, 1);
  assert.equal(result.items[0].rarity, 'green');
});

test('fusable groups account for equipped pieces', () => {
  // 2 livres + 1 equipado: a equipada é principal, dá para fundir
  assert.equal(fusableUids(inventory([cannon(1), cannon(2), cannon(3)], { weapon: 1 })).size, 3);
  // 1 livre + 1 equipado (comum precisa de 3): não dá
  assert.equal(fusableUids(inventory([cannon(1), cannon(2)], { weapon: 1 })).size, 0);
  // épico: 1 livre + 1 equipado já basta
  assert.equal(fusableUids(inventory([cannon(1, 'purple'), cannon(2, 'purple')], { weapon: 1 })).size, 2);
});

test('mechanic storage lists fusable items first', () => {
  const inv = inventory([{ uid: 9, defId: 'lanca-ionica', rarity: 'orange' }, cannon(1), cannon(2), cannon(3)]);
  assert.deepEqual(mechanicStorage(inv, 'all').map(item => item.uid), [1, 2, 3, 9]);
  assert.deepEqual(mechanicStorage(inv, 'wings'), []);
});

test('sorting by quality and by type', () => {
  const items = [cannon(1), { uid: 2, defId: 'campo-egide', rarity: 'blue' }, cannon(3, 'purple')];
  assert.deepEqual(sortEquipment(items, 'quality').map(item => item.uid), [3, 2, 1]);
  assert.deepEqual(sortEquipment(items, 'type').map(item => item.uid), [3, 1, 2]);
});

test('gear stats: main stat, unlocked abilities and talent gear bonus', () => {
  const gear = aggregateGearBonuses([cannon(1, 'blue'), { uid: 2, defId: 'campo-egide', rarity: 'gray' }]);
  assert.equal(gear.damageFlat, 31); // 12 × 2.6
  assert.equal(gear.maxHealthFlat, 70);
  assert.equal(gear.critRatePercent, 3); // verde liberado
  assert.equal(gear.attackSpeedPercent, 5); // azul liberado
  assert.equal(gear.damagePercent, 0); // laranja ainda bloqueado

  const base = { maxHealth: 250, moveSpeed: 7, projectiles: { damage: 50, shotCooldown: 0.85 } };
  const talents = { ...emptyTalentBonuses(), damagePercent: 10, gearBaseStatsPercent: 100 };
  const stats = computePlayerStats(base, talents, gear);
  assert.equal(stats.gearDamage, 62);
  assert.equal(stats.damage, Math.round((50 + 62) * 1.1));
  assert.equal(stats.maxHealth, 250 + 140);
});

test('upgrade arrow marks slots with a stronger stored item', () => {
  const inv = inventory([cannon(1), cannon(2, 'green'), { uid: 3, defId: 'campo-egide', rarity: 'gray' }], { weapon: 1 });
  assert.deepEqual([...upgradeableSlots(inv)].sort(), ['forcefield', 'weapon']);
});

test('sanitize drops unknown data and fixes equipped slots', () => {
  const clean = sanitizeInventory({
    nextUid: 2,
    items: [cannon(1), cannon(1), { uid: 4, defId: 'nope', rarity: 'gray' }, { uid: 5, defId: 'campo-egide', rarity: 'gold' }, cannon(7)],
    equipped: { weapon: 7, forcefield: 1 },
  });
  assert.deepEqual(clean.items.map(item => item.uid), [1, 7]);
  assert.equal(clean.equipped.weapon, 7);
  assert.equal(clean.equipped.forcefield, null);
  assert.equal(clean.nextUid, 8);
  assert.equal(sanitizeInventory('lixo'), null);
});

test('starter kit has one common item per slot with the weapon equipped', () => {
  const kit = starterInventory();
  assert.equal(kit.items.length, 6);
  assert.ok(kit.items.every(item => item.rarity === 'gray'));
  assert.equal(kit.equipped.weapon, 1);
});
