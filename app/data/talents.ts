// Catálogo das cartas de talento (por enquanto só visual: valores e economia são provisórios).

export type TalentRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type TalentIconKey =
  | 'goblet' | 'book' | 'cape' | 'emblem' | 'apple' | 'crosshair' | 'rune'
  | 'dash' | 'armor' | 'sword' | 'heart' | 'wall' | 'potion' | 'hammer';

export type TalentStat =
  | 'hp' | 'atk' | 'moveSpeed' | 'critRate' | 'critDmg' | 'dodge' | 'atkSpeed'
  | 'levelUpHeal' | 'collisionReduction' | 'skillUpgrades' | 'firstSkillChoice'
  | 'gearBaseStats' | 'heartHeal' | 'battleGold';

export interface TalentDefinition {
  id: string;
  name: string;
  rarity: TalentRarity;
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
export const TALENT_STATS: Record<TalentStat, { label: string; suffix?: string }> = {
  hp: { label: 'HP Máx.' },
  atk: { label: 'ATQ' },
  moveSpeed: { label: 'VEL MOV', suffix: '%' },
  critRate: { label: 'Taxa Crít.', suffix: '%' },
  critDmg: { label: 'Dano Crít.', suffix: '%' },
  dodge: { label: 'Desvio', suffix: '%' },
  atkSpeed: { label: 'VEL ATQ', suffix: '%' },
  levelUpHeal: { label: 'Cura ao subir de nível' },
  collisionReduction: { label: 'Redução de dano de colisão' },
  skillUpgrades: { label: 'Melhorias de habilidade' },
  firstSkillChoice: { label: 'Escolhas da primeira habilidade' },
  gearBaseStats: { label: 'Atributos base dos equipamentos', suffix: '%' },
  heartHeal: { label: 'Cura dos corações' },
  battleGold: { label: 'Ouro obtido em batalha', suffix: '%' },
};

export const TALENTS: TalentDefinition[] = [
  // Lendários (cartas únicas, 1 estrela)
  { id: 'gloria', name: 'Glória', rarity: 'legendary', icon: 'goblet', maxStars: 1, effects: [{ stat: 'firstSkillChoice', perStar: 1 }] },
  { id: 'taticas', name: 'Táticas', rarity: 'legendary', icon: 'book', maxStars: 1, effects: [{ stat: 'skillUpgrades', perStar: 1 }] },

  // Épicos
  { id: 'vento-veloz', name: 'Vento Veloz', rarity: 'epic', icon: 'cape', maxStars: 5, effects: [{ stat: 'moveSpeed', perStar: 1 }, { stat: 'atkSpeed', perStar: 1 }] },
  { id: 'refinamento', name: 'Refinamento', rarity: 'epic', icon: 'emblem', maxStars: 5, effects: [{ stat: 'gearBaseStats', perStar: 2 }] },
  { id: 'riqueza', name: 'Riqueza', rarity: 'epic', icon: 'apple', maxStars: 5, effects: [{ stat: 'battleGold', perStar: 6 }] },
  { id: 'ultra-taxa-crit', name: 'Ultra Taxa Crít.', rarity: 'epic', icon: 'crosshair', maxStars: 5, effects: [{ stat: 'critRate', perStar: 3 }] },
  { id: 'ultra-dano-crit', name: 'Ultra Dano Crít.', rarity: 'epic', icon: 'rune', maxStars: 5, effects: [{ stat: 'critDmg', perStar: 9 }] },
  { id: 'ultra-desvio', name: 'Ultra Desvio', rarity: 'epic', icon: 'dash', maxStars: 5, effects: [{ stat: 'dodge', perStar: 3 }] },

  // Raros
  { id: 'super-vigor', name: 'Super Vigor', rarity: 'rare', icon: 'armor', maxStars: 5, effects: [{ stat: 'hp', perStar: 120 }] },
  { id: 'super-forca', name: 'Super Força', rarity: 'rare', icon: 'sword', maxStars: 5, effects: [{ stat: 'atk', perStar: 30 }] },
  { id: 'super-recuperacao', name: 'Super Recuperação', rarity: 'rare', icon: 'heart', maxStars: 5, effects: [{ stat: 'heartHeal', perStar: 30 }] },
  { id: 'super-muro-de-ferro', name: 'Super Muro de Ferro', rarity: 'rare', icon: 'wall', maxStars: 5, effects: [{ stat: 'collisionReduction', perStar: 12 }] },
  { id: 'cura', name: 'Cura', rarity: 'rare', icon: 'potion', maxStars: 5, effects: [{ stat: 'levelUpHeal', perStar: 40 }] },
  { id: 'tita', name: 'Titã', rarity: 'rare', icon: 'hammer', maxStars: 5, effects: [{ stat: 'hp', perStar: 60 }, { stat: 'atk', perStar: 15 }, { stat: 'critDmg', perStar: 3 }] },
  { id: 'super-taxa-crit', name: 'Super Taxa Crít.', rarity: 'rare', icon: 'crosshair', maxStars: 5, effects: [{ stat: 'critRate', perStar: 1 }] },
  { id: 'super-dano-crit', name: 'Super Dano Crít.', rarity: 'rare', icon: 'rune', maxStars: 5, effects: [{ stat: 'critDmg', perStar: 3 }] },
  { id: 'super-desvio', name: 'Super Desvio', rarity: 'rare', icon: 'dash', maxStars: 5, effects: [{ stat: 'dodge', perStar: 1 }] },

  // Comuns
  { id: 'forca-ii', name: 'Força II', rarity: 'common', icon: 'sword', badge: 'II', maxStars: 5, effects: [{ stat: 'atk', perStar: 12 }] },
  { id: 'vigor', name: 'Vigor', rarity: 'common', icon: 'armor', maxStars: 5, effects: [{ stat: 'hp', perStar: 60 }] },
  { id: 'forca', name: 'Força', rarity: 'common', icon: 'sword', maxStars: 5, effects: [{ stat: 'atk', perStar: 6 }] },
  { id: 'recuperacao', name: 'Recuperação', rarity: 'common', icon: 'heart', maxStars: 5, effects: [{ stat: 'heartHeal', perStar: 15 }] },
  { id: 'muro-de-ferro', name: 'Muro de Ferro', rarity: 'common', icon: 'wall', maxStars: 5, effects: [{ stat: 'collisionReduction', perStar: 6 }] },
];

/** Custo em ouro do próximo sorteio, dado quantos já foram feitos */
export const talentDrawCost = (draws: number) => 500 + draws * 250;

/** Nível de conta exigido para o próximo sorteio */
export const talentDrawLevel = (draws: number) => draws * 2 + 1;

export function formatTalentEffect(stat: TalentStat, value: number) {
  const { label, suffix = '' } = TALENT_STATS[stat];
  return `${label} +${value}${suffix}`;
}

/** Talentos de exemplo (id -> estrelas) enquanto não há progresso salvo */
export const MOCK_OWNED_TALENTS: Record<string, number> = {
  'gloria': 1,
  'vento-veloz': 3,
  'riqueza': 2,
  'super-vigor': 4,
  'tita': 1,
  'super-desvio': 2,
  'forca': 5,
  'vigor': 3,
  'muro-de-ferro': 1,
};
