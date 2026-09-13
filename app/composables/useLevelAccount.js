import { calculateChapterReward, playableRoomCount } from '~/utils/progression';

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

        let nextLevel = levelSettings.value.levelAccount + 1;
        let nextLevelConfig = levelAccountConfiguration[nextLevel];

        while (nextLevelConfig && levelSettings.value.currentExp >= nextLevelConfig.expRequired) {
            levelSettings.value.levelAccount = nextLevel;
            console.log(`Parabéns! Você subiu para o nível ${nextLevel}!`);
            nextLevel += 1;
            nextLevelConfig = levelAccountConfiguration[nextLevel];
        }

        levelSettings.value.expToNextLevel = nextLevelConfig?.expRequired
            ?? levelAccountConfiguration[levelSettings.value.levelAccount].expRequired;

        saveLevelAccountSettings();
    };

    const calculateExpReward = (levelOverride, roomsReachedOverride, completedOverride) => {
        const run = useCurrentRunStore();
        const level = levelOverride ?? run.levelConfig;
        const roomsReached = roomsReachedOverride ?? playableRoomCount(level, run.currentStageIndex);
        const completed = completedOverride ?? (run.isVictory || (
            run.isStageCompleted && roomsReached === playableRoomCount(level)
        ));

        return calculateChapterReward(level, roomsReached, completed);
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
        expRequired: 300, // effective is 200
    },
    4: {
        expRequired: 600, // effective is 300
    },
    5: {
        expRequired: 1000, // effective is 400
    },
    6: {
        expRequired: 1500, // effective is 500
    },
    7: {
        expRequired: 2100, // effective is 600
    },
    8: {
        expRequired: 2800, // effective is 700
    },
    9: {
        expRequired: 3360, // effective is 800
    },
    10: {
        expRequired: 3720, // effective is 900
    }
}

// Níveis 11+ gerados a partir do 10 (a mecânica de talentos libera 2 sorteios por nível e precisa de ~60)
export const MAX_ACCOUNT_LEVEL = 60;

for (let level = 11; level <= MAX_ACCOUNT_LEVEL; level++) {
    levelAccountConfiguration[level] = {
        expRequired: levelAccountConfiguration[level - 1].expRequired + 100 * (level - 1),
    };
}
