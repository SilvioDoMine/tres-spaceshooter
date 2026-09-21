import type { EquipmentRarity } from '~/data/equipment';

// Raridades das cartas de habilidade (~/stores/SkillStore) traduzidas para a moldura/rótulo da UI.
// `poor` e `common` dividem a mesma moldura cinza; o resto acompanha a escala dos equipamentos.
export type SkillRarity = 'poor' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const SKILL_RARITIES: Record<SkillRarity, { frame: EquipmentRarity; label: string }> = {
  poor: { frame: 'gray', label: 'Comum' },
  common: { frame: 'gray', label: 'Comum' },
  uncommon: { frame: 'green', label: 'Incomum' },
  rare: { frame: 'blue', label: 'Rara' },
  epic: { frame: 'purple', label: 'Épica' },
  legendary: { frame: 'orange', label: 'Lendária' },
};

/** Habilidade como ela vive no SkillStore (a carta do catálogo + o nível obtido na partida) */
export interface RunSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: SkillRarity;
  repeatable?: boolean;
  levels: Record<number, { description?: string }>;
  currentLevel?: number;
}

export const skillRarity = (skill?: RunSkill | null) =>
  SKILL_RARITIES[skill?.rarity as SkillRarity] ?? SKILL_RARITIES.common;

/** Maior nível descrito no catálogo da carta */
export const skillMaxLevel = (skill?: RunSkill | null) => {
  if (!skill?.levels) return 0;
  return Object.keys(skill.levels).reduce((max, key) => Math.max(max, Number(key)), 0);
};

/** Texto do efeito de um nível (vazio quando o nível não existe) */
export const skillLevelText = (skill: RunSkill | null | undefined, level: number) =>
  skill?.levels?.[level]?.description ?? '';
