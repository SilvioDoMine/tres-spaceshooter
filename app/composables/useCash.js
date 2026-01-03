const loadCashSettings = () => {
    const saved = localStorage.getItem('cashData');

    const defaultSettings = {
        totalCash: 0,
    };

    if (!saved) {
        localStorage.setItem('cashData', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('Failed to parse cash settings from localStorage:', error);
        // Se der erro no parse, retorna padrão
        return defaultSettings;
    }
};

const cashSettings = ref(loadCashSettings());

export function useCash() {
    const getTotalCash = computed(() => cashSettings.value.totalCash);

    const addCash = (amount) => {
        cashSettings.value.totalCash += amount;
        saveCashSettings();
    };

    const spendCash = (amount) => {
        if (cashSettings.value.totalCash >= amount) {
            cashSettings.value.totalCash -= amount;
            saveCashSettings();
            return true;
        }
        return false; // Não há cash suficiente
    };

    const saveCashSettings = () => {
        localStorage.setItem('cashData', JSON.stringify(cashSettings.value));
    };

    return {
        getTotalCash,
        addCash,
        spendCash,
    };
}
