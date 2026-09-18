import { chapterStages, combat, group, intro, wave } from './helpers.js';

// Capítulo 2 — Estaleiro na nebulosa. Kamikazes cedo, elites no meio e minibosses no fim.
// Tier 10: COLMEIA. Tier 20: HARPIA. Depois da Colmeia, a mini-colmeia entra no elenco.
export const LEVEL_2 = {
  levelId: 'level_nebula_shipyard_002', chapter: 2, width: 10, height: 20, rewardExperience: 160,
  theme: { atmosphere: '#7a2c1c', galaxyOpacity: .55 },
  structure: 'quick', targetPlayerLevel: 23,
  stages: chapterStages([
    intro(),
    combat(1, [wave(group('ufo', 2))]),
    combat(2, [wave(group('miniasteroid', 2), group('ufo', 1)), wave(group('kamikaze', 1))]),
    combat(3, [wave(group('ufo', 1), group('ufofast', 1), group('kamikaze', 1))]),
    combat(4, [wave(group('asteroid', 1), group('ufo', 2)), wave(group('kamikaze', 2))]),
    combat(5, [wave(group('ufofast', 2), group('torusEnemy', 1)), wave(group('miniasteroid', 3))]),
    combat(6, [wave(group('compositeEnemy', 1), group('ufo', 2)), wave(group('kamikaze', 2), group('ufofast', 1))]),
    combat(7, [wave(group('asteroid', 2), group('kamikaze', 1)), wave(group('torusEnemy', 2), group('ufo', 1))]),
    combat(8, [wave(group('ufofast', 2), group('compositeEnemy', 1)), wave(group('kamikaze', 3))]),
    combat(9, [wave(group('torusEnemy', 2), group('ufofast', 2)), wave(group('compositeEnemy', 1), group('asteroid', 1), group('kamikaze', 1))]),
    combat(10, [wave(group('hiveBoss', 1, 3))], 'boss'),
    combat(11, [wave(group('ufofast', 2), group('kamikaze', 1)), wave(group('miniHive', 1), group('compositeEnemy', 1))]),
    combat(12, [wave(group('asteroid', 2), group('torusEnemy', 2)), wave(group('ufofast', 2), group('kamikaze', 1))]),
    combat(13, [wave(group('compositeEnemy', 2), group('kamikaze', 1)), wave(group('miniHive', 1), group('torusEnemy', 1), group('ufofast', 1))]),
    combat(14, [wave(group('ufofast', 3), group('torusEnemy', 1)), wave(group('miniboss', 1))]),
    combat(15, [wave(group('kamikaze', 2), group('miniHive', 1)), wave(group('asteroid', 2), group('ufofast', 2)), wave(group('torusEnemy', 2), group('kamikaze', 1))]),
    combat(16, [wave(group('compositeEnemy', 2), group('ufofast', 2)), wave(group('miniHive', 1), group('asteroid', 2), group('torusEnemy', 1))]),
    combat(17, [wave(group('miniboss', 1), group('kamikaze', 2)), wave(group('ufofast', 2), group('compositeEnemy', 2))]),
    combat(18, [wave(group('torusEnemy', 3), group('ufofast', 2)), wave(group('miniHive', 2), group('asteroid', 1)), wave(group('compositeEnemy', 2))]),
    combat(19, [wave(group('ufofast', 2), group('compositeEnemy', 2), group('miniHive', 1)), wave(group('miniboss', 1), group('torusEnemy', 2))]),
    combat(20, [wave(group('harpyBoss', 1, 3))], 'boss'),
  ], 2),
};
