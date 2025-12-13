import { ref } from 'vue';

// Sistema de eventos para combat text
const combatTextEvents = ref([]);

export function useCombatTextEvents() {
  // Emite um evento de combat text
  const emitCombatText = (targetId, value, type, position) => {
    const event = {
      id: Date.now() + Math.random(),
      targetId,
      value,
      type, // 'damage' ou 'heal'
      position,
      timestamp: Date.now(),
    };

    combatTextEvents.value.push(event);

    // Remove o evento após 100ms (tempo suficiente para ser capturado)
    setTimeout(() => {
      combatTextEvents.value = combatTextEvents.value.filter(e => e.id !== event.id);
    }, 100);
  };

  // Pega eventos para um target específico e os remove
  const consumeEventsForTarget = (targetId) => {
    const events = combatTextEvents.value.filter(e => e.targetId === targetId);
    combatTextEvents.value = combatTextEvents.value.filter(e => e.targetId !== targetId);
    return events;
  };

  return {
    emitCombatText,
    consumeEventsForTarget,
    combatTextEvents,
  };
}
