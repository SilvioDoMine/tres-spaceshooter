import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { ref, shallowRef, computed, reactive } from 'vue';
import * as gameSpeed from '../app/utils/gameSpeed.js';
import { buildExperienceCurve, experienceForLevel } from '../app/utils/runExperience.js';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
        try { return nextResolve(specifier + '.js', context); }
        catch { return nextResolve(specifier + '.ts', context); }
      }
      throw error;
    }
  },
});
const { TALENTS } = await import('../app/data/talents.ts');
const { aggregateTalentBonuses, emptyTalentBonuses, pickTalent } = await import('../app/utils/talents.ts');
const { computePlayerStats } = await import('../app/utils/equipment.ts');
const { combatAttributes, incomingHit, outgoingHit, withRunSkills, adrenalineMultiplier, headshotKills, siphonHeal, experienceBonus, emergencyRepairHeal } = await import('../app/utils/shipAttributes.ts');
const elemental = await import('../app/utils/elementalStatus.js');
const patterns = await import('../app/utils/combatPatterns.js');
const base = { maxHealth: 250, maxHealthPerLevel: 50, moveSpeed: 7, projectiles: { damage: 50, shotCooldown: .85 } };
const attrs = overrides => combatAttributes({ ...emptyTalentBonuses(), ...overrides });

test('critical rolls per contact, adding bonus to 2x without multiplying the projectile permanently', () => {
  const stats = attrs({ critRatePercent: 25, critDamagePercent: 30 });
  const critical = outgoingHit(50, stats, () => .249);
  assert.equal(critical.critical, true);
  assert.ok(Math.abs(critical.damage - 115) < 1e-10);
  assert.deepEqual(outgoingHit(50, stats, () => .25), { critical: false, damage: 50 });
  assert.equal(outgoingHit(25, stats, () => .9).damage, 25); // bounce keeps its own base
  assert.equal(outgoingHit(50, attrs({}), () => 0).critical, false);
});

test('run skills add crit and dodge on top of permanent attributes and clamp chances', () => {
  const stats = attrs({ critRatePercent: 25, critDamagePercent: 30, dodgePercent: 95 });
  const boosted = withRunSkills(stats, { criticalChance: .1, criticalDamage: .2, dodgeChance: .2 });
  assert.ok(Math.abs(boosted.criticalChance - .35) < 1e-12);
  assert.ok(Math.abs(boosted.criticalDamage - 2.5) < 1e-12);
  assert.equal(boosted.dodgeChance, 1);
  assert.equal(boosted.heartHeal, stats.heartHeal);
  assert.deepEqual(withRunSkills(stats, {}), stats);
});

test('adrenaline scales with missing health and caps at 20 percent health', () => {
  assert.equal(adrenalineMultiplier(.5, 250, 250), 1);
  assert.ok(Math.abs(adrenalineMultiplier(.5, 150, 250) - 1.25) < 1e-12);
  assert.equal(adrenalineMultiplier(.5, 50, 250), 1.5);
  assert.equal(adrenalineMultiplier(.5, 0, 250), 1.5);
  assert.equal(adrenalineMultiplier(0, 10, 250), 1);
});

test('headshot never kills bosses or boss fragments', () => {
  for (const category of ['common', 'mini', 'elite']) {
    assert.equal(headshotKills(.04, category, () => .039), true);
    assert.equal(headshotKills(.04, category, () => .04), false);
  }
  for (const category of ['boss', 'fragment']) assert.equal(headshotKills(1, category, () => 0), false);
  assert.equal(headshotKills(0, 'common', () => 0), false);
});

test('siphon rolls its chance per kill and heals a fixed 5 percent of max health', () => {
  assert.equal(siphonHeal(.08, 400, () => .079), 20);
  assert.equal(siphonHeal(.08, 400, () => .08), 0);
  assert.equal(siphonHeal(0, 400, () => 0), 0);
});

test('run skill cards feed combat stats, attack speed and adrenaline in the real stores', () => {
  const { context, run, stats, skills } = runHarness({ critRatePercent: 5 });
  const take = (id, level) => skills.currentSkills.push({ ...context.SkillsList[id], currentLevel: level });
  take('precise_aim', 2); take('evasive_maneuver', 3); take('attack_speed', 5); take('adrenaline', 1);
  take('headshot', 2); take('siphon', 1);
  assert.ok(Math.abs(stats.combatStats.criticalChance - .23) < 1e-12);
  assert.ok(Math.abs(stats.combatStats.criticalDamage - 2.4) < 1e-12);
  assert.ok(Math.abs(stats.combatStats.dodgeChance - .2) < 1e-12);
  assert.equal(stats.getAttackSpeedMultiplier, 1.4);
  assert.ok(Math.abs(stats.getProjectileSpeedMultiplier - Math.sqrt(1.4)) < 1e-12);
  assert.equal(stats.headshotChance, .07);
  assert.equal(stats.siphonChance, .05);
  assert.equal(stats.adrenalineDamageMultiplier(), 1);
  run.takeDamage(run.maxHealth * .8, 'environment');
  assert.ok(Math.abs(stats.adrenalineDamageMultiplier() - 1.3) < 1e-9);
});

test('elemental shot cards build the projectile payload in the real stores', () => {
  const { context, stats, skills } = runHarness();
  assert.equal(stats.elementalPayload(11), null);
  const take = (id, level) => skills.currentSkills.push({ ...context.SkillsList[id], currentLevel: level });
  take('fire_shot', 1); take('ice_shot', 2); take('lightning_shot', 1);
  assert.deepEqual(JSON.parse(JSON.stringify(stats.elementalPayload(13.5))), {
    fire: { burn: .15, duration: 3 },
    ice: { damage: .5, shatter: .5, duration: 2 },
    lightning: { bonus: .25, chains: 2, range: 13.5 },
  });
});

test('every room load wipes the world effects left in the previous room', () => {
  const { run, equipmentEffects } = runHarness();
  const afterStart = equipmentEffects.roomResets;
  assert.ok(afterStart > 0, 'a sala inicial já entra limpa');
  run.loadStage(run.currentStage);
  assert.equal(equipmentEffects.roomResets, afterStart + 1);
});

test('fire trail card exposes the trail parameters in the real stores', () => {
  const { context, stats, skills } = runHarness();
  assert.equal(stats.fireTrail, null);
  skills.currentSkills.push({ ...context.SkillsList.fire_trail, currentLevel: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(stats.fireTrail)), { damage: .12, width: 1 });
  // 12% do dano já multiplicado pelas cartas de dano, não do dano base
  skills.currentSkills.push({ ...context.SkillsList.damage_percentage, currentLevel: 5 });
  assert.equal(stats.damage * stats.fireTrail.damage, 112.5 * .12);
});

test('player freezes from an elemental attack, thaws on other damage and burns over time', () => {
  const { run, messages } = runHarness();
  run.takeDamage(20, { source: 'attack', elements: { ice: { damage: .5, shatter: .5, duration: 1 } } });
  assert.equal(run.currentHealth, 300 - 20 - 10);
  assert.ok(run.getPlayerElements().freeze);
  assert.equal(messages.at(-1)[1], 'freeze');
  run.takeDamage(30, 'environment'); // outra fonte quebra o gelo: +10 de dano bruto
  assert.equal(run.getPlayerElements().freeze, null);
  assert.equal(run.currentHealth, 300 - 20 - 10 - 30 - 10);
  const before = run.currentHealth;
  run.takeDamage(40, { source: 'attack', elements: { fire: { burn: .25, duration: 2 } } });
  for (let i = 0; i < 40; i++) run.updateElements(.05);
  assert.ok(Math.abs(run.currentHealth - (before - 40 - 20)) < 1e-9);
  assert.ok(messages.some(m => m[1] === 'burn'));
  run.loadStage({ type: 'intro', width: 30, height: 30, door: {}, playerStartPosition: { x: 0, y: 0, z: 0 } });
  run.takeDamage(10, { source: 'attack', elements: { ice: { damage: 0, shatter: 0, duration: 5 } } });
  run.loadStage({ type: 'intro', width: 30, height: 30, door: {}, playerStartPosition: { x: 0, y: 0, z: 0 } });
  assert.equal(run.getPlayerElements().freeze, null); // trocar de sala limpa os efeitos
});

test('experience bonus grows per room up to its cap; emergency repair rolls 25–75 percent of max health', () => {
  const level = { value: .1, perRoom: .02, max: .4 };
  assert.equal(experienceBonus(null, 10), 0);
  assert.equal(experienceBonus(level, 0), .1);
  assert.ok(Math.abs(experienceBonus(level, 5) - .2) < 1e-12);
  assert.equal(experienceBonus(level, 99), .4);
  const repair = { min: .25, max: .75 };
  assert.equal(emergencyRepairHeal(1000, repair, () => 0), 250);
  assert.equal(emergencyRepairHeal(1000, repair, () => .5), 500);
  assert.equal(emergencyRepairHeal(1000, repair, () => .999999), 750);
});

test('Aprendizado counts each cleared room once after being taken and multiplies kill EXP in the real stores', () => {
  const { context, run, stats, skills } = runHarness();
  const room = { type: 'combat', width: 30, height: 24, door: {}, playerStartPosition: { x: 0, y: 0, z: 0 } };
  run.loadStage(room); run.completeStage();
  assert.equal(skills.experienceRooms, 0, 'rooms before the card do not count');
  assert.equal(stats.experienceMultiplier, 1);
  skills.selectSkill({ ...context.SkillsList.exp_growth, currentLevel: 0 });
  assert.ok(Math.abs(stats.experienceMultiplier - 1.1) < 1e-12);
  run.loadStage(room); run.completeStage(); run.completeStage();
  run.loadStage(room); run.completeStage();
  assert.equal(skills.experienceRooms, 2, 'each room counts once');
  assert.ok(Math.abs(stats.experienceMultiplier - 1.14) < 1e-12);
  skills.selectSkill({ ...skills.currentSkills[0], currentLevel: 1 });
  assert.ok(Math.abs(stats.experienceMultiplier - 1.21) < 1e-12, 'upgrading keeps the rooms already cleared');
  for (let i = 0; i < 30; i++) { run.loadStage(room); run.completeStage(); }
  assert.ok(Math.abs(stats.experienceMultiplier - 1.6) < 1e-12, 'capped');
  assert.doesNotMatch(readFileSync(new URL('../app/composables/useEnemyManager.js', import.meta.url), 'utf8'),
    /addExp\(expDropped\)/, 'kills apply the multiplier');
});

test('Reparo de Emergência heals instantly, never takes a slot and is only offered while hurt', () => {
  const { context, run, skills, messages } = runHarness();
  const card = context.SkillsList.emergency_repair;
  assert.equal(skills.isOfferable(card), false, 'not offered at full health');
  run.takeDamage(200, 'environment');
  assert.equal(skills.isOfferable(card), true);
  for (let i = 0; i < 3; i++) skills.selectSkill({ ...card, currentLevel: 0 });
  assert.equal(skills.currentSkills.length, 0);
  assert.ok(run.currentHealth >= 100 + 75 && run.currentHealth <= 300);
  assert.equal(messages.at(-1)[1], 'heal');
  assert.equal(skills.isOfferable(card), run.currentHealth < run.maxHealth, 'still repeatable while hurt');
  const maxed = { ...context.SkillsList.siphon };
  skills.currentSkills.push({ ...maxed, currentLevel: 1 });
  assert.equal(skills.isOfferable(maxed), false, 'regular cards still max out');
});

test('collision hits hard, grants a collision-only grace of 1.5 s and knocks the ship away from the enemy', () => {
  const { run } = runHarness();
  run.setMaxHealth(2000); run.healPlayer(2000, false);
  run.setPlayerPosition(0, 0, 0);
  assert.equal(run.takeCollision(800, { x: -1, z: 0 }), true);
  assert.equal(run.currentHealth, 1200);
  assert.equal(run.getCollisionGrace(), patterns.COLLISION_IFRAME);
  assert.equal(run.takeCollision(800, { x: 1, z: 0 }), false, 'immune to another collision');
  assert.equal(run.currentHealth, 1200);
  run.takeDamage(100, 'attack');
  assert.equal(run.currentHealth, 1100, 'shots still land during the collision grace');
  let pushed = 0;
  for (let i = 0; i < 149; i++) {
    const step = run.updateCollision(.01);
    assert.ok(step.x >= 0 && step.z === 0, 'pushed straight away from the enemy');
    pushed += step.x;
  }
  assert.ok(pushed > 2 && pushed < 3.5, `knockback distance ${pushed.toFixed(2)}`);
  assert.equal(run.takeCollision(800, { x: 1, z: 0 }), false);
  run.updateCollision(.02);
  assert.equal(run.getCollisionGrace(), 0);
  assert.equal(run.takeCollision(800, { x: 1, z: 0 }), true);
  assert.equal(run.currentHealth, 300, 'another 800 would kill this ship');
});

test('dodge affects attacks and collisions, never the environment; collision applies flat then percent and clamps at zero', () => {
  const stats = attrs({ dodgePercent: 100, collisionReductionFlat: 15, collisionReductionPercent: 10 });
  assert.deepEqual(incomingHit(100, 'attack', stats, () => 0), { damage: 0, dodged: true });
  assert.deepEqual(incomingHit(100, 'collision', stats, () => 0), { damage: 0, dodged: true });
  assert.deepEqual(incomingHit(100, 'collision', stats, () => .99), { damage: 0, dodged: true });
  assert.equal(incomingHit(100, 'environment', stats, () => 0).dodged, false);
  const noDodge = attrs({ collisionReductionFlat: 15, collisionReductionPercent: 10 });
  assert.deepEqual(incomingHit(100, 'collision', noDodge, () => 0), { damage: 76.5, dodged: false });
  assert.equal(incomingHit(10, 'collision', stats).damage, 0);
  assert.equal(incomingHit(100, 'environment', stats).damage, 100);
});

test('all maxed cards feed ship attributes with unchanged catalog amounts', () => {
  const stars = Object.fromEntries(TALENTS.map(t => [t.id, t.maxStars]));
  const stats = computePlayerStats(base, aggregateTalentBonuses(stars), emptyTalentBonuses());
  assert.equal(TALENTS.length, 25);
  assert.equal(stats.maxHealth, 460);
  assert.equal(stats.damage, 92);
  assert.equal(stats.criticalChance, .15);
  assert.equal(stats.criticalDamage, 2.55);
  assert.equal(stats.dodgeChance, .15);
  assert.equal(stats.heartHeal, 120); // (25 base + 25 + 50) * 1.2
  assert.equal(stats.levelUpHealFraction, .1);
  assert.equal(stats.startingSkillChoices, 1);
  assert.equal(stats.skillRerolls, 1);
  assert.equal(stats.battleGoldMultiplier, 1.2);
  assert.equal(stats.collisionReductionFlat, 45);
  assert.equal(stats.collisionReductionFraction, .1);
  assert.ok(Math.abs(stats.moveSpeed - 7.35) < 1e-10);
  assert.equal(stats.shotCooldown, .85 / 1.05);
});

test('no talents means no skill rerolls; Táticas grants the first one', () => {
  assert.equal(attrs({}).skillRerolls, 0);
  assert.equal(attrs({ skillRerolls: 1 }).skillRerolls, 1);
});

test('Glória is guaranteed on the 5th draw and Táticas on the 10th, even for saves already past them', () => {
  const draws = n => ({ vigor: Math.min(n, 5), forca: Math.max(0, n - 5) });
  const pick = stars => pickTalent(stars, () => .999).id; // sem garantia cai no último do pool
  for (let n = 0; n < 4; n++) assert.notEqual(pick(draws(n)), 'gloria');
  assert.equal(pick(draws(4)), 'gloria');
  assert.equal(pick({ ...draws(8), gloria: 1 }), 'taticas');
  assert.notEqual(pick({ ...draws(7), gloria: 1 }), 'taticas');
  assert.equal(pick(draws(12)), 'gloria'); // save antigo sem nenhuma das duas: Glória primeiro, depois Táticas
  assert.equal(pick({ ...draws(12), gloria: 1 }), 'taticas');
  assert.notEqual(pick({ ...draws(12), gloria: 1, taticas: 1 }), 'taticas');
});

test('refinement scales flat equipment stats, leaving percent and talents untouched', () => {
  const talents = { ...emptyTalentBonuses(), damageFlat: 10, gearBaseStatsPercent: 10 };
  const gear = { ...emptyTalentBonuses(), damageFlat: 20, critRatePercent: 5, heartHealFlat: 10 };
  const stats = computePlayerStats(base, talents, gear);
  assert.equal(stats.damage, 82);
  assert.equal(stats.criticalChance, .05);
  assert.equal(stats.heartHeal, 36);
});

// Executa os stores reais com Vue; isola apenas áudio, persistência e cena 3D.
function runHarness(overrides = {}) {
  const messages = [], sounds = [];
  const permanent = computePlayerStats(base, { ...emptyTalentBonuses(), ...overrides }, emptyTalentBonuses());
  const equipmentEffects = {
    initialize() {}, cleanup() {}, onDodge() {}, blockIncoming: () => false,
    onPlayerDamaged() {}, resetRoom() { equipmentEffects.roomResets++; }, roomResets: 0,
  };
  const context = vm.createContext({
    ref, shallowRef, computed, Math, console: { log() {}, warn() {} },
    computePlayerStats, emptyTalentBonuses, incomingHit, withRunSkills, adrenalineMultiplier, experienceBonus, emergencyRepairHeal, ...elemental, ...patterns,
    COMBAT_BASE: { heartDropChance: .1 },
    defineStore: (_id, setup) => { let store; return () => store ??= reactive(setup()); },
    useEquipmentStore: () => ({ stats: permanent }),
    useEquipmentEffectsStore: () => equipmentEffects,
    useEnemyManager: () => ({ cleanup() {} }),
    useCombatTextStore: () => ({ emitForTarget: (...args) => messages.push(args) }),
    useModal: () => ({ open() {}, close() {} }),
    useLevelAccount: () => ({}),
    useAudio: () => ({ playSound() {}, playHeartSound() {}, playLootSound: kind => sounds.push(kind), startBackgroundMusicAbafado() {}, stopBackgroundMusicAbafado() {} }),
    useSpatialDilation: () => ({ reset() {} }),
    useChapterProgressStore: () => ({ progress: { completed: [] } }),
    ...gameSpeed,
    buildExperienceCurve, experienceForLevel, baseStats: {},
    emitImpact() {},
  });
  function load(file, names) {
    let source = readFileSync(new URL('../app/' + file, import.meta.url), 'utf8')
      .replace(/^import .*$/gm, '').replace(/if\s*\(import.meta.hot\)[\s\S]*$/, '')
      .replaceAll('export ', '').replaceAll('import.meta.server', 'true');
    if (file.endsWith('.ts')) source = stripTypeScriptTypes(source);
    vm.runInContext(source + '\n' + names.map(n => 'globalThis.' + n + '=' + n + ';').join('\n'), context);
  }
  load('stores/SkillStore.js', ['useSkillStore', 'SkillsList']);
  load('stores/playerStats.ts', ['usePlayerStats']);
  load('stores/useHeartStore.ts', ['useHeartStore']);
  load('stores/useLootStore.ts', ['useLootStore', 'splitExp', 'EXP_FLIES_ON_DROP']);
  load('stores/currentRunStore.ts', ['useCurrentRunStore', 'PlayerBaseStats']);
  const stage = { type: 'intro', width: 30, height: 30, door: {}, playerStartPosition: { x: 0, y: 0, z: 0 } };
  const config = { stages: [stage] };
  const run = context.useCurrentRunStore();
  run.gameStart(config);
  return { context, run, stats: context.usePlayerStats(), skills: context.useSkillStore(),
    hearts: context.useHeartStore(), loot: context.useLootStore(), config, messages, sounds, permanent,
    equipmentEffects };
}

test('coins stay on the floor even under the ship and only fly in once the room is cleared', () => {
  const { run, loot, sounds } = runHarness();
  run.isStageCompleted = false;
  loot.dropGold({ x: 0, z: 0 }, 7, () => 0);
  loot.dropGold({ x: 5, z: 0 }, 3, () => 0);
  loot.dropGold({ x: 1, z: 1 }, 0, () => 0);
  assert.equal(loot.loot.length, 2, 'enemies without gold drop no coin');
  for (let i = 0; i < 20; i++) loot.update(.1);
  assert.equal(loot.loot.length, 2, 'touching a coin does not collect it');
  assert.equal(run.currentGold, 0);
  assert.equal(sounds.length, 0);

  run.gameState = 'paused';
  run.isStageCompleted = true;
  loot.update(1);
  assert.equal(loot.loot[0].delay, -1, 'paused game does not start the magnet');

  run.gameState = 'playing';
  loot.update(.01);
  assert.equal(sounds.join(), 'magnet');
  assert.ok(loot.loot.find(c => c.value === 7).flight > 0, 'nearest coin flies first');
  assert.equal(loot.loot.find(c => c.value === 3).flight, -1, 'farther coin waits its turn');
  for (let i = 0; i < 20; i++) loot.update(.1);
  assert.equal(loot.loot.length, 0);
  assert.equal(run.currentGold, 10, 'gold is credited when the coins reach the ship');
  assert.equal(sounds.filter(s => s === 'coin').length, 2);
  assert.equal(loot.consumeBursts().length, 2);
});

test('EXP splits into gems that keep the total, turn special when large and stay capped per kill', () => {
  const { context } = runHarness();
  const sum = gems => gems.reduce((total, gem) => total + gem.value, 0);
  assert.equal(context.splitExp(0).length, 0);
  assert.equal(context.splitExp(22).map(gem => gem.tier).join(), '0,0,0');
  assert.equal(sum(context.splitExp(22)), 22);
  const boss = context.splitExp(950);
  assert.equal(sum(boss), 950);
  assert.equal(boss.filter(gem => gem.tier === 1).length, 9);
  const huge = context.splitExp(100000);
  assert.ok(huge.length <= 12);
  assert.equal(sum(huge), 100000);
});

test('EXP gems wait on the floor, fly in after the room is cleared and grant in-run EXP on arrival', () => {
  const { run, loot, sounds, context } = runHarness();
  assert.equal(context.EXP_FLIES_ON_DROP, false, 'EXP only flies at the end of the room for now');
  run.isStageCompleted = false;
  loot.dropExp({ x: 0, z: 0 }, 45, () => 0);
  assert.equal(loot.loot.length, 5);
  for (let i = 0; i < 20; i++) loot.update(.1);
  assert.equal(run.currentExp, 0, 'killing does not grant EXP directly');
  run.isStageCompleted = true;
  for (let i = 0; i < 30; i++) loot.update(.1);
  assert.equal(loot.loot.length, 0);
  assert.equal(run.currentExp, 45);
  assert.equal(sounds.filter(s => s === 'exp').length, 5);
});

test('leaving the room while loot is flying still grants it exactly once', () => {
  const { run, loot, config } = runHarness();
  run.isStageCompleted = false;
  loot.dropGold({ x: 0, z: 0 }, 5, () => 0);
  loot.dropExp({ x: 8, z: 0 }, 40, () => 0);
  loot.update(.5);
  run.isStageCompleted = true;
  loot.update(.2);
  assert.ok(loot.loot.some(item => item.flight > 0), 'some loot is mid-flight');
  assert.ok(loot.loot.length > 0, 'nothing has arrived yet');
  run.loadStage(config.stages[0]);
  assert.equal(loot.loot.length, 0);
  assert.equal(run.currentGold, 5);
  assert.equal(run.currentExp, 40);
  for (let i = 0; i < 20; i++) loot.update(.1);
  assert.equal(run.currentGold, 5, 'no double credit after the room change');
  assert.equal(run.currentExp, 40);
});

test('uncollected loot is kept when changing rooms', () => {
  const { run, loot, config } = runHarness();
  run.isStageCompleted = false;
  loot.dropGold({ x: 0, z: 0 }, 4, () => 0);
  loot.dropExp({ x: 0, z: 0 }, 30, () => 0);
  run.loadStage(config.stages[0]);
  assert.equal(loot.loot.length, 0);
  assert.equal(run.currentGold, 4);
  assert.equal(run.currentExp, 30);
});

test('run starts with permanent attributes, initial choice and extra reroll; upgrades and rooms retain them', () => {
  const { run, stats, skills, config } = runHarness({
    maxHealthFlat: 50, damageFlat: 10, moveSpeedPercent: 5,
    attackSpeedPercent: 5, startingSkillChoices: 1, skillRerolls: 1,
  });
  assert.equal(run.maxHealth, 350);
  assert.equal(run.currentHealth, 350);
  assert.equal(stats.damage, 60);
  assert.equal(run.shotCooldownTotal, .85 / 1.05);
  assert.equal(run.skillRerollCount, 1);
  assert.equal(skills.upgradeQueueCount, 1);
  skills.update(.01);
  const option = skills.skillOptions[0];
  assert.equal(option.reRolls, 1);
  skills.refreshSkill(option);
  assert.equal(skills.skillOptions[0].reRolls, 0);
  skills.refreshSkill(skills.skillOptions[0]);
  assert.equal(skills.skillOptions[0].reRolls, 0);
  skills.currentSkills = [{ id: 'general_speed', currentLevel: 1, levels: { 1: { value: 1.3 } } }];
  run.loadStage(config.stages[0]);
  assert.ok(Math.abs(run.currentMoveSpeed - 7.35 * 1.3) < 1e-10);
  run.gameStart(config);
  assert.equal(stats.getSpeedMultiplier, 1);
  assert.ok(Math.abs(run.currentMoveSpeed - 7.35) < 1e-10);
});

test('natural HP progression grants 50 per level and remains separate from the HP card', () => {
  const { context, run, stats, skills } = runHarness();
  const expected = new Map([[1, 300], [2, 350], [5, 500], [10, 750]]);
  assert.equal(run.maxHealth, expected.get(1));
  for (let level = 2; level <= 10; level++) {
    run.addExp(run.expToNextLevel);
    if (expected.has(level)) assert.equal(run.maxHealth, expected.get(level));
  }
  assert.equal(run.currentHealth, 750, 'the newly gained maximum HP is available immediately');

  skills.selectSkill({ ...context.SkillsList.health_percentage, currentLevel: 0 });
  stats.update(.01);
  assert.equal(run.maxHealth, 800, 'the HP card still adds its own 20% bonus');
  assert.equal(run.currentHealth, 800);
});

test('actual run heals on level-up, accumulates fractional gold, and distinguishes attack/collision/environment', () => {
  const { run, messages } = runHarness({ maxHealthFlat: 50, levelUpHealPercent: 10,
    battleGoldPercent: 20, dodgePercent: 100, collisionReductionFlat: 15, collisionReductionPercent: 10 });
  run.takeDamage(100, 'attack');
  assert.equal(run.currentHealth, 350);
  assert.equal(messages.at(-1)[1], 'dodge');
  run.takeDamage(100, 'collision');
  assert.equal(run.currentHealth, 350, 'dodge also avoids collisions');
  assert.equal(messages.at(-1)[1], 'dodge');
  run.takeDamage(100, 'environment');
  assert.equal(run.currentHealth, 250);
  run.addExp(100);
  assert.equal(run.currentHealth, 340);
  for (let i = 0; i < 5; i++) run.addGold(1);
  assert.equal(run.currentGold, 6);
});

test('hearts fly into the ship with bonuses, remain when full or paused, and clear on room changes', () => {
  const { run, hearts, config, messages } = runHarness({ heartHealFlat: 75, heartHealPercent: 20 });
  hearts.tryDrop({ x: 0, z: 0 }, () => 0);
  hearts.update(.1);
  assert.equal(hearts.hearts.length, 1);
  assert.equal(hearts.hearts[0].flight, -1, 'full health does not pull the heart');
  assert.deepEqual(messages.at(-1).slice(1), ['full', 'VIDA CHEIA']);
  hearts.update(.1);
  assert.equal(messages.filter(m => m[1] === 'full').length, 1, 'standing on the heart warns only once');
  run.takeDamage(150, 'environment');
  run.gameState = 'paused';
  hearts.update(1);
  assert.equal(run.currentHealth, 150);
  run.gameState = 'playing';
  hearts.update(.1);
  assert.equal(hearts.hearts[0].flight, 0, 'damaged ship starts pulling the heart');
  assert.equal(run.currentHealth, 150, 'heals only when the heart reaches the ship');
  hearts.update(1);
  assert.equal(run.currentHealth, 270);
  assert.equal(hearts.hearts.length, 0);
  assert.equal(hearts.consumeBursts().length, 1);
  assert.equal(hearts.consumeBursts().length, 0);
  hearts.tryDrop({ x: 10, z: 10 }, () => 0);
  run.loadStage(config.stages[0]);
  assert.equal(hearts.hearts.length, 0);
});

test('hearts fly to the ship once the room is cleared, nearest first, and still heal if the room is left mid-flight', () => {
  const { run, hearts, config } = runHarness();
  run.isStageCompleted = false;
  hearts.tryDrop({ x: 10, z: 0 }, () => 0);
  hearts.tryDrop({ x: 4, z: 0 }, () => 0);
  hearts.update(1);
  assert.ok(hearts.hearts.every(heart => heart.flight === -1), 'far hearts wait on the floor');

  run.takeDamage(200, 'environment');
  run.isStageCompleted = true;
  hearts.update(.01);
  assert.ok(hearts.hearts.find(heart => heart.startX === 4).flight >= 0, 'nearest heart flies first');
  assert.equal(hearts.hearts.find(heart => heart.startX === 10).flight, -1, 'farther heart waits its turn');
  for (let i = 0; i < 10; i++) hearts.update(.1);
  assert.equal(hearts.hearts.length, 0);
  assert.equal(run.currentHealth, 150, 'both hearts healed 25');

  hearts.tryDrop({ x: 6, z: 0 }, () => 0);
  hearts.update(.1);
  assert.ok(hearts.hearts[0].flight > 0);
  run.loadStage(config.stages[0]);
  assert.equal(hearts.hearts.length, 0);
  assert.equal(run.currentHealth, 175, 'heart mid-flight still heals after leaving');
});

test('full-health warning only repeats after leaving the heart completely', () => {
  const { run, hearts, messages } = runHarness();
  const warnings = () => messages.filter(m => m[1] === 'full').length;
  hearts.tryDrop({ x: 0, z: 0 }, () => 0);
  const player = run.getPlayerPosition();
  player.x = 2; // dentro do alcance de coleta, mas longe de passar por cima
  hearts.update(.1);
  assert.equal(warnings(), 0, 'full health only warns when passing over the heart');
  player.x = 0;
  hearts.update(.1);
  assert.equal(warnings(), 1);
  player.x = 1.5; // saiu de cima do coração, mas ainda encostado
  hearts.update(.1);
  player.x = 0;
  hearts.update(.1);
  assert.equal(warnings(), 1);
  player.x = 3;
  hearts.update(.1);
  player.x = 0;
  hearts.update(.1);
  assert.equal(warnings(), 2);
  assert.equal(hearts.hearts.length, 1);
});
