import { useSkillStore } from "~/stores/SkillStore";
import { PlayerBaseStats, useCurrentRunStore } from "~/stores/currentRunStore";
import { useCombatTextStore } from "~/stores/useCombatTextStore";
import { computePlayerStats, type PlayerStats } from '~/utils/equipment';
import { emptyTalentBonuses } from '~/utils/talents';
import { adrenalineMultiplier, withRunSkills } from '~/utils/shipAttributes';

const REGEN_TEXT_INTERVAL = 1; // segundos entre textos de regeneração

/**
 * Snapshot de atributos permanentes + multiplicadores das habilidades da partida.
 * O combate lê atributos, nunca ids de cartas.
*/
export const usePlayerStats = defineStore('playerStats', () => {
  const skillStore = useSkillStore();
  const attributes = shallowRef(computePlayerStats(PlayerBaseStats, emptyTalentBonuses(), emptyTalentBonuses()));
  function initialize(stats: PlayerStats) {
    attributes.value = { ...stats, bonuses: { ...stats.bonuses } };
    amountToHeal.value = 0;
    regenRate.value = 0;
    pendingRegenText = 0;
    regenTextTimer = 0;
  }
  const amountToHeal = ref(0);
  const regenRate = ref(0); // Porcentagem da vida por segundo
  const bonusDamageFlat = ref(50);
  let pendingRegenText = 0;
  let regenTextTimer = 0;

  function update (delta: number) {
    // Atualizações contínuas dos atributos do jogador, se necessário
    // Exemplo: Regeneração de vida ao longo do tempo, buffs temporários, etc.

    // Se existir amountToHeal, aplica a cura
    if (amountToHeal.value > 0) {
      // Lógica para curar o jogador
      const currentHealth = useCurrentRunStore().currentHealth;
      const maxHealth = useCurrentRunStore().maxHealth;

      console.log('Healing player for', amountToHeal.value, 'over time', 'currentHealth:', currentHealth, 'maxHealth:', maxHealth);

      useCurrentRunStore().healPlayer(amountToHeal.value);

      // Exemplo: currentHealth.value = Math.min(currentHealth.value + amountToHeal.value * delta, maxHealth.value);
      amountToHeal.value = 0; // Reseta a cura após aplicar
    }

    // Regeneração de vida ao longo do tempo
    const run = useCurrentRunStore();
    if (regenRate.value > 0 && run.isPlaying && run.isWaveInProgress) {
      const regenAmount = Math.min((regenRate.value / 100) * run.maxHealth * delta, run.maxHealth - run.currentHealth);
      // Cura por frame sem texto; o texto sai agrupado, no máximo uma vez por intervalo
      run.healPlayer(regenAmount, false);
      if (regenAmount > 0) pendingRegenText += regenAmount;
    }

    regenTextTimer += delta;
    if (regenTextTimer >= REGEN_TEXT_INTERVAL) {
      regenTextTimer = 0;
      if (pendingRegenText >= 1) {
        const shown = Math.floor(pendingRegenText);
        useCombatTextStore().emitForTarget(PlayerBaseStats.id, 'heal', shown);
        pendingRegenText -= shown;
      }
    }
  };

  const getDamageMultiplier = computed((): number => {
    let damageMultiplier = 1.0;

    // No futuro mudar por efeitos de skills
    skillStore.currentSkills.forEach((skill: any) => {
      if (skill.id === 'damage_percentage') {
        const skillLevel = skill.levels[skill.currentLevel];

        if (! skillLevel) {
          throw new Error(`Skill level ${skill.currentLevel} not found for skill ${skill.id}`);
        }

        damageMultiplier = skillLevel.value;
      }
    });

    return damageMultiplier;
  });

  const getHealthMultiplier = computed((): number => {
    let healthMultiplier = 1.0;

    skillStore.currentSkills.forEach((skill: any) => {
      if (skill.id === 'health_percentage') {
        const skillLevel = skill.levels[skill.currentLevel];

        if (! skillLevel) {
          throw new Error(`Skill level ${skill.currentLevel} not found for skill ${skill.id}`);
        }

        healthMultiplier = skillLevel.value;
      }
    });

    return healthMultiplier;
  });

  const getSpeedMultiplier = computed((): number => {
    let speedMultiplier = 1.0;

    skillStore.currentSkills.forEach((skill: any) => {
      if (skill.id === 'general_speed') {
        const skillLevel = skill.levels[skill.currentLevel];

        if (! skillLevel) {
          throw new Error(`Skill level ${skill.currentLevel} not found for skill ${skill.id}`);
        }

        speedMultiplier = skillLevel.value;
      }
    });

    return speedMultiplier;
  });

  const getProjectileSpeedMultiplier = computed((): number => {
    let projectileSpeedMultiplier = 1.0;

    skillStore.currentSkills.forEach((skill: any) => {
      if (skill.id === 'general_speed') {
        const skillLevel = skill.levels[skill.currentLevel];

        if (! skillLevel) {
          throw new Error(`Skill level ${skill.currentLevel} not found for skill ${skill.id}`);
        }

        projectileSpeedMultiplier = skillLevel.projectileValue;
      }
    });

    return projectileSpeedMultiplier;
  });

  // Dados do nível atual de uma habilidade da partida (null se o jogador não tiver)
  function skillLevelData(skillId: string): any {
    const skill: any = skillStore.currentSkills.find((s: any) => s.id === skillId);
    return skill ? skill.levels[skill.currentLevel] ?? null : null;
  }

  // Atributos de combate com Mira Precisa e Manobra Evasiva somados aos permanentes
  const combatStats = computed(() => withRunSkills(attributes.value, {
    criticalChance: skillLevelData('precise_aim')?.value || 0,
    criticalDamage: skillLevelData('precise_aim')?.critDamage || 0,
    dodgeChance: skillLevelData('evasive_maneuver')?.value || 0,
  }));

  // Cadência: divide o cooldown do tiro
  const getAttackSpeedMultiplier = computed((): number => 1 + (skillLevelData('attack_speed')?.value || 0));

  const headshotChance = computed((): number => skillLevelData('headshot')?.value || 0);
  const siphonChance = computed((): number => skillLevelData('siphon')?.value || 0);

  // Adrenalina: lida no disparo, conforme a vida atual
  function adrenalineDamageMultiplier(): number {
    const run = useCurrentRunStore();
    return adrenalineMultiplier(skillLevelData('adrenaline')?.value || 0, run.currentHealth, run.maxHealth);
  }

  function addRegenRate(amount: number) {
    regenRate.value += amount;
  }

  function setRegenRate(amount: number) {
    regenRate.value = amount;
  }

  function removeRegenRate(amount: number) {
    regenRate.value -= amount;
  }

  function getRegenRate(): number {
    return PlayerBaseStats.regenRate + regenRate.value;
  }

  function healthAfterSkillUpgrade(maxHealthBefore: number): void {
    let newMaxHealth = attributes.value.maxHealth * getHealthMultiplier.value;
    const amountToHeal = newMaxHealth - maxHealthBefore;
    console.log('Healing player for', amountToHeal, 'after skill upgrade');
    heal(amountToHeal);
  }

  function heal(amount: number) {
    amountToHeal.value += amount;
  }

  const getRangeMultiplier = computed((): number => {
    let rangeMultiplier = 1.0;

    skillStore.currentSkills.forEach((skill: any) => {
      if (skill.id === 'range_extension') {
        const skillLevel = skill.levels[skill.currentLevel];

        if (! skillLevel) {
          throw new Error(`Skill level ${skill.currentLevel} not found for skill ${skill.id}`);
        }

        rangeMultiplier = skillLevel.value;
      }
    });

    return rangeMultiplier;
  });

  const getBonusDamageFlat = computed((): number => {
    return bonusDamageFlat.value;
  });

  return {
    attributes,
    initialize,
    damage: computed(() => attributes.value.damage * getDamageMultiplier.value),
    maxHealth: computed(() => attributes.value.maxHealth * getHealthMultiplier.value),
    moveSpeed: computed(() => attributes.value.moveSpeed * getSpeedMultiplier.value),
    update, // Essencial para ser chamado pelo useGameLoop

    healthAfterSkillUpgrade,
    heal,

    addRegenRate,
    setRegenRate,
    removeRegenRate,

    getDamageMultiplier,
    getHealthMultiplier,
    getRegenRate,
    getSpeedMultiplier,
    getProjectileSpeedMultiplier,
    getRangeMultiplier,
    getBonusDamageFlat,

    combatStats,
    getAttackSpeedMultiplier,
    headshotChance,
    siphonChance,
    adrenalineDamageMultiplier,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStats, import.meta.hot));
}
