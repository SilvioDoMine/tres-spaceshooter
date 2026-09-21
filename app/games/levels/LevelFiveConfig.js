import { chapterStages, combat, group, intro, wave } from './helpers.js';

// Prototype: a carrier sector. The portal waits for every wave in the room.
const formations = [
  ['ufofast', 'torusEnemy'], ['miniHive', 'kamikaze'], ['compositeEnemy', 'asteroid'],
  ['miniHarpy', 'ufo'], ['torusEnemy', 'compositeEnemy'], ['miniHive', 'miniHarpy'],
  ['miniboss', 'ufofast'], ['asteroid', 'kamikaze'], ['miniHarpy', 'compositeEnemy'],
];
export const LEVEL_5 = {
  levelId: 'level_carrier_sanctum_005', chapter: 5, width: 10, height: 20, rewardExperience: 400,
  theme: { atmosphere: '#793b51', galaxyOpacity: .44 },
  structure: 'waves', targetPlayerLevel: 23,
  stages: chapterStages([intro(), ...Array.from({ length: 20 }, (_, i) => {
    const tier = i + 1;
    if (tier === 10 || tier === 20) return combat(tier, [wave(group(tier === 10 ? 'bastionBoss' : 'chapter5Boss', 1, 3))], 'boss');
    const [first, second] = formations[i % formations.length];
    const waves = [wave(group(first, first === 'miniboss' ? 1 : 2), group('ufo', 2)),
      wave(group(second, 2), group('miniasteroid', 2))];
    if (tier > 10) waves.push(wave(group(tier % 2 ? 'miniHarpy' : 'miniHive', 1), group('ufofast', 2)));
    return combat(tier, waves);
  })], 5, 'waves'),
};
