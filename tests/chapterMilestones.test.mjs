import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTER_COUNT, LEVELS } from '../app/games/levels/index.js';
import { playableRoomCount } from '../app/utils/progression.js';
import {
  MILESTONE_EVERY, allMilestones, chapterMilestones, currentMilestoneIndex, hasClaimableMilestone,
  milestoneKey, milestoneRooms, milestoneRewards, milestoneState,
} from '../app/utils/chapterMilestones.js';
import { claimMilestone, emptyChapterProgress, recordClearedRooms } from '../app/utils/chapterProgress.js';

const REWARD_KEYS = ['gold', 'exp', 'cash', 'keys', 'equipmentRarities'];

test('milestones land every 5 rooms and always on the last room of the chapter', () => {
  assert.equal(MILESTONE_EVERY, 5);
  assert.deepEqual(milestoneRooms(20), [5, 10, 15, 20]);
  assert.deepEqual(milestoneRooms(38), [5, 10, 15, 20, 25, 30, 35, 38]);
  assert.deepEqual(milestoneRooms(0), []);
  assert.deepEqual(milestoneRooms(3), [3]);

  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter++) {
    const total = playableRoomCount(LEVELS[chapter]);
    const milestones = chapterMilestones(chapter);
    assert.deepEqual(milestones.map(m => m.room), milestoneRooms(total), `capítulo ${chapter}`);
    assert.ok(milestones.every(m => m.room >= 1 && m.room <= total));
    assert.equal(milestones.at(-1).room, total);
    assert.equal(milestones.filter(m => m.isChapterEnd).length, 1);
    assert.deepEqual(milestones.map(m => m.index), milestones.map((_, i) => i + 1));
  }

  // 35, 38, 40, 38 e 20 salas → 7, 8, 8, 8 e 4 marcos
  assert.deepEqual([1, 2, 3, 4, 5].map(c => chapterMilestones(c).length), [7, 8, 8, 8, 4]);
  assert.deepEqual(chapterMilestones(99), []);
});

test('every milestone hands out something, and only known rewards', () => {
  for (const milestone of allMilestones()) {
    const { rewards } = milestone;
    assert.deepEqual(Object.keys(rewards).sort(), [...REWARD_KEYS].sort());
    assert.deepEqual(Object.keys(rewards.keys).sort(), ['obsidian', 'silver']);
    const total = rewards.gold + rewards.exp + rewards.cash + rewards.keys.silver + rewards.keys.obsidian
      + rewards.equipmentRarities.length;
    assert.ok(total > 0, `marco vazio em ${milestone.key}`);
    assert.ok([rewards.gold, rewards.exp, rewards.cash].every(v => Number.isInteger(v) && v >= 0));
  }

  // Só o marco de conclusão dá item e chave de obsidiana; as recompensas crescem por capítulo
  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter++) {
    const milestones = chapterMilestones(chapter);
    const [end] = milestones.filter(m => m.isChapterEnd);
    assert.equal(end.rewards.equipmentRarities.length, 1);
    assert.equal(end.rewards.keys.obsidian, 1);
    assert.ok(milestones.filter(m => !m.isChapterEnd).every(m => m.rewards.equipmentRarities.length === 0));
    assert.ok(milestones.filter(m => !m.isChapterEnd).every(m => m.rewards.keys.obsidian === 0));
    if (chapter > 1) assert.ok(end.rewards.gold > chapterMilestones(chapter - 1).at(-1).rewards.gold);
  }

  // O ciclo alterna os formatos para não repetir o mesmo pacote
  assert.ok(milestoneRewards(1, 1, false).gold > 0 && milestoneRewards(1, 2, false).cash > 0);
  assert.equal(milestoneRewards(1, 3, false).keys.silver, 1);
});

test('all milestones are listed in claim order, chapter by chapter', () => {
  const all = allMilestones();
  assert.equal(all.length, 35);
  assert.equal(new Set(all.map(m => m.key)).size, all.length);
  assert.deepEqual(all[0], { ...all[0], chapter: 1, room: 5, key: milestoneKey(1, 5) });
  assert.equal(all.at(-1).key, milestoneKey(5, 20));
  for (let i = 1; i < all.length; i++) {
    const [prev, next] = [all[i - 1], all[i]];
    assert.ok(next.chapter > prev.chapter || (next.chapter === prev.chapter && next.room > prev.room));
  }
});

test('a milestone unlocks with cleared rooms and stays claimed afterwards', () => {
  const all = allMilestones();
  const first = all[0];
  let progress = emptyChapterProgress();

  assert.equal(milestoneState(progress, first), 'locked');
  assert.equal(hasClaimableMilestone(progress, all), false);
  assert.equal(currentMilestoneIndex(progress, all), 0);

  // Morrer na sala 4 não libera nada; limpar a 5 libera o primeiro marco
  progress = recordClearedRooms(progress, 1, 4, CHAPTER_COUNT);
  assert.equal(milestoneState(progress, first), 'locked');
  progress = recordClearedRooms(progress, 1, 12, CHAPTER_COUNT);
  assert.equal(milestoneState(progress, first), 'claimable');
  assert.equal(milestoneState(progress, all[1]), 'claimable'); // sala 10
  assert.equal(milestoneState(progress, all[2]), 'locked'); // sala 15
  assert.ok(hasClaimableMilestone(progress, all));

  // Uma run pior não regride o recorde
  progress = recordClearedRooms(progress, 1, 3, CHAPTER_COUNT);
  assert.equal(progress.clearedRooms[1], 12);

  // Resgate é sequencial: o foco só avança depois de resgatar
  progress = claimMilestone(progress, first.key, CHAPTER_COUNT);
  assert.equal(milestoneState(progress, first), 'claimed');
  assert.equal(currentMilestoneIndex(progress, all), 1);
  assert.deepEqual(claimMilestone(progress, first.key, CHAPTER_COUNT).claimedMilestones, [first.key]);

  // Com tudo resgatado o foco para no último e nada fica pendente
  const done = all.reduce((acc, m) => claimMilestone(acc, m.key, CHAPTER_COUNT), progress);
  assert.equal(currentMilestoneIndex(done, all), all.length - 1);
  assert.equal(hasClaimableMilestone(done, all), false);
});
