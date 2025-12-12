import { useSkillStore } from "~/stores/SkillStore";
import { useCurrentRunStore } from "~/stores/currentRunStore";

/**
 * Atributos permanentes (Dano, Vida)
*/
export const usePlayerStats = defineStore('playerStats', () => {
  const skillStore = useSkillStore();
  const amountToHeal = ref(0);
  const regenRate = ref(0); // Porcentagem da vida por segundo
  const bonusDamageFlat = ref(50);

  const timePassedSinceLastRegen = ref(0);

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
    if (regenRate.value > 0) {

      if (timePassedSinceLastRegen.value >= 1.0) { // Aplica a regeneração a cada segundo
        const currentHealth = useCurrentRunStore().currentHealth;
        const maxHealth = useCurrentRunStore().maxHealth;
        const regenAmount = (regenRate.value / 100) * maxHealth * timePassedSinceLastRegen.value;

        const heal = Math.min(Math.ceil(regenAmount), maxHealth - currentHealth);

        useCurrentRunStore().healPlayer(heal);

        console.log('Regenerated', heal, 'health for player', 'currentHealth:', currentHealth, 'maxHealth:', maxHealth);

        timePassedSinceLastRegen.value = 0;
      } else {
        timePassedSinceLastRegen.value += delta;
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

        const multiplier = skillLevel.value;
        damageMultiplier += damageMultiplier * multiplier;
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

        const multiplier = skillLevel.value;
        healthMultiplier += healthMultiplier * multiplier;
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

        const multiplier = skillLevel.value;
        speedMultiplier += speedMultiplier * multiplier;
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

        const multiplier = skillLevel.value;
        projectileSpeedMultiplier += projectileSpeedMultiplier * multiplier;
      }
    });

    return projectileSpeedMultiplier;
  });

  function addRegenRate(amount: number) {
    regenRate.value += amount;
  }

  function removeRegenRate(amount: number) {
    regenRate.value -= amount;
  }

  function getRegenRate(): number {
    return PlayerBaseStats.regenRate + regenRate.value;
  }

  function healthAfterSkillUpgrade(maxHealthBefore: number): void {
    let newMaxHealth = PlayerBaseStats.maxHealth * getHealthMultiplier.value;
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

        const multiplier = skillLevel.value;
        rangeMultiplier += rangeMultiplier * multiplier;
      }
    });

    return rangeMultiplier;
  });

  const getBonusDamageFlat = computed((): number => {
    return bonusDamageFlat.value;
  });

  return {
    update, // Essencial para ser chamado pelo useGameLoop

    healthAfterSkillUpgrade,
    heal,

    addRegenRate,
    removeRegenRate,

    getDamageMultiplier,
    getHealthMultiplier,
    getRegenRate,
    getSpeedMultiplier,
    getProjectileSpeedMultiplier,
    getRangeMultiplier,
    getBonusDamageFlat,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStats, import.meta.hot));
}
