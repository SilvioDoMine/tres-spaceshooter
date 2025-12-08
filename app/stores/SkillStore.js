export const SkillsList ={
  flat_gold: {
    id: 'flat_gold',
    name: 'Ouro Bônus',
    description: 'Concede uma quantidade fixa de ouro caso complete a fase.',
    icon: '💰',
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
    icon: '⚔️',
    rarity: 'common',
    levels: {
      1: { value: 0.4, description: '+40% de dano' }, // +40% dano
      2: { value: 0.6, description: '+60% de dano' }, // +60% dano
      3: { value: 0.8, description: '+80% de dano' }, // +80% dano
      4: { value: 1.2, description: '+120% de dano' }, // +120% dano
      5: { value: 2.0, description: '+200% de dano' }, // +200% dano
    }
  },
  health_percentage: {
    id: 'health_percentage',
    name: 'Vida Aumentada',
    description: 'Aumenta sua vida máxima permanentemente.',
    icon: '❤️',
    rarity: 'common',
    levels: {
      1: { value: 0.4, description: '+40% de vida máxima' }, // +40% vida - valor base pré estacada
      2: { value: 0.5, description: '+50% de vida máxima' }, // +50% vida - (valor base + 40%) + 50% = +90%
      3: { value: 0.6, description: '+60% de vida máxima' }, // +60% vida - (valor base + 90%) + 60% = +150%
      4: { value: 0.7, description: '+70% de vida máxima' }, // +70% vida - (valor base + 150%) + 70% = +220%
      5: { value: 0.8, description: '+80% de vida máxima' }, // +80% vida - (valor base + 220%) + 80% = +300%
    }
  },
  health_regeneration: {
    id: 'health_regeneration',
    name: 'Regeneração de Vida',
    description: 'Regenera uma porcentagem da sua vida máxima a cada segundo.',
    icon: '🩹',
    rarity: 'common',
    levels: {
      1: { value: 0.01, description: '+1% de regeneração por segundo' }, // Tempo para regenerar 100% da vida: 100 segundos
      2: { value: 0.02, description: '+2% de regeneração por segundo' }, // Tempo para regenerar 100% da vida: 50 segundos
      3: { value: 0.03, description: '+3% de regeneração por segundo' }, // Tempo para regenerar 100% da vida: ~33 segundos
      4: { value: 0.04, description: '+4% de regeneração por segundo' }, // Tempo para regenerar 100% da vida: 25 segundos
      5: { value: 0.05, description: '+5% de regeneração por segundo' }, // Tempo para regenerar 100% da vida: 20 segundos
    }
  },
  general_speed: {
    id: 'general_speed',
    name: 'Velocidade Aumentada',
    description: 'Aumenta sua velocidade de movimento e disparo.',
    icon: '👟',
    rarity: 'common',
    levels: {
      1: { value: 0.1, description: '+15% de velocidade' }, // +15% velocidade
      2: { value: 0.3, description: '+30% de velocidade' }, // +30% velocidade
      3: { value: 0.45, description: '+45% de velocidade' }, // +45% velocidade
      4: { value: 0.6, description: '+60% de velocidade' }, // +60% velocidade
      5: { value: 0.9, description: '+90% de velocidade' }, // +90% velocidade
    },
  },
  ricochet_shot: {
    id: 'ricochet_shot',
    name: 'Tiro Ricochete',
    description: 'Seus projéteis ricocheteiam nas paredes uma vez, com 70% da eficiência.',
    icon: '💥',
    rarity: 'rare',
    levels: {
      1: { value: 1, description: 'Projéteis ricocheteiam 1 vez.' },
      2: { value: 2, description: 'Projéteis ricocheteiam 2 vezes.'},
      3: { value: 3, description: 'Projéteis ricocheteiam 3 vezes.'},
      4: { value: 4, description: 'Projéteis ricocheteiam 4 vezes.'},
      5: { value: 5, description: 'Projéteis ricocheteiam 5 vezes.'},
    },
  },
  diagonal_shot: {
    id: 'diagonal_shot',
    name: 'Tiros Diagonais',
    description: 'Adiciona tiros diagonais adicionais com 50% da eficiência.',
    icon: '➗',
    rarity: 'rare',
    levels: {
      1: { value: 2, description: 'Dispara 2 projéteis diagonais.' },
      2: { value: 4, description: 'Dispara 4 projéteis diagonais.' },
    },
  },
  back_shot: {
    id: 'back_shot',
    name: 'Tiro Traseiro',
    description: 'Adiciona um tiro para trás com 90% da eficiência.',
    icon: '🔙',
    rarity: 'rare',
    levels: {
      1: { value: 1, description: 'Dispara 1 projétil para trás.' },
    },
  },
  piercing_shot: {
    id: 'piercing_shot',
    name: 'Tiro Perfurante',
    description: 'Seus projéteis perfuram inimigos, atingindo múltiplos alvos.',
    icon: '🎯',
    rarity: 'rare',
    levels: {
      1: { value: 1, description: 'Projéteis perfuram 1 inimigo.' },
      2: { value: 2, description: 'Projéteis perfuram 3 inimigos.' },
      3: { value: 3, description: 'Projéteis perfuram 9 inimigos.' },
      4: { value: 999, description: 'Projéteis perfuram todos os inimigos.' },
    },
  },
  range_extension: {
    id: 'range_extension',
    name: 'Alcance Estendido',
    description: 'Aumenta o alcance dos seus projéteis.',
    icon: '📏',
    rarity: 'epic',
    levels: {
      1: { value: 0.5, description: '+50% de alcance' },
      2: { value: 1.0, description: '+100% de alcance' },
      3: { value: 1.5, description: '+150% de alcance' },
      4: { value: 2.0, description: '+200% de alcance' },
      5: { value: 3.0, description: '+300% de alcance' },
    },
  },
  multishot: {
    id: 'multishot',
    name: 'Tiros Múltiplos',
    description: 'Dispara um projeto adicional com 60% da eficiência.',
    icon: '🔫',
    rarity: 'epic',
    levels: {
      1: { value: 2, description: 'Dispara 2 projéteis.' },
      2: { value: 3, description: 'Dispara 3 projéteis.' },
    },
  },
  short_range_shot: {
    id: 'short_range_shot',
    name: 'Tiro de Curta Distância',
    description: 'Reduz seu alcance para corpo a corpo, mas aumenta muito o dano e a velocidade do projétil.',
    icon: '📌',
    rarity: 'legendary',
    levels: {
      1: { value: 1, description: 'ATK Range ↓↓, ATK Power ↑↑↑, ATK SPD ↑↑↑' },
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
        const allSkills = Object.values(SkillsList);
        let selectedSkills = [];
        let rarities = ['common', 'rare', 'epic', 'legendary'];

        if (rarity) {
          if (Array.isArray(rarity)) {
            rarities = rarity;
          } else {
            rarities = [rarity];
          }
        }

        let rarityPool = rarities;

        if (sameRarity) {
            const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
            rarityPool = [randomRarity];
        }

        let availableSkills = allSkills.filter((skill) => {
            // check current skill levels to avoid maxed out skills
            const currentSkill = currentSkills.value.find(s => s.id === skill.id);

            let isMaxedOut = false;

            if (currentSkill) {
                console.log('Current Skill Level for', skill.id, ':', currentSkill.currentLevel, 'Max Level:', Object.keys(skill.levels).length);
                isMaxedOut = currentSkill.currentLevel >= Object.keys(skill.levels).length;
            }

            console.log(
              'rarityPool:', rarityPool,
              'skill.rarity:', skill.rarity,
              'Rarity Includes', rarityPool.includes(skill.rarity),
              'Already Selected', skillOptions.value.some(s => s.id === skill.id),
              'Is Maxed Out', isMaxedOut
            );

            return rarityPool.includes(skill.rarity)
                && !skillOptions.value.some(s => s.id === skill.id)
                && !isMaxedOut;
        });

        console.log('Skills disponíveis para seleção:', availableSkills);

        let newQty = qty;

        if (availableSkills.length < newQty) {
            newQty = availableSkills.length;
        }

        // check if all skills from rarityPool are maxed out
        if (availableSkills.length === 0) {
            console.log('Todas as skills da raridade selecionada estão no nível máximo ou não há skills disponíveis.', rarityPool);
            // call itself with removing current rarityPool rarity
            const newRarityPool = rarities.filter(r => !rarityPool.includes(r));
            if (newRarityPool.length === 0) {
                console.log('Nenhuma skill disponível para seleção.');

                // Retorna todas as skills de rarity poor como fallback
                // Aqui tem uma chance de dar loop infinito se não tiver skills poor disponíveis
                return skillSelectRandom(qty, true, ['poor']);
            }

            console.log('Tentando nova raridade:', qty, newRarityPool);
            return skillSelectRandom(qty, true, newRarityPool);
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
        skill.currentLevel += 1;

        // Se já existe a skill, apenas atualiza o nível
        const existingSkillIndex = currentSkills.value.findIndex(s => s.id === skill.id);

        if (existingSkillIndex !== -1) {
            currentSkills.value[existingSkillIndex].currentLevel += 1;
        } else {
            // Adiciona a nova skill ao array de skills atuais
            currentSkills.value.push(skill);   
        }

        // Fecha o modal de seleção de skills
        isModalOpen.value = false;
        isUpgrading.value = false;

        // Limpa as opções de skills
        skillOptions.value = [];
    }

    // Finish Implementing Rerolls
    function playerCanReroll(skill) {
        const rerollCount = useCurrentRunStore().skillRerollCount.value;

        return skill.reRolls > 0;
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
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useSkillStore, import.meta.hot));
}
