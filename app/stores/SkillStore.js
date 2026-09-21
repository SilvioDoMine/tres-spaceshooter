// `icon`: chave de um SVG de ~/data/skillIcons (padrão) ou qualquer emoji, mostrado na mesma caixa
export const SkillsList ={
  flat_gold: {
    id: 'flat_gold',
    name: 'Ouro Bônus',
    description: 'Concede uma quantidade fixa de ouro caso complete a fase.',
    icon: 'coins',
    rarity: 'poor',
    levels: {
      1: { value: 100, description: '+100 de ouro' },
      2: { value: 200, description: '+100 de ouro' },
      3: { value: 300, description: '+100 de ouro' },
      4: { value: 400, description: '+100 de ouro' },
      5: { value: 500, description: '+100 de ouro' },
      6: { value: 600, description: '+100 de ouro' },
      7: { value: 700, description: '+100 de ouro' },
      8: { value: 800, description: '+100 de ouro' },
      9: { value: 900, description: '+100 de ouro' },
      10: { value: 1000, description: '+100 de ouro' },
      11: { value: 1100, description: '+100 de ouro' },
      12: { value: 1200, description: '+100 de ouro' },
      13: { value: 1300, description: '+100 de ouro' },
      14: { value: 1400, description: '+100 de ouro' },
      15: { value: 1500, description: '+100 de ouro' },
    }
  },
  damage_percentage: {
    id: 'damage_percentage',
    name: 'Dano Aumentado',
    description: 'Aumenta o dano base do seu projétil.',
    icon: 'damage-up',
    rarity: 'uncommon',
    levels: {
      1: { value: 1.20, description: 'Dano total: 120% do dano base' },
      2: { value: 1.40, description: 'Dano total: 140% do dano base' },
      3: { value: 1.60, description: 'Dano total: 160% do dano base' },
      4: { value: 1.90, description: 'Dano total: 190% do dano base' },
      5: { value: 2.25, description: 'Dano total: 225% do dano base' },
    }
  },
  health_percentage: {
    id: 'health_percentage',
    name: 'Vida Aumentada',
    description: 'Aumenta sua vida máxima permanentemente.',
    icon: 'health-up',
    rarity: 'uncommon',
    levels: {
      1: { value: 1.20, description: 'HP máximo: 300' },
      2: { value: 1.40, description: 'HP máximo: 350' },
      3: { value: 1.70, description: 'HP máximo: 425' },
      4: { value: 2.10, description: 'HP máximo: 525' },
      5: { value: 2.60, description: 'HP máximo: 650' },
    }
  },
  // Cura por tempo removida das cartas (o dano dos inimigos ficou alto demais para regenerar de graça)
  // health_regeneration: {
  //   id: 'health_regeneration',
  //   name: 'Regeneração de Vida',
  //   description: 'Regenera uma porcentagem da sua vida máxima a cada segundo.',
  //   icon: '🩹',
  //   rarity: 'uncommon',
  //   levels: {
  //     1: { value: 0.004, description: 'Regenera 0,40% da vida máxima por segundo' },
  //     2: { value: 0.008, description: 'Regenera 0,80% da vida máxima por segundo' },
  //     3: { value: 0.012, description: 'Regenera 1,20% da vida máxima por segundo' },
  //     4: { value: 0.016, description: 'Regenera 1,60% da vida máxima por segundo' },
  //     5: { value: 0.020, description: 'Regenera 2,00% da vida máxima por segundo' },
  //   }
  // },
  exp_growth: {
    id: 'exp_growth',
    name: 'Aprendizado',
    description: 'Aumenta a EXP ganha na partida. O bônus cresce a cada sala concluída depois de pegar a carta.',
    icon: 'datapad',
    rarity: 'uncommon',
    levels: {
      // value: bônus inicial; perRoom: quanto cresce por sala concluída; max: teto do bônus
      1: { value: 0.10, perRoom: 0.02, max: 0.40, description: '+10% de EXP, +2% por sala concluída (até +40%)' },
      2: { value: 0.15, perRoom: 0.03, max: 0.60, description: '+15% de EXP, +3% por sala concluída (até +60%)' },
      3: { value: 0.20, perRoom: 0.04, max: 0.80, description: '+20% de EXP, +4% por sala concluída (até +80%)' },
      4: { value: 0.25, perRoom: 0.05, max: 1.00, description: '+25% de EXP, +5% por sala concluída (até +100%)' },
      5: { value: 0.30, perRoom: 0.06, max: 1.20, description: '+30% de EXP, +6% por sala concluída (até +120%)' },
    }
  },
  emergency_repair: {
    id: 'emergency_repair',
    name: 'Reparo de Emergência',
    description: 'Restaura na hora uma parte aleatória da sua vida máxima. Pode aparecer de novo; não aparece com a vida cheia.',
    icon: 'wrench',
    rarity: 'uncommon',
    // Uso imediato: não ocupa espaço nas habilidades obtidas e nunca esgota
    repeatable: true,
    levels: {
      1: { min: 0.25, max: 0.75, description: 'Restaura de 25% a 75% da vida máxima' },
    }
  },
  vital_core: {
    id: 'vital_core',
    name: 'Núcleo Vital',
    description: 'Cada coração coletado aumenta sua vida máxima pelo resto da partida. Vale também com a vida cheia.',
    icon: 'vital-core',
    rarity: 'uncommon',
    levels: {
      1: { value: 6, description: '+6 de vida máxima por coração' },
      2: { value: 9, description: '+9 de vida máxima por coração' },
      3: { value: 12, description: '+12 de vida máxima por coração' },
      4: { value: 16, description: '+16 de vida máxima por coração' },
      5: { value: 20, description: '+20 de vida máxima por coração' },
    }
  },
  heart_fury: {
    id: 'heart_fury',
    name: 'Fúria Carmesim',
    description: 'Cada coração coletado acende uma aura ao redor da nave e aumenta seu dano por 30s. Um novo coração renova a duração.',
    icon: 'heart-fury',
    rarity: 'uncommon',
    levels: {
      1: { value: 0.15, duration: 30, description: '+15% de dano por 30s' },
      2: { value: 0.22, duration: 30, description: '+22% de dano por 30s' },
      3: { value: 0.30, duration: 30, description: '+30% de dano por 30s' },
      4: { value: 0.40, duration: 30, description: '+40% de dano por 30s' },
      5: { value: 0.50, duration: 30, description: '+50% de dano por 30s' },
    }
  },
  general_speed: {
    id: 'general_speed',
    name: 'Velocidade Aumentada',
    description: 'Aumenta sua velocidade de movimento e disparo.',
    icon: 'thrusters',
    rarity: 'uncommon',
    levels: {
      1: { value: 1.06, projectileValue: 1.08, description: 'Nave +6%; projéteis +8%' },
      2: { value: 1.12, projectileValue: 1.16, description: 'Nave +12%; projéteis +16%' },
      3: { value: 1.18, projectileValue: 1.24, description: 'Nave +18%; projéteis +24%' },
      4: { value: 1.24, projectileValue: 1.32, description: 'Nave +24%; projéteis +32%' },
      5: { value: 1.30, projectileValue: 1.40, description: 'Nave +30%; projéteis +40%' },
    },
  },
  ricochet_shot: {
    id: 'ricochet_shot',
    name: 'Tiro Ricochete',
    description: 'Seus projéteis ricocheteiam nos inimigos, perdendo metade do dano a cada salto.',
    icon: 'ricochet',
    rarity: 'epic',
    levels: {
      1: { value: 0.5, description: 'Projéteis ricocheteiam 1 vez.' },
      2: { value: 0.5, description: 'Projéteis ricocheteiam 2 vezes.'},
      3: { value: 0.5, description: 'Projéteis ricocheteiam 3 vezes.'},
      4: { value: 0.5, description: 'Projéteis ricocheteiam 4 vezes.'},
      5: { value: 0.5, description: 'Projéteis ricocheteiam 5 vezes.'},
    },
  },
  diagonal_shot: {
    id: 'diagonal_shot',
    name: 'Tiros Diagonais',
    description: 'Adiciona tiros diagonais e laterais com 50% do dano.',
    icon: 'spread-shot',
    rarity: 'rare',
    levels: {
      1: { value: 0.5, description: 'Dispara +2 projéteis diagonais (45°).' },
      2: { value: 0.5, description: 'Dispara também +2 projéteis laterais (90°).' },
    },
  },
  back_shot: {
    id: 'back_shot',
    name: 'Tiro Traseiro',
    description: 'Canhões traseiros disparam diretamente para trás com 65% do dano.',
    icon: 'back-shot',
    rarity: 'rare',
    levels: {
      1: { value: 0.65, description: 'Dispara 1 projétil para trás com 65% do dano.' },
      2: { value: 0.65, description: 'Dispara 2 projéteis para trás com 65% do dano cada.' },
    },
  },
  piercing_shot: {
    id: 'piercing_shot',
    name: 'Tiro Perfurante',
    description: 'Seus projéteis perfuram inimigos, atingindo múltiplos alvos.',
    icon: 'pierce',
    rarity: 'rare',
    levels: {
      1: { value: 2, description: 'Atinge no máximo 2 inimigos no total.' },
      2: { value: 3, description: 'Atinge no máximo 3 inimigos no total.' },
      3: { value: 5, description: 'Atinge no máximo 5 inimigos no total.' },
      4: { value: 8, description: 'Atinge no máximo 8 inimigos no total.' },
    },
  },
  range_extension: {
    id: 'range_extension',
    name: 'Alcance Estendido',
    description: 'Aumenta o alcance dos seus projéteis.',
    icon: 'radar',
    rarity: 'epic',
    levels: {
      1: { value: 13.5 / 11, description: 'Alcance total: 13,5' },
      2: { value: 16 / 11, description: 'Alcance total: 16' },
      3: { value: 19 / 11, description: 'Alcance total: 19' },
      4: { value: 22 / 11, description: 'Alcance total: 22' },
      5: { value: 25 / 11, description: 'Alcance total: 25' },
    },
  },
  precise_aim: {
    id: 'precise_aim',
    name: 'Mira Precisa',
    description: 'Aumenta a chance e o dano dos acertos críticos.',
    icon: 'crosshair',
    rarity: 'rare',
    levels: {
      1: { value: 0.10, critDamage: 0.20, description: '+10% chance de crítico; +20% dano crítico' },
      2: { value: 0.18, critDamage: 0.40, description: '+18% chance de crítico; +40% dano crítico' },
      3: { value: 0.25, critDamage: 0.60, description: '+25% chance de crítico; +60% dano crítico' },
    },
  },
  attack_speed: {
    id: 'attack_speed',
    name: 'Cadência',
    description: 'Aumenta a velocidade de ataque, disparando com mais frequência.',
    icon: 'rotary-cannon',
    rarity: 'uncommon',
    levels: {
      1: { value: 0.08, description: 'Velocidade de ataque +8%' },
      2: { value: 0.16, description: 'Velocidade de ataque +16%' },
      3: { value: 0.24, description: 'Velocidade de ataque +24%' },
      4: { value: 0.32, description: 'Velocidade de ataque +32%' },
      5: { value: 0.40, description: 'Velocidade de ataque +40%' },
    },
  },
  adrenaline: {
    id: 'adrenaline',
    name: 'Adrenalina',
    description: 'Quanto menos vida, mais dano. O bônus é máximo com 20% de vida ou menos.',
    icon: 'adrenaline',
    rarity: 'rare',
    levels: {
      1: { value: 0.30, description: 'Até +30% de dano' },
      2: { value: 0.50, description: 'Até +50% de dano' },
      3: { value: 0.70, description: 'Até +70% de dano' },
    },
  },
  headshot: {
    id: 'headshot',
    name: 'Tiro Certeiro',
    description: 'Chance de eliminar na hora inimigos comuns e elites. Não afeta chefes.',
    icon: 'alien-skull',
    rarity: 'legendary',
    levels: {
      1: { value: 0.04, description: '4% de chance por acerto' },
      2: { value: 0.07, description: '7% de chance por acerto' },
    },
  },
  evasive_maneuver: {
    id: 'evasive_maneuver',
    name: 'Manobra Evasiva',
    description: 'Aumenta a chance de desviar de projéteis e colisões inimigas.',
    icon: 'evasion',
    rarity: 'rare',
    levels: {
      1: { value: 0.07, description: '+7% chance de desvio' },
      2: { value: 0.14, description: '+14% chance de desvio' },
      3: { value: 0.20, description: '+20% chance de desvio' },
    },
  },
  siphon: {
    id: 'siphon',
    name: 'Sifão',
    description: 'Ao destruir um inimigo, tem chance de curar 5% da vida máxima.',
    icon: 'siphon',
    rarity: 'rare',
    levels: {
      1: { value: 0.05, description: '5% de chance por abate de curar 5% da vida' },
    },
  },
  front_shot: {
    id: 'front_shot',
    name: 'Tiro Frontal',
    description: 'Dispara projéteis frontais lado a lado; os adicionais causam 40% do dano.',
    icon: 'front-shot',
    rarity: 'epic',
    levels: {
      1: { value: 0.4, description: 'Dispara 2 projéteis frontais.' },
      2: { value: 0.4, description: 'Dispara 3 projéteis frontais.' },
    },
  },
  fire_shot: {
    id: 'fire_shot',
    name: 'Tiro de Fogo',
    description: 'Os projéteis incendeiam o alvo, que sofre dano por segundo baseado no dano do tiro.',
    icon: 'fire-shot',
    rarity: 'epic',
    levels: {
      1: { value: 0.15, duration: 3, description: 'Queima 15% do dano do tiro por segundo, por 3s.' },
      2: { value: 0.24, duration: 3, description: 'Queima 24% do dano do tiro por segundo, por 3s.' },
    },
  },
  ice_shot: {
    id: 'ice_shot',
    name: 'Tiro de Gelo',
    description: 'Congela o alvo com dano bruto ao congelar e ao descongelar. Dano de outra fonte quebra o gelo. Chefes congelam por menos tempo.',
    icon: 'ice-crystal',
    rarity: 'epic',
    levels: {
      1: { value: 0.35, shatter: 0.35, duration: 1.5, description: 'Congela por 1,5s; 35% do dano do tiro ao congelar e ao quebrar.' },
      2: { value: 0.5, shatter: 0.5, duration: 2, description: 'Congela por 2s; 50% do dano do tiro ao congelar e ao quebrar.' },
    },
  },
  lightning_shot: {
    id: 'lightning_shot',
    name: 'Tiro de Raio',
    description: 'Causa dano elétrico extra que salta para até 2 inimigos próximos, dentro do alcance da arma.',
    icon: 'lightning',
    rarity: 'epic',
    levels: {
      1: { value: 0.25, chains: 2, description: '+25% do dano como raio, que salta para 2 inimigos.' },
      2: { value: 0.4, chains: 2, description: '+40% do dano como raio, que salta para 2 inimigos.' },
    },
  },
  homing_shot: {
    id: 'homing_shot',
    name: 'Caça Rastreador',
    description: 'Os projéteis perseguem o inimigo, fazendo a curva atrás dele. A curva usa a própria velocidade do tiro, então alvo colado na lateral ainda escapa.',
    icon: 'homing-shot',
    rarity: 'epic',
    // value: raio mínimo da curva. Menor = curva mais fechada = erra menos.
    // O alcance da arma não muda: a distância percorrida na curva gasta o mesmo orçamento do tiro reto.
    levels: {
      1: { value: 2.6, description: 'Os projéteis perseguem o alvo mais próximo.' },
    },
  },
  fire_trail: {
    id: 'fire_trail',
    name: 'Rastro de Fogo',
    description: 'A nave acende o chão por onde passa. Quem encostar no rastro se queima.',
    icon: 'fire-trail',
    rarity: 'rare',
    // Mesmo rastro do Propulsor Cometa: com o propulsor equipado a largura fica com a maior das
    // duas fontes e o dano soma, então a carta sempre acrescenta alguma coisa.
    levels: {
      1: { value: 0.12, width: 1, description: 'O rastro causa 12% do seu dano como fogo, no máximo 2x por segundo por inimigo.' },
    },
  },
  multishot: {
    id: 'multishot',
    name: 'Tiros Múltiplos',
    description: 'Repete a rajada de todas as armas logo em seguida; as repetições causam 40% do dano.',
    icon: 'burst',
    rarity: 'legendary',
    levels: {
      1: { value: 0.4, description: 'Cada arma dispara 2 vezes.' },
      2: { value: 0.4, description: 'Cada arma dispara 3 vezes.' },
    },
  },
  standing_ground: {
    id: 'standing_ground',
    name: 'Posição Firme',
    description: 'Parada, a nave ancora no lugar e vai acelerando o tiro até virar metralhadora em 30s. Qualquer movimento zera a carga; quanto mais carregada, mais dano de projétil ela recebe.',
    icon: 'standing-ground',
    rarity: 'epic',
    // value: teto do multiplicador de cadência; vulnerability: dano extra de projétil com a carga cheia.
    // O teto sobe por nível, o risco não: subir a carta melhora o prêmio, nunca a punição.
    levels: {
      1: { value: 4, vulnerability: 1, ramp: 30, description: 'Cadência até 4x depois de 30s parada; até +100% de dano de projétil recebido.' },
      2: { value: 5.5, vulnerability: 1, ramp: 30, description: 'Cadência até 5,5x depois de 30s parada; até +100% de dano de projétil recebido.' },
      3: { value: 7, vulnerability: 1, ramp: 30, description: 'Cadência até 7x depois de 30s parada; até +100% de dano de projétil recebido.' },
    },
  },
  short_range_shot: {
    id: 'short_range_shot',
    name: 'Tiro de Curta Distância',
    description: 'Encurta o alcance para corpo a corpo e transforma a arma numa metralhadora de perto.',
    icon: 'shotgun',
    rarity: 'legendary',
    // Nível único: a carta não sobe de nível, some do sorteio depois de pega.
    levels: {
      // Cada campo é um multiplicador direto sobre a base da nave, para balancear mexendo só aqui.
      // range também encolhe o círculo de alcance e a mira automática; a câmera acompanha sozinha.
      // projectileSpeed é o fator final da carta: o acoplamento da Cadência com o projétil (raiz
      // quadrada) ignora o attackSpeed desta carta, então o número aqui é o que vale na prática.
      1: {
        range: 0.45,
        damage: 1.2,
        attackSpeed: 2,
        projectileSpeed: 1,
        description: 'Alcance: 45% do normal. Em troca, dano +20% e cadência +100%.',
      },
    },
  }
};

export const useSkillStore = defineStore('SkillStore', () => {
    const isModalOpen = ref(false);

    // Armazena as opções de skills disponíveis para seleção
    const skillOptions = ref([]);

    // Armazena as skills atualmente ativas no jogador
    const currentSkills = ref([]);

    // Fila de atualização das skills
    const upgradeQueueCount = ref(0);
    const isUpgrading = ref(false);

    // Salas concluídas desde que o jogador pegou Aprendizado (o bônus de EXP cresce com elas)
    const experienceRooms = ref(0);

    function update(safeDelta) {
      // Lógica de atualização das skills, se necessário
      if (isUpgrading.value) {
          // console.log('Atualização de skill em progresso...', upgradeQueueCount.value);
          return;
      }

      if (upgradeQueueCount.value <= 0) {
        // console.log('Nenhuma atualização de skill pendente.');
        return;
      }

      useAudio().playSound('levelup');
      useAudio().startBackgroundMusicAbafado();

      // console.log('Iniciando atualização de skill...', upgradeQueueCount.value);

      // Processa uma skill da fila
      upgradeQueueCount.value -= 1;
      skillOptions.value = skillSelectRandom();
      isModalOpen.value = true;
      isUpgrading.value = true;

      // console.log('Modal de seleção de skill aberto.');

      useCurrentRunStore().gameState = 'paused';

      // startSkillSelection();
    }

    function cleanup() {
        // Lógica de limpeza das skills, se necessário
        isModalOpen.value = false; // Fecha o modal de seleção de skills
        skillOptions.value = []; // Reseta as opções de skills
        isUpgrading.value = false; // Reseta o estado de atualização
        upgradeQueueCount.value = 0; // Reseta a fila de upgrades
        currentSkills.value = []; // Reseta as skills atuais
        experienceRooms.value = 0;
    }

    function onRoomCleared() {
        if (hasSkill('exp_growth')) experienceRooms.value += 1;
    }

    // Cartas repetíveis nunca esgotam (a de reparo só aparece com vida faltando); as demais somem no nível máximo
    function isOfferable(skill) {
        if (skill.repeatable) {
            const run = useCurrentRunStore();
            return skill.id !== 'emergency_repair' || run.currentHealth < run.maxHealth;
        }
        const currentSkill = currentSkills.value.find(s => s.id === skill.id);
        return !currentSkill || currentSkill.currentLevel < Object.keys(skill.levels).length;
    }

    /**
     * Seleciona skills aleatórias para o jogador escolher.
     * Se tiver quantity maior que o número de skills disponíveis, só retorna o máximo possível.
     *
     * @TODO REIMPLEMENTAR SEM GPT PORRA
     * @param {number} qty - Quantidade de skills a selecionar.
     * @param {boolean} sameRarity - Se true, todas as skills terão a mesma raridade.
     * @param {string|null} rarity - Raridade específica para selecionar (opcional).
     * @returns {Array} - Array de skills selecionadas.
     */
    function skillSelectRandom(qty = 3, sameRarity = true, rarity = null) {
        const allSkills = Object.values(SkillsList).filter(skill => !skill.disabled);
        let selectedSkills = [];
        let rarities = [
          'common',
          'uncommon',
          'rare',
          'epic',
          'legendary'
        ];

        let rarityChances = {
          // common: 0.5, // 50%
          uncommon: 0.5, // 50%
          rare: 0.25, // 25%
          epic: 0.17, // 17%
          legendary: 0.08, // 8%
        }

        if (rarity) {
          if (Array.isArray(rarity)) {
            rarities = rarity;
          } else {
            rarities = [rarity];
          }
        }

        let rarityPool = rarities;

        if (sameRarity) {
            // Weighted random selection baseado em rarityChances
            const random = Math.random();
            let cumulative = 0;
            let selectedRarity = rarities[0];

            for (const r of rarities) {
                cumulative += rarityChances[r] || 0;
                if (random <= cumulative) {
                    selectedRarity = r;
                    break;
                }
            }

            rarityPool = [selectedRarity];
        }

        let availableSkills = allSkills.filter(skill => rarityPool.includes(skill.rarity)
            && !skillOptions.value.some(s => s.id === skill.id)
            && isOfferable(skill));

        console.log('Skills disponíveis para seleção:', availableSkills);

        let newQty = qty;

        if (availableSkills.length < newQty) {
            newQty = availableSkills.length;
        }

        // check if all skills from rarityPool are maxed out
        if (availableSkills.length === 0) {
            console.log('Todas as skills da raridade selecionada estão no nível máximo ou não há skills disponíveis.', rarityPool);
            // A raridade sorteada pode não ter nenhuma opção elegível. Procura
            // diretamente nas demais raridades para não criar uma recursão infinita.
            rarityPool = ['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
            availableSkills = allSkills.filter(skill => !skillOptions.value.some(s => s.id === skill.id) && isOfferable(skill));
            newQty = Math.min(qty, availableSkills.length);

            if (newQty === 0) {
                console.log('Nenhuma skill disponível para seleção.');
                return [];
            }
        }

        while (selectedSkills.length < newQty) {
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];

            // check if exists in selectedSkills already
            if (selectedSkills.some(s => s.id === randomSkill.id)) {
                continue;
            }

            if (rarityPool.includes(randomSkill.rarity) && !selectedSkills.includes(randomSkill)) {
                // add current level property to skill
                const skillCopy = { ...randomSkill };

                // get current level
                let currentlevel = 0;
                const existingSkill = currentSkills.value.find(s => s.id === skillCopy.id);
                if (existingSkill) {
                    currentlevel = existingSkill.currentLevel;
                }
                skillCopy.currentLevel = currentlevel;

                // add re-roll quantity
                skillCopy.reRolls = useCurrentRunStore().skillRerollCount;
                console.log('Habilidade sorteada com re-rolls:', skillCopy);

                selectedSkills.push(skillCopy);
            }
        }

        return selectedSkills;
    }

    function startSkillSelection() {
      upgradeQueueCount.value += 1;
    }

    function refreshSkill(skill) {
        if (!isModalOpen.value || skill.reRolls <= 0) return;

        // Index é a posição da skill a ser atualizada
        const index = skillOptions.value.findIndex(s => s.id === skill.id);

        // Se a skill for encontrada, sorteia uma nova skill para substituir
        if (index !== -1) {
            
            const newSkill = skillSelectRandom(1, true, skill.rarity);

            if (! newSkill || newSkill.length === 0) {
                console.log('Não foi possível sortear uma nova skill para refresh.');
                skill.reRolls -= 1;
                skillOptions.value.splice(index, 1, skill);
                return;
            }

            newSkill[0].reRolls = skill.reRolls - 1;

            console.log('Skill atualizada:', newSkill[0]);

            skillOptions.value.splice(index, 1, newSkill[0]);
        }
    }

    function selectSkill(skill) {
      // Pré adição do nível da skill
      const maxHealthBefore = useCurrentRunStore().maxHealth; // Necessário pra calcular a cura pós o upgrade
      
      // Cartas repetíveis têm efeito imediato: não sobem de nível nem entram nas habilidades obtidas
      if (!skill.repeatable) {
        // Incrementa o nível da skill
        skill.currentLevel += 1;

        // Se já existe a skill, apenas atualiza o nível
        const existingSkillIndex = currentSkills.value.findIndex(s => s.id === skill.id);

        if (existingSkillIndex !== -1) {
            currentSkills.value[existingSkillIndex].currentLevel += 1;
        } else {
            // Adiciona a nova skill ao array de skills atuais
            currentSkills.value.push(skill);
        }
      }

      // Fecha o modal de seleção de skills
      isModalOpen.value = false;
      isUpgrading.value = false;

      // Após a adição do nível da skill
      switch (skill.id) {
        case 'health_percentage':
          useCurrentRunStore().refreshMaxHealthFromStats();
          usePlayerStats().healthAfterSkillUpgrade(maxHealthBefore);
          break;
        // Cura por tempo removida das cartas
        // case 'health_regeneration':
        //   const regenAmount = skill.levels[skill.currentLevel].value;
        //   usePlayerStats().setRegenRate(regenAmount * 100);
        //   console.log(`Regeneração definida em ${regenAmount * 100}% por segundo.`);
        //   break;
        case 'emergency_repair':
          useCurrentRunStore().healPlayer(emergencyRepairHeal(useCurrentRunStore().maxHealth, skill.levels[1]));
          break;
        case 'general_speed':
          console.log('Aplicando aumento de velocidade geral da skill.');
          const speedIncrease = skill.levels[skill.currentLevel].value;
          useCurrentRunStore().setMoveSpeed(usePlayerStats().moveSpeed);
          console.log(`Multiplicador de velocidade da nave definido em ${speedIncrease}.`);
          break;
        case 'flat_gold':
          const goldAmount = skill.levels[skill.currentLevel].value;
          console.log(`Concedido ${goldAmount} de ouro ao jogador pela skill Flat Gold.`);
          useCurrentRunStore().addGold(goldAmount);
          break;
      }

      // Limpa as opções de skills
      skillOptions.value = [];

      // Retoma o jogo
      useAudio().stopBackgroundMusicAbafado();
    }

    // Finish Implementing Rerolls
    function playerCanReroll(skill) {
        const rerollCount = useCurrentRunStore().skillRerollCount.value;

        return skill.reRolls > 0;
    }

    function hasSkill(skillId) {
        return currentSkills.value.some(skill => skill.id === skillId && skill.currentLevel > 0);
    }

    function getSkillLevel(skillId) {
        const skill = currentSkills.value.find(skill => skill.id === skillId);
        return skill ? skill.currentLevel : 0;
    }

    return {
        update,
        cleanup,

        // Sorteia skill aleatoria
        startSkillSelection,
        skillOptions,

        // Modal
        isModalOpen,
        refreshSkill,
        selectSkill,
        
        // Queue
        upgradeQueueCount,
        isUpgrading,
        

        // Player skills
        currentSkills,
        hasSkill,
        getSkillLevel,
        isOfferable,

        // Aprendizado
        experienceRooms,
        onRoomCleared,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useSkillStore, import.meta.hot));
}
