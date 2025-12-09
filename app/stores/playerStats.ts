import { useSkillStore } from "~/stores/SkillStore";

/**
 * Atributos permanentes (Dano, Vida)
*/
export const usePlayerStats = defineStore('playerStats', () => {
  const skillStore = useSkillStore();

  function update (delta: number) {
    // Atualizações contínuas dos atributos do jogador, se necessário
    // Exemplo: Regeneração de vida ao longo do tempo, buffs temporários, etc.
  };

  function getDamageMultiplier(): number {
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
  }

  function getHealthMultiplier(): number {
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
  }

  return {
    update, // Essencial para ser chamado pelo useGameLoop

    getDamageMultiplier,
    getHealthMultiplier,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStats, import.meta.hot));
}
