import { combat, group, intro, wave } from './helpers.js';

// The intro is outside the room count; the following entries are playable rooms 1–20.
export const LEVEL_1 = {
  levelId: 'level_open_space_001', chapter: 1, width: 10, height: 20, rewardExperience: 80,
  theme: { atmosphere: '#432097', galaxyOpacity: .35 },
  stages: [
    intro(),
    combat(1, [wave(group('miniasteroid', 2))]),
    combat(2, [wave(group('miniasteroid', 3))]),
    combat(3, [wave(group('miniasteroid', 3), group('ufo', 1))]),
    combat(4, [wave(group('miniasteroid', 3), group('ufo', 1)), wave(group('miniasteroid', 2))]),
    combat(5, [wave(group('miniasteroid', 2), group('ufo', 1)), wave(group('miniasteroid', 1), group('ufofast', 1))]),
    combat(6, [wave(group('miniasteroid', 3), group('ufofast', 2))]),
    combat(7, [wave(group('miniasteroid', 2), group('ufo', 1), group('ufofast', 1)), wave(group('miniasteroid', 2), group('ufo', 1))]),
    combat(8, [wave(group('miniasteroid', 3), group('ufofast', 1)), wave(group('miniasteroid', 2), group('ufofast', 2))]),
    combat(9, [wave(group('miniasteroid', 3), group('ufofast', 2), group('ufo', 1)), wave(group('miniasteroid', 3), group('ufofast', 2))]),
    combat(10, [wave(group('asteroidBoss', 1, 3))], 'boss'),
    combat(11, [wave(group('miniasteroid', 2), group('asteroid', 1)), wave(group('miniasteroid', 2), group('asteroid', 1))]),
    combat(12, [wave(group('miniasteroid', 2), group('asteroid', 1), group('ufofast', 1)), wave(group('miniasteroid', 2), group('asteroid', 1), group('ufofast', 1), group('torusEnemy', 1))]),
    combat(13, [wave(group('miniasteroid', 2), group('asteroid', 1), group('ufofast', 1), group('torusEnemy', 1)), wave(group('miniasteroid', 1), group('asteroid', 2), group('ufofast', 1), group('torusEnemy', 1), group('compositeEnemy', 1))]),
    combat(14, [wave(group('miniasteroid', 1), group('asteroid', 1), group('ufofast', 1), group('torusEnemy', 1), group('compositeEnemy', 1)), wave(group('miniasteroid', 1), group('asteroid', 2), group('ufofast', 1), group('torusEnemy', 1), group('compositeEnemy', 1))]),
    combat(15, [wave(group('miniasteroid', 1), group('asteroid', 1), group('ufofast', 1), group('torusEnemy', 1), group('compositeEnemy', 1), group('kamikaze', 1)), wave(group('miniasteroid', 1), group('asteroid', 2), group('ufofast', 1), group('torusEnemy', 1), group('compositeEnemy', 1))]),
    combat(16, [wave(group('asteroid', 2), group('ufofast', 1), group('kamikaze', 1), group('torusEnemy', 1), group('compositeEnemy', 1), group('miniasteroid', 1)), wave(group('asteroid', 1), group('ufofast', 1), group('kamikaze', 1), group('torusEnemy', 1), group('compositeEnemy', 1), group('miniasteroid', 2))]),
    combat(17, [wave(group('miniasteroid', 2), group('asteroid', 2), group('ufofast', 1), group('kamikaze', 2), group('compositeEnemy', 1)), wave(group('miniasteroid', 2), group('asteroid', 2), group('ufofast', 1), group('kamikaze', 2), group('compositeEnemy', 1))]),
    combat(18, [wave(group('torusEnemy', 2), group('compositeEnemy', 2), group('ufofast', 1), group('asteroid', 2)), wave(group('torusEnemy', 2), group('compositeEnemy', 2), group('ufofast', 1), group('asteroid', 2))]),
    combat(19, [wave(group('ufofast', 1), group('kamikaze', 1), group('torusEnemy', 1), group('asteroid', 1), group('compositeEnemy', 1)), wave(group('ufofast', 1), group('kamikaze', 1), group('torusEnemy', 1), group('asteroid', 1), group('compositeEnemy', 1)), wave(group('asteroid', 1), group('compositeEnemy', 1), group('miniboss', 1))]),
    combat(20, [wave(group('boss', 1, 3))], 'boss'),
  ],
};
