// Regras puras das cartas de talento: custo, limite por nível, sorteio e bônus.
// Sem Vue/Pinia para dar para testar fora do Nuxt (por isso o import relativo).
import {
  DRAWS_PER_LEVEL,
  FIRST_DRAW_TALENT_ID,
  RARITY_WEIGHTS,
  TALENTS,
  TALENT_DRAW_COST,
  TALENT_STATS,
  type TalentDefinition,
  type TalentStat,
} from '../data/talents';

/** id da carta -> estrelas obtidas */
export type TalentStars = Record<string, number>;
export type TalentDrawStatus = 'ok' | 'no-gold' | 'level' | 'completed';
export type TalentBonuses = Record<TalentStat, number>;

export interface TalentBaseStats {
  maxHealth: number;
  moveSpeed: number;
  projectiles: { damage: number; shotCooldown: number };
}

const talentsById = new Map(TALENTS.map(talent => [talent.id, talent]));

export const getTalent = (id: string) => talentsById.get(id);

// -- Economia ---------------------------------------------------------------

/** Custo em ouro do sorteio, dado quantos já foram feitos */
export function talentDrawCost(draws: number) {
  const { base, linear, quadratic, roundTo } = TALENT_DRAW_COST;
  const raw = base + linear * draws + quadratic * draws * draws;
  return Math.round(raw / roundTo) * roundTo;
}

export const drawsAllowedAtLevel = (level: number) => Math.max(0, Math.floor(level)) * DRAWS_PER_LEVEL;

/** Nível de conta exigido para o próximo sorteio */
export const requiredLevelForDraw = (draws: number) => Math.ceil((draws + 1) / DRAWS_PER_LEVEL);

// -- Progresso --------------------------------------------------------------

/** Cada sorteio dá exatamente 1 estrela, então sorteios feitos = soma das estrelas */
export const countDraws = (stars: TalentStars) => Object.values(stars).reduce((sum, value) => sum + value, 0);

const isMaxed = (talent: TalentDefinition, stars: TalentStars) => (stars[talent.id] ?? 0) >= talent.maxStars;

/** Menor conjunto que ainda tem carta fora do máximo (null = tudo completo) */
export function activeTalentSet(stars: TalentStars) {
  const pendingSets = TALENTS.filter(talent => !isMaxed(talent, stars)).map(talent => talent.set);
  return pendingSets.length ? Math.min(...pendingSets) : null;
}

export function talentDrawPool(stars: TalentStars) {
  const set = activeTalentSet(stars);
  return set === null ? [] : TALENTS.filter(talent => talent.set === set && !isMaxed(talent, stars));
}

export function drawStatus({ stars, level, gold }: { stars: TalentStars; level: number; gold: number }): TalentDrawStatus {
  if (talentDrawPool(stars).length === 0) return 'completed';
  const draws = countDraws(stars);
  if (draws >= drawsAllowedAtLevel(level)) return 'level';
  if (gold < talentDrawCost(draws)) return 'no-gold';
  return 'ok';
}

/** Limpa o que veio do localStorage: ids conhecidos, inteiros e dentro do máximo */
export function sanitizeTalentStars(raw: unknown): TalentStars {
  const clean: TalentStars = {};
  if (!raw || typeof raw !== 'object') return clean;
  for (const [id, value] of Object.entries(raw)) {
    const talent = getTalent(id);
    const count = Math.floor(Number(value));
    if (talent && count > 0) clean[id] = Math.min(count, talent.maxStars);
  }
  return clean;
}

// -- Sorteio ----------------------------------------------------------------

/** PRNG pequeno e determinístico (mesma semente -> mesma sequência) */
export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gerador do n-ésimo sorteio: recarregar a página não muda o resultado */
export const drawRng = (seed: number, draws: number) => mulberry32(seed + draws);

/** Escolhe a carta do próximo sorteio (a primeira é sempre a garantida; depois, peso por raridade) */
export function pickTalent(stars: TalentStars, rng: () => number): TalentDefinition | null {
  const pool = talentDrawPool(stars);
  if (pool.length === 0) return null;

  if (countDraws(stars) === 0) {
    const guaranteed = pool.find(talent => talent.id === FIRST_DRAW_TALENT_ID);
    if (guaranteed) return guaranteed;
  }

  const totalWeight = pool.reduce((sum, talent) => sum + RARITY_WEIGHTS[talent.rarity], 0);
  let roll = rng() * totalWeight;
  for (const talent of pool) {
    roll -= RARITY_WEIGHTS[talent.rarity];
    if (roll < 0) return talent;
  }
  return pool[pool.length - 1]!;
}

// -- Bônus para o jogo --------------------------------------------------------

export function emptyTalentBonuses(): TalentBonuses {
  return Object.fromEntries(Object.keys(TALENT_STATS).map(stat => [stat, 0])) as TalentBonuses;
}

/** Soma dos efeitos de todas as cartas obtidas */
export function aggregateTalentBonuses(stars: TalentStars): TalentBonuses {
  const bonuses = emptyTalentBonuses();
  for (const talent of TALENTS) {
    const count = stars[talent.id] ?? 0;
    if (!count) continue;
    for (const effect of talent.effects) bonuses[effect.stat] += effect.perStar * count;
  }
  return bonuses;
}

/**
 * Atributos base já com os talentos: (base + fixo) × (1 + %).
 * VEL ATQ reduz o intervalo entre tiros. Pronto para o jogo usar (ainda não ligado).
 */
export function applyTalentBonuses(base: TalentBaseStats, bonuses: TalentBonuses) {
  const multiplier = (percent: number) => 1 + percent / 100;
  return {
    maxHealth: (base.maxHealth + bonuses.maxHealthFlat) * multiplier(bonuses.maxHealthPercent),
    damage: (base.projectiles.damage + bonuses.damageFlat) * multiplier(bonuses.damagePercent),
    moveSpeed: base.moveSpeed * multiplier(bonuses.moveSpeedPercent),
    shotCooldown: base.projectiles.shotCooldown / multiplier(bonuses.attackSpeedPercent),
  };
}

// -- Texto ------------------------------------------------------------------

/** "+20", "+4%" */
export function formatTalentAmount(stat: TalentStat, value: number) {
  const suffix = TALENT_STATS[stat].kind === 'percent' ? '%' : '';
  return `+${Number(value.toFixed(2))}${suffix}`;
}

/** "HP Máx. +20" */
export const formatTalentValue = (stat: TalentStat, value: number) =>
  `${TALENT_STATS[stat].label} ${formatTalentAmount(stat, value)}`;
