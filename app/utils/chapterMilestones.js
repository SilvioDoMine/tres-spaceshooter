// Marcos de conclusão de sala: a cada 5 salas limpas num capítulo (mais a última sala), o jogador
// libera um pacote de recompensas para resgatar no lobby.
//
// Os marcos são derivados de LEVELS, nunca escritos à mão: mudar o número de salas de um capítulo
// reposiciona os marcos sozinho. O pacote segue o mesmo formato das missões diárias e do RewardsModal:
// { gold, exp, cash, keys: { silver, obsidian }, equipmentRarities: [] }.
import { CHAPTER_COUNT, LEVELS } from '../games/levels/index.js';
import { playableRoomCount } from './progression.js';

export const MILESTONE_EVERY = 5;

/** Raridade do equipamento do marco de conclusão, por capítulo */
const END_RARITY = { 1: 'green', 2: 'green', 3: 'blue', 4: 'blue', 5: 'purple' };

export const milestoneKey = (chapter, room) => `${chapter}:${room}`;

export function emptyRewards() {
  return { gold: 0, exp: 0, cash: 0, keys: { silver: 0, obsidian: 0 }, equipmentRarities: [] };
}

/** Salas premiadas de um capítulo: 5, 10, 15... e sempre a última sala. */
export function milestoneRooms(totalRooms) {
  const total = Math.max(0, Math.floor(Number(totalRooms) || 0));
  const rooms = [];
  for (let room = MILESTONE_EVERY; room <= total; room += MILESTONE_EVERY) rooms.push(room);
  if (total > 0 && rooms.at(-1) !== total) rooms.push(total);
  return rooms;
}

/**
 * Pacote de um marco. `index` é a posição dentro do capítulo (1-based) e define o ciclo de formatos,
 * para o jogador não receber sempre a mesma coisa; o marco final do capítulo é o único com item.
 */
export function milestoneRewards(chapter, index, isChapterEnd) {
  const c = Math.max(1, Number(chapter) || 1);
  const i = Math.max(1, Number(index) || 1);
  const rewards = emptyRewards();

  if (isChapterEnd) {
    rewards.gold = 500 * c;
    rewards.cash = 100;
    rewards.keys.obsidian = 1;
    rewards.equipmentRarities = [END_RARITY[c] ?? 'green'];
    return rewards;
  }

  switch ((i - 1) % 4) {
    case 0:
      rewards.gold = 120 * c + 40 * i;
      rewards.exp = 20 * c;
      break;
    case 1:
      rewards.cash = 30 + 10 * c;
      break;
    case 2:
      rewards.gold = 120 * c + 40 * i;
      rewards.keys.silver = 1;
      break;
    default:
      rewards.cash = 30 + 10 * c;
      rewards.exp = 30 * c;
  }

  return rewards;
}

/** Marcos de um capítulo, em ordem de sala. */
export function chapterMilestones(chapter) {
  const level = LEVELS[chapter];
  if (!level) return [];

  const total = playableRoomCount(level);
  return milestoneRooms(total).map((room, position) => {
    const index = position + 1;
    const isChapterEnd = room === total;
    return {
      chapter: Number(chapter),
      room,
      index,
      isChapterEnd,
      totalRooms: total,
      key: milestoneKey(chapter, room),
      rewards: milestoneRewards(chapter, index, isChapterEnd),
    };
  });
}

/** Todos os marcos, do capítulo 1 ao último, na ordem em que o jogador os resgata. */
export function allMilestones() {
  const list = [];
  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter++) list.push(...chapterMilestones(chapter));
  return list;
}

/** 'claimed' | 'claimable' | 'locked' — o resgate é sequencial, mas o estado depende só do progresso. */
export function milestoneState(progress, milestone) {
  if (progress?.claimedMilestones?.includes(milestone.key)) return 'claimed';
  const cleared = Number(progress?.clearedRooms?.[milestone.chapter]) || 0;
  return cleared >= milestone.room ? 'claimable' : 'locked';
}

/** Índice do marco em foco: o primeiro ainda não resgatado (ou o último, se acabaram todos). */
export function currentMilestoneIndex(progress, milestones = allMilestones()) {
  const claimed = new Set(progress?.claimedMilestones ?? []);
  const next = milestones.findIndex(milestone => !claimed.has(milestone.key));
  return next === -1 ? Math.max(0, milestones.length - 1) : next;
}

/** Tem marco liberado esperando resgate? (badge "!" no lobby) */
export function hasClaimableMilestone(progress, milestones = allMilestones()) {
  return milestones.some(milestone => milestoneState(progress, milestone) === 'claimable');
}
