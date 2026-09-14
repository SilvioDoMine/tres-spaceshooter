import type { TalentBonuses } from './talents';

// Bases das mecânicas novas; os bônus das cartas permanecem no catálogo.
export const COMBAT_BASE = { criticalDamage: 2, heartHeal: 25, heartDropChance: 0.1 };
const chance = (percent: number) => Math.max(0, Math.min(1, percent / 100));

export function combatAttributes(b: TalentBonuses) {
  return {
    criticalChance: chance(b.critRatePercent),
    criticalDamage: COMBAT_BASE.criticalDamage + b.critDamagePercent / 100,
    dodgeChance: chance(b.dodgePercent),
    levelUpHealFraction: Math.max(0, b.levelUpHealPercent / 100),
    collisionReductionFlat: Math.max(0, b.collisionReductionFlat),
    collisionReductionFraction: chance(b.collisionReductionPercent),
    heartHeal: (COMBAT_BASE.heartHeal + b.heartHealFlat) * (1 + b.heartHealPercent / 100),
    battleGoldMultiplier: 1 + b.battleGoldPercent / 100,
    startingSkillChoices: Math.max(0, Math.floor(b.startingSkillChoices)),
    skillRerolls: Math.max(0, Math.floor(b.skillRerolls)),
  };
}

export type CombatAttributes = ReturnType<typeof combatAttributes>;

/** Soma as habilidades da partida (Mira Precisa, Manobra Evasiva) sobre os atributos permanentes. */
export function withRunSkills<T extends CombatAttributes>(stats: T, skills: { criticalChance?: number; criticalDamage?: number; dodgeChance?: number }): T {
  return {
    ...stats,
    criticalChance: Math.max(0, Math.min(1, stats.criticalChance + (skills.criticalChance || 0))),
    criticalDamage: stats.criticalDamage + (skills.criticalDamage || 0),
    dodgeChance: Math.max(0, Math.min(1, stats.dodgeChance + (skills.dodgeChance || 0))),
  };
}

/** Adrenalina: bônus cresce com a vida perdida e chega ao máximo com 20% de vida ou menos. */
export const ADRENALINE_FULL_AT = 0.2;
export function adrenalineMultiplier(maxBonus: number, health: number, maxHealth: number) {
  if (maxBonus <= 0 || maxHealth <= 0) return 1;
  const missing = 1 - Math.max(0, Math.min(1, health / maxHealth));
  return 1 + maxBonus * Math.min(1, missing / (1 - ADRENALINE_FULL_AT));
}

/** Sifão: cada abate tem uma chance de curar uma fração fixa da vida máxima. */
export const SIPHON_HEAL_FRACTION = 0.05;
export function siphonHeal(chance: number, maxHealth: number, rng = Math.random) {
  return chance > 0 && rng() < chance ? maxHealth * SIPHON_HEAL_FRACTION : 0;
}

/** Tiro Certeiro: só elimina inimigos comuns, minis e elites; chefes e fragmentos de chefe ficam de fora. */
export const HEADSHOT_CATEGORIES = ['common', 'mini', 'elite'];
export function headshotKills(chance: number, category: string, rng = Math.random) {
  return chance > 0 && HEADSHOT_CATEGORIES.includes(category) && rng() < chance;
}
/** Aprendizado: bônus de EXP que cresce a cada sala concluída depois de pegar a carta, até o teto do nível. */
export function experienceBonus(level: { value: number; perRoom: number; max: number } | null | undefined, roomsCleared: number) {
  if (!level) return 0;
  return Math.min(level.max, level.value + level.perRoom * Math.max(0, roomsCleared));
}

/** Reparo de Emergência: cura uma fração sorteada entre `min` e `max` da vida máxima. */
export function emergencyRepairHeal(maxHealth: number, level: { min: number; max: number }, rng = Math.random) {
  return Math.round(Math.max(0, maxHealth) * (level.min + (level.max - level.min) * rng()));
}

export type DamageSource = 'attack' | 'collision' | 'environment';
export type DamageContext = { source: DamageSource; attackerId?: string };

/** Sorteio por acerto, inclusive perfuração e ricochete; não altera o projétil. */
export function outgoingHit(damage: number, stats: CombatAttributes, rng = Math.random, criticalDamageBonus = 0) {
  const critical = rng() < stats.criticalChance;
  return { damage: Math.max(0, damage) * (critical ? stats.criticalDamage + criticalDamageBonus : 1), critical };
}

export function incomingHit(damage: number, source: DamageSource, stats: CombatAttributes, rng = Math.random) {
  // Esquiva vale para tiros e colisões; dano de ambiente (queimadura, gelo, dilatação) nunca é esquivado
  const dodged = source !== 'environment' && damage > 0 && rng() < stats.dodgeChance;
  const reduced = source === 'collision'
    ? Math.max(0, damage - stats.collisionReductionFlat) * (1 - stats.collisionReductionFraction)
    : damage;
  return { damage: dodged ? 0 : Math.max(0, reduced), dodged };
}
