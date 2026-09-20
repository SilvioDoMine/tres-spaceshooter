import { defineStore, skipHydrate } from 'pinia';
import { CHAPTER_COUNT } from '~/games/levels';
import {
  CHAPTER_PROGRESS_VERSION, claimMilestone, completeChapter, emptyChapterProgress, playChapter,
  recordClearedRooms, sanitizeChapterProgress,
} from '~/utils/chapterProgress';

const STORAGE_KEY = 'chapterProgress';

function loadProgress() {
  if (import.meta.server) return emptyChapterProgress();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved?.version === CHAPTER_PROGRESS_VERSION) return sanitizeChapterProgress(saved, CHAPTER_COUNT);
  } catch (error) {
    console.error('Failed to parse chapter progress from localStorage:', error);
  }

  return emptyChapterProgress();
}

/**
 * Capítulos liberados e concluídos, salvos no navegador.
 * Vencer um capítulo libera o próximo; o lobby abre no último jogado (ou no recém-liberado).
 * Guarda também as salas limpas por capítulo, que liberam os marcos de recompensa.
 */
export const useChapterProgressStore = defineStore('chapterProgress', () => {
  const progress = ref(loadProgress());
  const maxUnlocked = computed(() => progress.value.maxUnlocked);
  const lastPlayed = computed(() => progress.value.lastPlayed);
  const clearedRooms = computed(() => progress.value.clearedRooms);
  const claimedMilestones = computed(() => progress.value.claimedMilestones);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CHAPTER_PROGRESS_VERSION, ...progress.value }));
  }

  function isUnlocked(chapter: number) {
    return Number.isInteger(chapter) && chapter >= 1 && chapter <= progress.value.maxUnlocked;
  }

  function markPlayed(chapter: number) {
    if (!isUnlocked(chapter)) return;
    progress.value = playChapter(progress.value, chapter, CHAPTER_COUNT);
    save();
  }

  function markCompleted(chapter: number) {
    progress.value = completeChapter(progress.value, chapter, CHAPTER_COUNT);
    save();
  }

  /** Salas limpas numa partida (só sobe). `maxRooms` é o total do capítulo. */
  function recordRooms(chapter: number, rooms: number, maxRooms?: number) {
    const next = recordClearedRooms(progress.value, chapter, rooms, CHAPTER_COUNT, maxRooms);
    if (next === progress.value) return;
    progress.value = next;
    save();
  }

  function markMilestoneClaimed(key: string) {
    progress.value = claimMilestone(progress.value, key, CHAPTER_COUNT);
    save();
  }

  /** Debug: libera todos os capítulos (window.unlockAllChapters() em dev) */
  function unlockAll() {
    progress.value = sanitizeChapterProgress({ ...progress.value, maxUnlocked: CHAPTER_COUNT }, CHAPTER_COUNT);
    save();
  }

  if (import.meta.client && import.meta.dev) {
    (window as any).unlockAllChapters = unlockAll;
    // Debug: window.setChapterRooms(1, 12) para testar os marcos sem jogar as salas
    (window as any).setChapterRooms = (chapter: number, rooms: number) => {
      progress.value = sanitizeChapterProgress(
        { ...progress.value, clearedRooms: { ...progress.value.clearedRooms, [chapter]: rooms } },
        CHAPTER_COUNT,
      );
      save();
      return progress.value.clearedRooms;
    };
  }

  // O progresso vem do localStorage do cliente, nunca do payload do servidor
  return {
    progress: skipHydrate(progress),
    maxUnlocked,
    lastPlayed,
    clearedRooms,
    claimedMilestones,
    isUnlocked,
    markPlayed,
    markCompleted,
    recordRooms,
    markMilestoneClaimed,
    unlockAll,
  };
});
