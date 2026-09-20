import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../app/games/levels/index.js';
import { chapterStages, combat, group, intro, wave } from '../app/games/levels/helpers.js';
import { buildExperienceCurve, experienceForLevel, roomExperience } from '../app/utils/runExperience.js';
import { rangeCameraHeight, targetInsideView } from '../app/utils/rangeCamera.js';

// Catálogo de produção, sem inicializar stores/áudio/renderização.
const source = readFileSync(new URL('../app/composables/useEnemyManager.js', import.meta.url), 'utf8');
export const catalog = vm.runInNewContext('(' + source.match(/export const baseStats = (\{[\s\S]*?\n\});/)[1] + ')');

function simulate(chapter, bonus = () => 1) {
  const curve = buildExperienceCurve(chapter, catalog);
  let level = 1, xp = 0;
  const levels = [];
  chapter.stages.filter(s => s.type !== 'intro').forEach((stage, i) => {
    xp += roomExperience(stage, catalog, i + 1) * bonus(i);
    while (xp >= experienceForLevel(level, curve)) { xp -= experienceForLevel(level, curve); level++; }
    levels.push(level);
  });
  return levels;
}

test('early chapters split waves into 30–40 playable rooms, preserving combat tiers and unique ids', () => {
  for (const chapter of Object.values(LEVELS).filter(level => level.structure === 'quick')) {
    const rooms = chapter.stages.filter(s => s.type !== 'intro');
    assert.ok(rooms.length >= 30 && rooms.length <= 40);
    assert.ok(rooms.every(s => s.waves.length === 1));
    assert.equal(new Set(chapter.stages.map(s => s.stageId)).size, chapter.stages.length);
    assert.equal(rooms.at(-1).type, 'boss');
    assert.equal(rooms.at(-1).combatTier, 20);
  }
});

test('chapter 4 defaults to quick, chapter 5 preserves waves, boss-rush accepts five bosses', () => {
  const stages = [intro(), ...Array.from({ length: 20 }, (_, i) => combat(i + 1, [wave(group('ufo', 1)), wave(group('ufofast', 1))]))];
  assert.equal(chapterStages(stages, 4).length, 41);
  const late = chapterStages(stages, 5);
  assert.equal(late.length, 21);
  assert.ok(late.slice(1).every(s => s.waves.length === 2));
  const bosses = [intro(), ...Array.from({ length: 5 }, (_, i) => combat(i + 1, [wave(group('boss', 1))], 'boss'))];
  assert.equal(chapterStages(bosses, 6, 'boss-rush').length, 6);
});

test('normal runs reach 20–25, early EXP builds reach 25–30 without long empty stretches', () => {
  for (const chapter of Object.values(LEVELS)) {
    const normal = simulate(chapter);
    // Aprendizado II desde a terceira sala: 15% inicial, +3% por sala, teto 60%.
    const bonus = simulate(chapter, i => i < 2 ? 1 : 1 + Math.min(.6, .15 + (i - 2) * .03));
    console.log(`Capítulo ${chapter.chapter}: ${normal.length} salas; níveis ${normal.at(-1)} / ${bonus.at(-1)} com EXP; percurso ${normal.join(',')}`);
    assert.ok(normal.at(-1) >= 20 && normal.at(-1) <= 25);
    assert.ok(bonus.at(-1) >= 25 && bonus.at(-1) <= 30);
    for (let i = 0; i + 3 < normal.length; i++) assert.ok(normal[i + 3] > normal[i], 'at most two rooms without an upgrade');
  }
});

test('range fits every edge in portrait, landscape, desktop, while moving and after upgrades', () => {
  for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1920, 1080], [2560, 1080]]) {
    for (const range of [11, 13.2, 16.5, 22, 44]) for (const [x, z] of [[0, 0], [2.6, -2.6], [-8, 6]]) {
      const altitude = rangeCameraHeight(range, w / h, x, z);
      const height = 2 * altitude * Math.tan(25 * Math.PI / 360);
      const view = { x, z, width: height * w / h, height };
      for (let i = 0; i < 360; i++) {
        const angle = i * Math.PI / 180;
        assert.ok(targetInsideView({ x: range * Math.cos(angle), z: range * Math.sin(angle) }, view));
      }
    }
  }
  assert.ok(rangeCameraHeight(22, .5) > rangeCameraHeight(11, .5));
  assert.equal(targetInsideView({ x: 100, z: 0 }, { x: 0, z: 0, width: 30, height: 30 }), false);
});

test('portrait camera keeps the stationary attack ring close to both screen edges', () => {
  for (const range of [11, 13.5, 19, 25]) {
    const aspect = 390 / 844;
    const altitude = rangeCameraHeight(range, aspect);
    const width = 2 * altitude * Math.tan(25 * Math.PI / 360) * aspect;
    assert.ok(2 * range / width >= .92);
    assert.ok(2 * range / width < 1);
  }
});
