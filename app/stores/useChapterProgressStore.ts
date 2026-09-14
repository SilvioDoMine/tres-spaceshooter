import { defineStore, skipHydrate } from 'pinia';
import { CHAPTER_COUNT } from '~/games/levels';
import { CHAPTER_PROGRESS_VERSION, completeChapter, emptyChapterProgress, playChapter, sanitizeChapterProgress } from '~/utils/chapterProgress';

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
 */
export const useChapterProgressStore = defineStore('chapterProgress', () => {
  const progress = ref(loadProgress());
  const maxUnlocked = computed(() => progress.value.maxUnlocked);
  const lastPlayed = computed(() => progress.value.lastPlayed);

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

  /** Debug: libera todos os capítulos (window.unlockAllChapters() em dev) */
  function unlockAll() {
    progress.value = sanitizeChapterProgress({ ...progress.value, maxUnlocked: CHAPTER_COUNT }, CHAPTER_COUNT);
    save();
  }

  if (import.meta.client && import.meta.dev) {
    (window as any).unlockAllChapters = unlockAll;
  }

  // O progresso vem do localStorage do cliente, nunca do payload do servidor
  return { progress: skipHydrate(progress), maxUnlocked, lastPlayed, isUnlocked, markPlayed, markCompleted, unlockAll };
});
