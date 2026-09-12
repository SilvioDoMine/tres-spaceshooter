import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateChapterReward, playableRoomCount } from '../app/utils/progression.js';

const level = { rewardExperience: 80, stages: Array.from({ length: 20 }) };

test('full chapter reward requires all rooms and completion', () => {
  assert.equal(calculateChapterReward(level, 20, true), 80);
  assert.equal(calculateChapterReward(level, 20, false), 40);
});

test('defeat reward scales with rooms reached without an off-by-one', () => {
  assert.equal(calculateChapterReward(level, 1, false), 2);
  assert.equal(calculateChapterReward(level, 10, false), 20);
  assert.equal(calculateChapterReward(level, 19, false), 38);
});

test('reward clamps invalid room counts', () => {
  assert.equal(calculateChapterReward(level, -1, false), 0);
  assert.equal(calculateChapterReward(level, 200, false), 40);
});

test('intro stage is not counted among twenty playable rooms', () => {
  const chapter = { rewardExperience: 80, stages: [{ type: 'intro' }, ...Array.from({ length: 20 }, () => ({ type: 'combat' }))] };
  assert.equal(playableRoomCount(chapter), 20);
  assert.equal(playableRoomCount(chapter, 0), 0);
  assert.equal(playableRoomCount(chapter, 1), 1);
  assert.equal(calculateChapterReward(chapter, 20, true), 80);
});
