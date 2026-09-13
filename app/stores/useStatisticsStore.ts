import { defineStore } from 'pinia';
import { emptyStatistics, recordMatch as addMatch, sanitizeStatistics, type MatchResult, type PlayerStatistics } from '~/utils/statistics';

const STORAGE_KEY = 'playerStatistics';
const STORAGE_VERSION = 1;

function loadStatistics() {
  if (import.meta.server) return { stats: emptyStatistics(), fresh: false };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const stats = saved?.version === STORAGE_VERSION ? sanitizeStatistics(saved) : null;
    if (stats) return { stats, fresh: false };
  } catch (error) {
    console.error('Failed to parse player statistics from localStorage:', error);
  }

  return { stats: emptyStatistics(), fresh: true };
}

/**
 * Estatísticas básicas da conta, salvas no fim de cada partida (vitória ou derrota).
 * Outras telas leem daqui (ex.: a Loja só libera baús grátis depois da 1ª partida).
 */
export const useStatisticsStore = defineStore('statistics', () => {
  const initial = loadStatistics();
  const stats = ref<PlayerStatistics>(initial.stats);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...stats.value }));
  }

  if (initial.fresh) save();

  const matchesPlayed = computed(() => stats.value.matchesPlayed);

  function recordMatch(match: Omit<MatchResult, 'at'> & { at?: number }) {
    stats.value = addMatch(stats.value, { ...match, at: match.at ?? Date.now() });
    save();
    return stats.value;
  }

  function resetStatistics() {
    stats.value = emptyStatistics();
    save();
  }

  return { stats, matchesPlayed, recordMatch, resetStatistics };
});
