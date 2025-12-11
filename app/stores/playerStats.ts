import { useSkillStore } from "~/stores/SkillStore";
import { useCurrentRunStore } from "~/stores/currentRunStore";

/**
 * Atributos permanentes (Dano, Vida)
*/
export const usePlayerStats = defineStore('playerStats', () => {
  const skillStore = useSkillStore();
  const amountToHeal = ref(0);

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

  function healthAfterSkillUpgrade(maxHealthBefore: number): void {
    let newMaxHealth = PlayerBaseStats.maxHealth * getHealthMultiplier.value;
    const amountToHeal = newMaxHealth - maxHealthBefore;
    console.log('Healing player for', amountToHeal, 'after skill upgrade');
    heal(amountToHeal);
  }

  function heal(amount: number) {
    amountToHeal.value += amount;
  }

  return {
    update, // Essencial para ser chamado pelo useGameLoop

    healthAfterSkillUpgrade,
    heal,

    getDamageMultiplier,
    getHealthMultiplier,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStats, import.meta.hot));
}
