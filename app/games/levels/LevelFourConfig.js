import { chapterStages, combat, group, intro, wave } from './helpers.js';

// Prototype: breach the siege line. Each wave becomes its own quick room.
const encounters = [
  [['ufo', 3], ['miniasteroid', 3]],
  [['ufofast', 2], ['torusEnemy', 2]],
  [['asteroid', 2], ['kamikaze', 2]],
  [['compositeEnemy', 2], ['miniHarpy', 1]],
  [['miniHive', 1], ['ufofast', 2]],
  [['miniboss', 1], ['torusEnemy', 2]],
  [['miniHarpy', 2], ['kamikaze', 3]],
  [['miniHive', 2], ['compositeEnemy', 2]],
  [['ufofast', 3], ['asteroid', 2]],
  null,
  [['miniHive', 2], ['miniHarpy', 2]],
  [['miniboss', 1], ['compositeEnemy', 3]],
  [['asteroid', 3], ['torusEnemy', 3]],
  [['miniHarpy', 2], ['ufofast', 3]],
  [['miniHive', 2], ['kamikaze', 4]],
  [['miniboss', 1], ['miniHarpy', 2]],
  [['compositeEnemy', 3], ['torusEnemy', 3]],
  [['miniHive', 2], ['ufofast', 3]],
  [['miniboss', 2], ['miniHarpy', 2]],
  null,
];
export const LEVEL_4 = {
  levelId: 'level_siege_line_004', chapter: 4, width: 10, height: 20, rewardExperience: 320,
  theme: { atmosphere: '#123f55', galaxyOpacity: .5 },
  structure: 'quick', targetPlayerLevel: 23,
  stages: chapterStages([intro(), ...encounters.map((pair, i) => {
    const tier = i + 1;
    if (!pair) return combat(tier, [wave(group(tier === 10 ? 'kamikazeBoss' : 'chapter4Boss', 1, 3))], 'boss');
    return combat(tier, [wave(group(...pair[0]), group('ufo', i < 6 ? 1 : 2)),
      wave(group(...pair[1]), group(i % 2 ? 'miniasteroid' : 'kamikaze', 2))]);
  })], 4, 'quick'),
};
