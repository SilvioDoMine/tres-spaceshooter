// Progresso dos capítulos: o maior liberado e os já concluídos. Funções puras (salvas pelo store).
export const CHAPTER_PROGRESS_VERSION = 1;

export function emptyChapterProgress() {
  return { maxUnlocked: 1, completed: [] };
}

export function sanitizeChapterProgress(raw, chapterCount) {
  const completed = [...new Set((Array.isArray(raw?.completed) ? raw.completed : [])
    .map(Number)
    .filter(chapter => Number.isInteger(chapter) && chapter >= 1 && chapter <= chapterCount))]
    .sort((a, b) => a - b);
  const saved = Number(raw?.maxUnlocked);
  const fromCompleted = completed.length ? Math.max(...completed) + 1 : 1;
  const maxUnlocked = Math.max(1, Math.min(chapterCount, Math.max(Number.isInteger(saved) ? saved : 1, fromCompleted)));
  return { maxUnlocked, completed };
}

/** Concluir um capítulo libera o seguinte (sem passar do último). */
export function completeChapter(progress, chapter, chapterCount) {
  return sanitizeChapterProgress({
    maxUnlocked: Math.max(progress?.maxUnlocked ?? 1, Number(chapter) + 1),
    completed: [...(progress?.completed ?? []), chapter],
  }, chapterCount);
}
