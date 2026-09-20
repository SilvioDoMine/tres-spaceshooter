// Progresso dos capítulos: o maior liberado, os já concluídos, o último jogado (onde o lobby abre),
// quantas salas foram limpas em cada capítulo e quais marcos já foram resgatados.
// Funções puras (salvas pelo store).
export const CHAPTER_PROGRESS_VERSION = 1;

export function emptyChapterProgress() {
  return { maxUnlocked: 1, completed: [], lastPlayed: 1, clearedRooms: {}, claimedMilestones: [] };
}

function sanitizeClearedRooms(raw, chapterCount) {
  const cleared = {};
  for (const [key, value] of Object.entries(raw && typeof raw === 'object' ? raw : {})) {
    const chapter = Number(key);
    const rooms = Math.floor(Number(value));
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapterCount) continue;
    if (!Number.isFinite(rooms) || rooms <= 0) continue;
    cleared[chapter] = rooms;
  }
  return cleared;
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
  // Saves anteriores aos marcos não têm sala limpa nem resgate: a contagem começa do zero para eles
  const clearedRooms = sanitizeClearedRooms(raw?.clearedRooms, chapterCount);
  const claimedMilestones = [...new Set((Array.isArray(raw?.claimedMilestones) ? raw.claimedMilestones : [])
    .filter(key => typeof key === 'string' && key.length > 0))];
  return { maxUnlocked, completed, lastPlayed, clearedRooms, claimedMilestones };
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
    ...before,
    maxUnlocked: Math.max(before.maxUnlocked, Number(chapter) + 1),
    completed: [...before.completed, chapter],
    lastPlayed: Number(chapter),
  }, chapterCount);
  return next.maxUnlocked > before.maxUnlocked ? { ...next, lastPlayed: next.maxUnlocked } : next;
}

/**
 * Registra as salas limpas numa partida. Só sobe: uma run curta depois de uma longa não apaga o recorde.
 * `maxRooms` é o total de salas do capítulo (o chamador o conhece); serve de teto contra save adulterado.
 */
export function recordClearedRooms(progress, chapter, rooms, chapterCount, maxRooms = Infinity) {
  const before = sanitizeChapterProgress(progress, chapterCount);
  const target = Number(chapter);
  if (!Number.isInteger(target) || target < 1 || target > chapterCount) return before;

  const cleared = Math.min(Math.floor(Number(rooms) || 0), Math.floor(Number(maxRooms) || Infinity));
  if (cleared <= (before.clearedRooms[target] ?? 0)) return before;

  return { ...before, clearedRooms: { ...before.clearedRooms, [target]: cleared } };
}

/** Marca um marco como resgatado (idempotente). */
export function claimMilestone(progress, key, chapterCount) {
  const before = sanitizeChapterProgress(progress, chapterCount);
  if (typeof key !== 'string' || !key || before.claimedMilestones.includes(key)) return before;
  return { ...before, claimedMilestones: [...before.claimedMilestones, key] };
}
