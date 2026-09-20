import { chapterStages, combat, group, intro, wave } from './helpers.js';

// Capítulo 3 — Comando da frota. Liberado depois da Harpia: traz todos os inimigos dos capítulos anteriores,
// incluindo mini-colmeias e mini-harpias. Tier 10: BASTIÃO. Tier 20: COLOSSO.
export const LEVEL_3 = {
  levelId: 'level_fleet_command_003', chapter: 3, width: 10, height: 20, rewardExperience: 260,
  theme: { atmosphere: '#1d3f86', galaxyOpacity: .65 },
  structure: 'quick', targetPlayerLevel: 23,
  stages: chapterStages([
    intro(),
    combat(1, [wave(group('ufofast', 2), group('miniasteroid', 2), group('kamikaze', 1), group('ufo', 1))]),
    combat(2, [wave(group('miniHive', 1), group('ufo', 2)), wave(group('kamikaze', 2))]),
    combat(3, [wave(group('miniHarpy', 1), group('torusEnemy', 1)), wave(group('asteroid', 1), group('kamikaze', 2))]),
    combat(4, [wave(group('compositeEnemy', 1), group('miniHive', 1), group('ufofast', 1)), wave(group('torusEnemy', 2), group('miniasteroid', 2))]),
    combat(5, [wave(group('miniboss', 1)), wave(group('kamikaze', 2), group('miniHarpy', 1))]),
    combat(6, [wave(group('ufofast', 3), group('compositeEnemy', 1)), wave(group('asteroid', 2), group('torusEnemy', 1))]),
    combat(7, [wave(group('kamikaze', 2), group('miniHive', 1), group('torusEnemy', 1)), wave(group('miniHarpy', 1), group('compositeEnemy', 1), group('ufo', 1))]),
    combat(8, [wave(group('asteroid', 2), group('ufofast', 2), group('kamikaze', 1)), wave(group('compositeEnemy', 2), group('miniHarpy', 1))]),
    combat(9, [wave(group('miniboss', 1), group('ufofast', 2)), wave(group('miniHive', 1), group('kamikaze', 2), group('compositeEnemy', 1))]),
    combat(10, [wave(group('bastionBoss', 1, 3))], 'boss'),
    combat(11, [wave(group('ufofast', 3), group('miniHarpy', 1)), wave(group('miniHive', 2), group('torusEnemy', 1))]),
    combat(12, [wave(group('miniboss', 1), group('kamikaze', 2)), wave(group('asteroid', 2), group('ufofast', 1), group('miniHarpy', 1))]),
    combat(13, [wave(group('compositeEnemy', 2), group('miniHive', 1)), wave(group('torusEnemy', 2), group('kamikaze', 2), group('miniasteroid', 2))]),
    combat(14, [wave(group('miniHarpy', 2), group('torusEnemy', 1)), wave(group('miniboss', 1), group('compositeEnemy', 1))]),
    combat(15, [wave(group('kamikaze', 3), group('miniHive', 1)), wave(group('compositeEnemy', 2), group('ufofast', 2)), wave(group('torusEnemy', 2), group('miniHarpy', 1))]),
    combat(16, [wave(group('miniboss', 1), group('ufofast', 2)), wave(group('kamikaze', 3), group('compositeEnemy', 1), group('miniHarpy', 1))]),
    combat(17, [wave(group('asteroid', 2), group('miniHive', 1), group('torusEnemy', 1)), wave(group('ufofast', 2), group('miniHarpy', 2)), wave(group('compositeEnemy', 2))]),
    combat(18, [wave(group('miniboss', 2)), wave(group('kamikaze', 3), group('ufofast', 2), group('ufo', 1))]),
    combat(19, [wave(group('compositeEnemy', 2), group('miniHive', 1), group('torusEnemy', 2)), wave(group('miniHarpy', 2), group('kamikaze', 2)), wave(group('miniboss', 1), group('asteroid', 2))]),
    combat(20, [wave(group('colossusBoss', 1, 3))], 'boss'),
  ], 3),
};
