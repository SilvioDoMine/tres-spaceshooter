// Carrega configurações do localStorage ou cria padrão
const loadMissionsData = () => {
    const saved = localStorage.getItem('missionsData');

    const defaultSettings = {};

    if (!saved) {
        localStorage.setItem('missionsData', JSON.stringify(defaultSettings));
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

const missionSettings = ref(loadMissionsData());

export function useMissions() {
    // Missões resetam diariamente às 20PM Horário de Brasília (UTC-3)
    const resetHourUTC = 23; // 20PM BRT é 23PM UTC

    const saveMissionsData = () => {
        localStorage.setItem('missionsData', JSON.stringify(missionSettings.value));
    };

    // Retorna o próximo horário de reset (sem reatividade)
    const getNextResetTime = () => {
        const now = new Date();
        const nextReset = new Date(now);
        nextReset.setUTCHours(resetHourUTC, 0, 0, 0);

        if (now >= nextReset) {
            // Se já passou do horário de reset hoje, agenda para amanhã
            nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        }

        return nextReset;
    };

    return {
        getNextResetTime,
        saveMissionsData,
    };
}
