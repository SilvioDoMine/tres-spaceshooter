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
    skillRerolls: 1 + Math.max(0, Math.floor(b.skillRerolls)),
  };
}

export type CombatAttributes = ReturnType<typeof combatAttributes>;
export type DamageSource = 'attack' | 'collision' | 'environment';
export type DamageContext = { source: DamageSource; attackerId?: string };

/** Sorteio por acerto, inclusive perfuração e ricochete; não altera o projétil. */
export function outgoingHit(damage: number, stats: CombatAttributes, rng = Math.random, criticalDamageBonus = 0) {
  const critical = rng() < stats.criticalChance;
  return { damage: Math.max(0, damage) * (critical ? stats.criticalDamage + criticalDamageBonus : 1), critical };
}

export function incomingHit(damage: number, source: DamageSource, stats: CombatAttributes, rng = Math.random) {
  const dodged = source === 'attack' && damage > 0 && rng() < stats.dodgeChance;
  const reduced = source === 'collision'
    ? Math.max(0, damage - stats.collisionReductionFlat) * (1 - stats.collisionReductionFraction)
    : damage;
  return { damage: dodged ? 0 : Math.max(0, reduced), dodged };
}
