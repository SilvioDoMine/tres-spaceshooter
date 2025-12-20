export const useCombatTextStore = defineStore('CombatTextStore', () => {
    const duration = 1000; // Duração padrão dos textos de combate em milissegundos.
    const combatTextGarbageTimeout = 5000; // Tempo para limpar textos antigos, em ms.

    // Armazenar os textos de combate ativos para ser consumidodos pelos componentes.
    const combatTexts = ref([]);

    function emitForTarget(entityId, type, value) {
        const eventBody = {
            id: Date.now() + Math.random(),
            entityId: entityId,
            type: type,
            value: value,
            duration: duration,
            createdAt: Date.now(),
        };

        combatTexts.value.push(eventBody);

        // Se o texto não for consumido em X tempo, remova-o automaticamente.
        setTimeout(() => {
            combatTexts.value = combatTexts.value.filter(text => text.id !== eventBody.id);
        }, combatTextGarbageTimeout);
    }

    function consumeForTarget(entityId) {
        const textsForEntity = combatTexts.value.filter(text => text.entityId === entityId);

        // Remove os textos consumidos da lista principal.
        combatTexts.value = combatTexts.value.filter(text => text.entityId !== entityId);

        return textsForEntity;
    }

    function clearFromTarget(entityId) {
        combatTexts.value = combatTexts.value.filter(text => text.entityId !== entityId);
    }

    return {
        emitForTarget,
        consumeForTarget,
        clearFromTarget,
    };
});
