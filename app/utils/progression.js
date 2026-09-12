export function playableRoomCount(level, throughStageIndex = Infinity) {
  const stages = level?.stages ?? [];
  const end = Number.isFinite(throughStageIndex)
    ? Math.max(0, Math.min(stages.length, throughStageIndex + 1))
    : stages.length;

  return stages.slice(0, end).filter(stage => stage?.type !== 'intro').length;
}

export function calculateChapterReward(level, roomsReached, completed = false) {
  const totalRooms = playableRoomCount(level);
  const baseReward = Number(level?.rewardExperience) || 0;

  if (totalRooms === 0 || baseReward <= 0) return 0;

  const safeRooms = Math.max(0, Math.min(totalRooms, Number(roomsReached) || 0));
  if (completed && safeRooms === totalRooms) return baseReward;

  return Math.floor((baseReward / 2) * (safeRooms / totalRooms));
}
