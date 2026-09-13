// Catálogo e balanceamento das cartas de talento (estilo Archero 2).
// As regras (custo, sorteio, bônus) ficam em ~/utils/talents; aqui só dados e números ajustáveis.

export type TalentRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type TalentIconKey =
  | 'goblet' | 'book' | 'cape' | 'emblem' | 'apple' | 'crosshair' | 'rune'
  | 'dash' | 'armor' | 'sword' | 'heart' | 'wall' | 'potion' | 'hammer';

/** O conjunto 2 só entra no sorteio quando todas as cartas do conjunto 1 estão no máximo */
export type TalentSet = 1 | 2;

/** Como o valor soma: fixo, percentual sobre a base, ou mecânica liberada (contador) */
export type TalentStatKind = 'flat' | 'percent' | 'mechanic';

export type TalentStat =
  | 'maxHealthFlat' | 'maxHealthPercent'
  | 'damageFlat' | 'damagePercent'
  | 'moveSpeedPercent' | 'attackSpeedPercent'
  | 'critRatePercent' | 'critDamagePercent' | 'dodgePercent'
  | 'heartHealFlat' | 'heartHealPercent' | 'levelUpHealPercent'
  | 'collisionReductionFlat' | 'collisionReductionPercent'
  | 'gearBaseStatsPercent' | 'battleGoldPercent'
  | 'startingSkillChoices' | 'skillRerolls';

export interface TalentDefinition {
  id: string;
  name: string;
  rarity: TalentRarity;
  set: TalentSet;
  icon: TalentIconKey;
  /** Selo no canto da arte (ex.: "II") */
  badge?: string;
  maxStars: number;
  /** Cada estrela soma `perStar` ao atributo */
  effects: { stat: TalentStat; perStar: number }[];
}

export const TALENT_RARITIES: Record<TalentRarity, { label: string }> = {
  common: { label: 'Comum' },
  rare: { label: 'Raro' },
  epic: { label: 'Épico' },
  legendary: { label: 'Lendário' },
};

// A ordem aqui é a ordem da lista de Detalhes.
export const TALENT_STATS: Record<TalentStat, { label: string; kind: TalentStatKind }> = {
  maxHealthFlat: { label: 'HP Máx.', kind: 'flat' },
  maxHealthPercent: { label: 'HP Máx.', kind: 'percent' },
  damageFlat: { label: 'ATQ', kind: 'flat' },
  damagePercent: { label: 'ATQ', kind: 'percent' },
  moveSpeedPercent: { label: 'VEL MOV', kind: 'percent' },
  attackSpeedPercent: { label: 'VEL ATQ', kind: 'percent' },
  critRatePercent: { label: 'Taxa Crít.', kind: 'percent' },
  critDamagePercent: { label: 'Dano Crít.', kind: 'percent' },
  dodgePercent: { label: 'Desvio', kind: 'percent' },
  heartHealFlat: { label: 'Cura dos corações', kind: 'flat' },
  heartHealPercent: { label: 'Cura dos corações', kind: 'percent' },
  levelUpHealPercent: { label: 'Cura ao subir de nível (HP)', kind: 'percent' },
  collisionReductionFlat: { label: 'Redução de dano de colisão', kind: 'flat' },
  collisionReductionPercent: { label: 'Redução de dano de colisão', kind: 'percent' },
  gearBaseStatsPercent: { label: 'Atributos base dos equipamentos', kind: 'percent' },
  battleGoldPercent: { label: 'Ouro obtido em batalha', kind: 'percent' },
  startingSkillChoices: { label: 'Skills escolhidas no início', kind: 'mechanic' },
  skillRerolls: { label: 'Re-rolls de skill', kind: 'mechanic' },
};

// -- Balanceamento (provisório) -------------------------------------------

/** Peso de cada carta no sorteio, pela raridade */
export const RARITY_WEIGHTS: Record<TalentRarity, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

/** O primeiro sorteio sempre dá esta carta (como no Archero 2) */
export const FIRST_DRAW_TALENT_ID = 'gloria';

/** Sorteios liberados por nível de conta */
export const DRAWS_PER_LEVEL = 2;

/** Custo do n-ésimo sorteio: base + linear·n + quadratic·n², arredondado */
export const TALENT_DRAW_COST = { base: 800, linear: 200, quadratic: 10, roundTo: 50 };

// -- Cartas ---------------------------------------------------------------

export const TALENTS: TalentDefinition[] = [
  // Conjunto 1 — Lendários: liberam mecânicas (1 estrela)
  { id: 'gloria', name: 'Glória', rarity: 'legendary', set: 1, icon: 'goblet', maxStars: 1, effects: [{ stat: 'startingSkillChoices', perStar: 1 }] },
  { id: 'taticas', name: 'Táticas', rarity: 'legendary', set: 1, icon: 'book', maxStars: 1, effects: [{ stat: 'skillRerolls', perStar: 1 }] },

  // Conjunto 1 — Épicos (%)
  { id: 'vento-veloz', name: 'Vento Veloz', rarity: 'epic', set: 1, icon: 'cape', maxStars: 5, effects: [{ stat: 'moveSpeedPercent', perStar: 1 }, { stat: 'attackSpeedPercent', perStar: 1 }] },
  { id: 'refinamento', name: 'Refinamento', rarity: 'epic', set: 1, icon: 'emblem', maxStars: 5, effects: [{ stat: 'gearBaseStatsPercent', perStar: 2 }] },
  { id: 'riqueza', name: 'Riqueza', rarity: 'epic', set: 1, icon: 'apple', maxStars: 5, effects: [{ stat: 'battleGoldPercent', perStar: 4 }] },
  { id: 'ultra-taxa-crit', name: 'Ultra Taxa Crít.', rarity: 'epic', set: 1, icon: 'crosshair', maxStars: 5, effects: [{ stat: 'critRatePercent', perStar: 2 }] },
  { id: 'ultra-dano-crit', name: 'Ultra Dano Crít.', rarity: 'epic', set: 1, icon: 'rune', maxStars: 5, effects: [{ stat: 'critDamagePercent', perStar: 6 }] },
  { id: 'ultra-desvio', name: 'Ultra Desvio', rarity: 'epic', set: 1, icon: 'dash', maxStars: 5, effects: [{ stat: 'dodgePercent', perStar: 2 }] },

  // Conjunto 1 — Raros (%)
  { id: 'super-vigor', name: 'Super Vigor', rarity: 'rare', set: 1, icon: 'armor', maxStars: 5, effects: [{ stat: 'maxHealthPercent', perStar: 2 }] },
  { id: 'super-forca', name: 'Super Força', rarity: 'rare', set: 1, icon: 'sword', maxStars: 5, effects: [{ stat: 'damagePercent', perStar: 2 }] },
  { id: 'super-recuperacao', name: 'Super Recuperação', rarity: 'rare', set: 1, icon: 'heart', maxStars: 5, effects: [{ stat: 'heartHealPercent', perStar: 4 }] },
  { id: 'super-muro-de-ferro', name: 'Super Muro de Ferro', rarity: 'rare', set: 1, icon: 'wall', maxStars: 5, effects: [{ stat: 'collisionReductionPercent', perStar: 2 }] },
  { id: 'cura', name: 'Cura', rarity: 'rare', set: 1, icon: 'potion', maxStars: 5, effects: [{ stat: 'levelUpHealPercent', perStar: 2 }] },
  { id: 'tita', name: 'Titã', rarity: 'rare', set: 1, icon: 'hammer', maxStars: 5, effects: [{ stat: 'maxHealthPercent', perStar: 1 }, { stat: 'damagePercent', perStar: 1 }, { stat: 'critDamagePercent', perStar: 2 }] },
  { id: 'super-taxa-crit', name: 'Super Taxa Crít.', rarity: 'rare', set: 1, icon: 'crosshair', maxStars: 5, effects: [{ stat: 'critRatePercent', perStar: 1 }] },
  { id: 'super-dano-crit', name: 'Super Dano Crít.', rarity: 'rare', set: 1, icon: 'rune', maxStars: 5, effects: [{ stat: 'critDamagePercent', perStar: 3 }] },
  { id: 'super-desvio', name: 'Super Desvio', rarity: 'rare', set: 1, icon: 'dash', maxStars: 5, effects: [{ stat: 'dodgePercent', perStar: 1 }] },

  // Conjunto 1 — Comuns (fixo)
  { id: 'vigor', name: 'Vigor', rarity: 'common', set: 1, icon: 'armor', maxStars: 5, effects: [{ stat: 'maxHealthFlat', perStar: 10 }] },
  { id: 'forca', name: 'Força', rarity: 'common', set: 1, icon: 'sword', maxStars: 5, effects: [{ stat: 'damageFlat', perStar: 2 }] },
  { id: 'recuperacao', name: 'Recuperação', rarity: 'common', set: 1, icon: 'heart', maxStars: 5, effects: [{ stat: 'heartHealFlat', perStar: 5 }] },
  { id: 'muro-de-ferro', name: 'Muro de Ferro', rarity: 'common', set: 1, icon: 'wall', maxStars: 5, effects: [{ stat: 'collisionReductionFlat', perStar: 3 }] },

  // Conjunto 2 — Comuns reforçados (fixo)
  { id: 'forca-ii', name: 'Força II', rarity: 'common', set: 2, icon: 'sword', badge: 'II', maxStars: 5, effects: [{ stat: 'damageFlat', perStar: 4 }] },
  { id: 'vigor-ii', name: 'Vigor II', rarity: 'common', set: 2, icon: 'armor', badge: 'II', maxStars: 5, effects: [{ stat: 'maxHealthFlat', perStar: 20 }] },
  { id: 'recuperacao-ii', name: 'Recuperação II', rarity: 'common', set: 2, icon: 'heart', badge: 'II', maxStars: 5, effects: [{ stat: 'heartHealFlat', perStar: 10 }] },
  { id: 'muro-de-ferro-ii', name: 'Muro de Ferro II', rarity: 'common', set: 2, icon: 'wall', badge: 'II', maxStars: 5, effects: [{ stat: 'collisionReductionFlat', perStar: 6 }] },
];
