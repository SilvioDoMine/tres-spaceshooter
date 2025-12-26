// Carrega configurações do localStorage ou cria padrão
const loadAccountLevelSettings = () => {
    const saved = localStorage.getItem('accountLevelSettings');

    const defaultSettings = {
        levelAccount: 1,
        currentExp: 0,
        expToNextLevel: 100,
    };

    if (!saved) {
        localStorage.setItem('accountLevelSettings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('Failed to parse account level settings from localStorage:', error);
        // Se der erro no parse, retorna padrão
        return defaultSettings;
    }
};

const levelSettings = ref(loadAccountLevelSettings());

export function useLevelAccount() {
    const getLevelAccount = () => { levelSettings.value.levelAccount; console.log('Nível da conta:', levelSettings.value.levelAccount); return levelSettings.value.levelAccount; };
    const getCurrentExp = () => levelSettings.value.currentExp;
    const getExpToNextLevel = () => levelSettings.value.expToNextLevel;

    const saveLevelAccountSettings = () => {
        localStorage.setItem('accountLevelSettings', JSON.stringify(levelSettings.value));
    };

    const addExp = (amount) => {
        levelSettings.value.currentExp += amount;

        // Verifica se subiu de nível
        const nextLevel = levelSettings.value.levelAccount + 1;
        const nextLevelConfig = levelAccountConfiguration[nextLevel];

        if (nextLevelConfig && levelSettings.value.currentExp >= nextLevelConfig.expRequired) {
            // Subiu de nível
            levelSettings.value.levelAccount = nextLevel;
            levelSettings.value.expToNextLevel = nextLevelConfig.expRequired;

            // Opcional: Notificar o jogador que subiu de nível
            console.log(`Parabéns! Você subiu para o nível ${nextLevel}!`);
        }

        saveLevelAccountSettings();
    };

    const calculateExpReward = () => {
        // O level tem a quantidade de exp distribuído, e contém todos os stages.
        // stageFinishedIndex é o índice do stage que foi finalizado (0-based)
        // Vamos dar exp baseado no stage finalizado, se ele chegou no final ganha tudo, se parou no meio ganha proporcionalmente.
        // Exemplo: level 3 tem 300 de exp total, se parou no stage 1 (de 3), ganha 100 de exp.
        // Se ele ganhou, recebe 100% da exp, se perdeu vai ganhar somente metade.
        const level = useCurrentRunStore().levelConfig;
        const stageFinishedIndex = useCurrentRunStore().currentStageIndex - 1;

        const totalStages = level.stages.length;
        let baseExp = level.rewardExperience || 0;

        if (stageFinishedIndex < 0 || stageFinishedIndex >= totalStages) {
            return 0; // índice inválido
        }

        if (stageFinishedIndex === totalStages - 1) {
            return baseExp; // completou o nível, ganha tudo
        } else {
            // não completou, ganha metade da exp total
            baseExp = Math.floor(baseExp / 2);
        }

        const stageRatio = (stageFinishedIndex + 1) / totalStages;
        const expEarned = Math.floor(baseExp * stageRatio);
        return expEarned;
    }

    const getCurrentPercentageToNextLevel = () => {
        // Remember that 0 is equivalent to the current level's required exp
        // and 100 is equivalent to the next level's required exp
        const currentLevel = levelSettings.value.levelAccount;
        const nextLevel = currentLevel + 1;
        const currentExp = levelSettings.value.currentExp;

        const currentLevelExpRequired = levelAccountConfiguration[currentLevel]?.expRequired || 0;
        const nextLevelExpRequired = levelAccountConfiguration[nextLevel]?.expRequired || currentLevelExpRequired;

        const expRange = nextLevelExpRequired - currentLevelExpRequired;
        const expIntoLevel = currentExp - currentLevelExpRequired;

        if (expRange <= 0) {
            return 100; // Já está no nível máximo ou não há próximo nível
        }

        return Math.min(100, Math.max(0, (expIntoLevel / expRange) * 100));
    };

    const resetAccountLevelAndExp = () => {
        levelSettings.value = {
            levelAccount: 1,
            currentExp: 0,
            expToNextLevel: 100,
        };
        saveLevelAccountSettings();
    };

    window.resetAccountLevelAndExp = resetAccountLevelAndExp;

    return {
        getLevelAccount,
        getCurrentExp,
        getExpToNextLevel,
        getCurrentPercentageToNextLevel,
        calculateExpReward,
        addExp,
    };
}

// Account Level Table
export const levelAccountConfiguration = {
    1: {
        expRequired: 0,
    },
    2: {
        expRequired: 100,
    },
    3: {
        expRequired: 220,
    },
    4: {
        expRequired: 360,
    },
    5: {
        expRequired: 520,
    },
    6: {
        expRequired: 700,
    },
    7: {
        expRequired: 900,
    },
    8: {
        expRequired: 1120,
    },
    9: {
        expRequired: 1360,
    },
    10: {
        expRequired: 1620,
    },
    11: {
        expRequired: 1900,
    },
    12: {
        expRequired: 2200,
    },
    13: {
        expRequired: 2520,
    },
    14: {
        expRequired: 2860,
    },
    15: {
        expRequired: 3220,
    },
    16: {
        expRequired: 3600,
    },
    17: {
        expRequired: 4000,
    },
    18: {
        expRequired: 4420,
    },
    19: {
        expRequired: 4860,
    },
    20: {
        expRequired: 5320,
    },
}
