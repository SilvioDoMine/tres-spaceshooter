// Estatísticas básicas da conta (partidas, vitórias, tempo, abates...). Regras puras, sem Vue,
// para testar fora do Nuxt. O estado salvo fica em ~/stores/useStatisticsStore.

export interface PlayerStatistics {
  matchesPlayed: number;
  victories: number;
  defeats: number;
  /** Soma da duração das partidas, em segundos */
  totalPlayTimeSec: number;
  enemiesKilled: number;
  /** Ouro ganho dentro das partidas (não conta loja/missões) */
  goldEarned: number;
  /** Maior número de salas jogáveis alcançadas numa partida */
  bestRoomsReached: number;
  firstMatchAt: number | null;
  lastMatchAt: number | null;
}

export interface MatchResult {
  victory: boolean;
  durationSec: number;
  enemiesKilled: number;
  goldEarned: number;
  roomsReached: number;
  /** Quando terminou (timestamp) */
  at: number;
}

export const emptyStatistics = (): PlayerStatistics => ({
  matchesPlayed: 0,
  victories: 0,
  defeats: 0,
  totalPlayTimeSec: 0,
  enemiesKilled: 0,
  goldEarned: 0,
  bestRoomsReached: 0,
  firstMatchAt: null,
  lastMatchAt: null,
});

const count = (value: unknown) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const seconds = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number * 10) / 10 : 0;
};

const timestamp = (value: unknown) => {
  const number = Number(value);
  return value !== null && Number.isFinite(number) && number > 0 ? number : null;
};

/** Soma uma partida terminada (vitória ou derrota) */
export function recordMatch(stats: PlayerStatistics, match: MatchResult): PlayerStatistics {
  return {
    matchesPlayed: stats.matchesPlayed + 1,
    victories: stats.victories + (match.victory ? 1 : 0),
    defeats: stats.defeats + (match.victory ? 0 : 1),
    totalPlayTimeSec: seconds(stats.totalPlayTimeSec + seconds(match.durationSec)),
    enemiesKilled: stats.enemiesKilled + count(match.enemiesKilled),
    goldEarned: stats.goldEarned + count(match.goldEarned),
    bestRoomsReached: Math.max(stats.bestRoomsReached, count(match.roomsReached)),
    firstMatchAt: stats.firstMatchAt ?? match.at,
    lastMatchAt: match.at,
  };
}

/** Limpa o que veio do localStorage; campos inválidos voltam para zero */
export function sanitizeStatistics(raw: unknown): PlayerStatistics | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const stats: PlayerStatistics = {
    matchesPlayed: count(data.matchesPlayed),
    victories: count(data.victories),
    defeats: count(data.defeats),
    totalPlayTimeSec: seconds(data.totalPlayTimeSec),
    enemiesKilled: count(data.enemiesKilled),
    goldEarned: count(data.goldEarned),
    bestRoomsReached: count(data.bestRoomsReached),
    firstMatchAt: timestamp(data.firstMatchAt),
    lastMatchAt: timestamp(data.lastMatchAt),
  };
  // Partidas nunca menos que vitórias + derrotas
  stats.matchesPlayed = Math.max(stats.matchesPlayed, stats.victories + stats.defeats);
  return stats;
}
