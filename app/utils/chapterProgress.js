// Progresso dos capítulos: o maior liberado, os já concluídos e o último jogado (onde o lobby abre).
// Funções puras (salvas pelo store).
export const CHAPTER_PROGRESS_VERSION = 1;

export function emptyChapterProgress() {
  return { maxUnlocked: 1, completed: [], lastPlayed: 1 };
}

export function sanitizeChapterProgress(raw, chapterCount) {
  const completed = [...new Set((Array.isArray(raw?.completed) ? raw.completed : [])
    .map(Number)
    .filter(chapter => Number.isInteger(chapter) && chapter >= 1 && chapter <= chapterCount))]
    .sort((a, b) => a - b);
  const saved = Number(raw?.maxUnlocked);
  const fromCompleted = completed.length ? Math.max(...completed) + 1 : 1;
  const maxUnlocked = Math.max(1, Math.min(chapterCount, Math.max(Number.isInteger(saved) ? saved : 1, fromCompleted)));
  // Saves antigos não têm lastPlayed: mantém o comportamento anterior (abre no último liberado)
  const last = Number(raw?.lastPlayed);
  const lastPlayed = Number.isInteger(last) && last >= 1 ? Math.min(last, maxUnlocked) : maxUnlocked;
  return { maxUnlocked, completed, lastPlayed };
}

/** Entrar num capítulo liberado passa a ser o último jogado. */
export function playChapter(progress, chapter, chapterCount) {
  return sanitizeChapterProgress({ ...progress, lastPlayed: Number(chapter) }, chapterCount);
}

/**
 * Concluir um capítulo libera o seguinte (sem passar do último).
 * Se liberou um capítulo novo, o lobby passa a abrir nele; senão continua no que foi jogado.
 */
export function completeChapter(progress, chapter, chapterCount) {
  const before = sanitizeChapterProgress(progress, chapterCount);
  const next = sanitizeChapterProgress({
    maxUnlocked: Math.max(before.maxUnlocked, Number(chapter) + 1),
    completed: [...before.completed, chapter],
    lastPlayed: Number(chapter),
  }, chapterCount);
  return next.maxUnlocked > before.maxUnlocked ? { ...next, lastPlayed: next.maxUnlocked } : next;
}
