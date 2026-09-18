import { scaledEnemyExperience } from './combatPatterns.js';

/** EXP efetiva do encontro, incluindo fragmentos; invocações sem recompensa ficam fora. */
export function roomExperience(stage, catalog, room = 1) {
  const tier = stage.combatTier ?? room;
  return (stage.waves ?? []).flatMap(w => w.enemies).reduce((total, group) => {
    const stats = catalog[group.enemyType];
    if (!stats) throw new Error(`Missing enemy XP: ${group.enemyType}`);
    let xp = stats.fixedXP ? stats.baseXP || 0 : scaledEnemyExperience(stats.baseXP || 0, tier);
    if (group.enemyType === 'asteroid') xp += 2 * scaledEnemyExperience(5, tier);
    if (group.enemyType === 'asteroidBoss') xp += 2 * 100 + 4 * 25;
    return total + group.count * xp;
  }, 0);
}

/**
 * Curva por capítulo: amostra a EXP acumulada dos encontros em intervalos regulares.
 * Só receber EXP sobe nível: entrar/limpar uma sala não concede níveis gratuitos.
 * Funciona com salas simples, waves e boss-rush, sem alterar recompensas de abate.
 */
export function buildExperienceCurve(chapter, catalog) {
  if (!chapter?.targetPlayerLevel) return [];
  const rooms = chapter.stages.filter(s => s.type !== 'intro');
  const totals = [0];
  rooms.forEach((stage, i) => totals.push(totals.at(-1) + roomExperience(stage, catalog, i + 1)));
  // Bosses sem EXP no final não empurram a última melhoria para depois da vitória.
  while (totals.length > 2 && totals.at(-1) === totals.at(-2)) totals.pop();
  const count = totals.length - 1;
  if (!totals.at(-1)) return [];
  const target = Math.max(2, Math.floor(chapter.targetPlayerLevel));
  let previous = 0;
  return Array.from({ length: target - 1 }, (_, i) => {
    const progress = target === 2 ? count : 1 + i * (count - 1) / (target - 2);
    const index = Math.min(count - 1, Math.floor(progress));
    const cumulative = Math.floor(totals[index] + (totals[index + 1] - totals[index]) * (progress - index));
    const threshold = Math.max(previous + 1, cumulative);
    const cost = threshold - previous;
    previous = threshold;
    return cost;
  });
}

export function experienceForLevel(level, curve = []) {
  const index = Math.max(0, Math.floor(level) - 1);
  if (!curve.length) return Math.floor(100 * (index + 1) ** 1.5);
  if (index < curve.length) return curve[index];
  // Bônus de EXP continua rendendo escolhas, com custo crescente além do alvo normal.
  const tail = curve.slice(-6);
  const average = tail.reduce((sum, xp) => sum + xp, 0) / tail.length;
  return Math.max(1, Math.round(average * (1 + .08 * (index - curve.length))));
}
