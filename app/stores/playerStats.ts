import { useSkillStore } from "~/stores/SkillStore";
import { PlayerBaseStats, useCurrentRunStore } from "~/stores/currentRunStore";
import { useCombatTextStore } from "~/stores/useCombatTextStore";
import { computePlayerStats, type PlayerStats } from '~/utils/equipment';
import { emptyTalentBonuses } from '~/utils/talents';
import { adrenalineMultiplier, experienceBonus, standingGroundCharge, withRunSkills } from '~/utils/shipAttributes';

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
    heartMaxHealthBonus.value = 0;
    heartFuryTime.value = 0;
    standingTime.value = 0;
  }
  const amountToHeal = ref(0);
  const regenRate = ref(0); // Porcentagem da vida por segundo
  const bonusDamageFlat = ref(50);
  // Núcleo Vital: vida máxima acumulada com os corações da partida (aditiva, fora do multiplicador da carta de HP)
  const heartMaxHealthBonus = ref(0);
  // Fúria Carmesim: segundos restantes do bônus de dano aceso pelo último coração
  const heartFuryTime = ref(0);
  // Posição Firme: segundos com a nave parada (zera no primeiro passo)
  const standingTime = ref(0);
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

    // Fúria Carmesim: o cronômetro corre junto com a simulação, então Fast Game o consome mais rápido também
    if (heartFuryTime.value > 0) heartFuryTime.value = Math.max(0, heartFuryTime.value - delta);

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

    // Cadência acelera o projétil pela raiz: os tiros não se amontoam quando a
    // velocidade de ataque escala, mas o espaçamento ainda diminui aos poucos.
    // Tiro de Curta Distância fica fora da raiz: o catálogo já declara quanto o projétil acelera,
    // e passar o attackSpeed dela pela raiz contaria o mesmo bônus duas vezes.
    return projectileSpeedMultiplier * (shortRange.value?.projectileSpeed || 1) * Math.sqrt(cadenceMultiplier.value);
  });

  // Dados do nível atual de uma habilidade da partida (null se o jogador não tiver)
  function skillLevelData(skillId: string): any {
    const skill: any = skillStore.currentSkills.find((s: any) => s.id === skillId);
    return skill ? skill.levels[skill.currentLevel] ?? null : null;
  }

  /**
   * Tiro de Curta Distância: nível único que troca alcance por cadência, dano e velocidade de
   * projétil. Os quatro fatores saem direto do catálogo (SkillsList.short_range_shot), então
   * rebalancear é mexer só lá. Sem a carta, `null`, e nenhum multiplicador muda.
   */
  const shortRange = computed((): any => skillLevelData('short_range_shot'));

  // Atributos de combate com Mira Precisa e Manobra Evasiva somados aos permanentes
  const combatStats = computed(() => withRunSkills(attributes.value, {
    criticalChance: skillLevelData('precise_aim')?.value || 0,
    criticalDamage: skillLevelData('precise_aim')?.critDamage || 0,
    dodgeChance: skillLevelData('evasive_maneuver')?.value || 0,
  }));

  /**
   * Posição Firme: carga acumulada pela nave parada. `usePlayerControls` chama isto a cada quadro
   * com o mesmo `moving` que decide se a nave pode atirar — parar para mirar e carregar são o
   * mesmo gesto. Congelada a nave também conta como parada: ela perde os tiros do congelamento,
   * mas não perde a carga (e continua pagando a vulnerabilidade). Sem a carta o cronômetro fica
   * zerado e nada muda.
   */
  function trackStanding(delta: number, moving: boolean) {
    if (moving || !skillLevelData('standing_ground')) {
      // Escrita condicionada: com a nave andando (ou sem a carta) o quadro não mexe na reatividade
      if (standingTime.value !== 0) standingTime.value = 0;
      return;
    }
    standingTime.value += Math.max(0, delta);
  }

  const standingGround = computed(() => standingGroundCharge(skillLevelData('standing_ground'), standingTime.value));
  // 0..1 para a HUD e o campo de ancoragem: quanto da carga já foi acumulada
  const standingGroundProgress = computed((): number => standingGround.value.progress);
  // Dano extra que só os tiros inimigos cobram enquanto a carga está de pé
  const projectileVulnerability = computed((): number => standingGround.value.vulnerability);

  // Cadência: divide o cooldown do tiro. Posição Firme multiplica por cima do bônus da carta de Cadência.
  // Só esta parte acopla no projétil pela raiz (veja getProjectileSpeedMultiplier).
  const cadenceMultiplier = computed((): number =>
    (1 + (skillLevelData('attack_speed')?.value || 0)) * standingGround.value.attackSpeed);

  const getAttackSpeedMultiplier = computed((): number =>
    cadenceMultiplier.value * (shortRange.value?.attackSpeed || 1));

  const headshotChance = computed((): number => skillLevelData('headshot')?.value || 0);
  const siphonChance = computed((): number => skillLevelData('siphon')?.value || 0);
  // Aprendizado: multiplica a EXP dos abates; cresce com as salas concluídas desde que a carta foi pega
  const experienceMultiplier = computed((): number => 1 + experienceBonus(skillLevelData('exp_growth'), skillStore.experienceRooms));

  // Caça Rastreador: raio mínimo da curva dos projéteis (0 sem a carta). Não mexe no alcance.
  const homingRadius = computed((): number => skillLevelData('homing_shot')?.value || 0);

  // Rastro de Fogo: acende o rastro que o Propulsor Cometa também alimenta (null sem a carta)
  const fireTrail = computed(() => {
    const level = skillLevelData('fire_trail');
    return level ? { damage: level.value, width: level.width } : null;
  });

  // Tiro de Fogo, Gelo e Raio: payload elemental levado por cada projétil (null sem nenhum)
  function elementalPayload(range: number): any {
    const fire = skillLevelData('fire_shot'), ice = skillLevelData('ice_shot'), lightning = skillLevelData('lightning_shot');
    if (!fire && !ice && !lightning) return null;
    return {
      ...(fire ? { fire: { burn: fire.value, duration: fire.duration } } : {}),
      ...(ice ? { ice: { damage: ice.value, shatter: ice.shatter, duration: ice.duration } } : {}),
      ...(lightning ? { lightning: { bonus: lightning.value, chains: lightning.chains, range } } : {}),
    };
  }

  // Fúria Carmesim: enquanto o cronômetro corre, o bônus do nível atual multiplica o dano
  const heartFuryActive = computed((): boolean => heartFuryTime.value > 0);
  const getHeartFuryMultiplier = computed((): number => (heartFuryActive.value ? 1 + (skillLevelData('heart_fury')?.value || 0) : 1));

  /**
   * Coração recolhido pela nave: Núcleo Vital soma vida máxima permanente e Fúria Carmesim
   * (re)acende o bônus de dano. As duas cartas valem mesmo com a vida cheia.
   */
  function collectHeart() {
    const run = useCurrentRunStore();
    const core = skillLevelData('vital_core');
    if (core) {
      heartMaxHealthBonus.value += core.value;
      // O HP ganho já entra curado: a barra cresce em vez de abrir um buraco
      run.refreshMaxHealthFromStats(true);
      useCombatTextStore().emitForTarget(PlayerBaseStats.id, 'vital', `+${core.value} VIDA MÁX`);
    }
    const fury = skillLevelData('heart_fury');
    if (fury) {
      // Um coração novo renova a duração inteira; o texto só sai quando a aura acende
      if (!heartFuryActive.value) useCombatTextStore().emitForTarget(PlayerBaseStats.id, 'fury', 'FÚRIA');
      heartFuryTime.value = fury.duration;
    }
  }

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
    const amountToHeal = useCurrentRunStore().maxHealth - maxHealthBefore;
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

    // Tiro de Curta Distância encolhe o que Alcance Estendido tiver dado: as duas cartas convivem
    return rangeMultiplier * (shortRange.value?.range ?? 1);
  });

  const getBonusDamageFlat = computed((): number => {
    return bonusDamageFlat.value;
  });

  return {
    attributes,
    initialize,
    damage: computed(() => attributes.value.damage * getDamageMultiplier.value
      * getHeartFuryMultiplier.value * (shortRange.value?.damage || 1)),
    maxHealth: computed(() => attributes.value.maxHealth * getHealthMultiplier.value + heartMaxHealthBonus.value),
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
    experienceMultiplier,
    adrenalineDamageMultiplier,
    elementalPayload,

    // Corações: Núcleo Vital e Fúria Carmesim
    collectHeart,
    heartMaxHealthBonus,
    heartFuryTime,
    heartFuryActive,
    getHeartFuryMultiplier,
    fireTrail,
    homingRadius,

    // Posição Firme
    trackStanding,
    standingTime,
    standingGroundProgress,
    projectileVulnerability,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlayerStats, import.meta.hot));
}
