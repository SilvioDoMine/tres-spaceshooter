import type { ChestOpenMode } from '~/utils/shop';
import type { ChestType } from '~/data/shop';
import type { OwnedEquipment } from '~/utils/equipment';

// Sessão global da abertura de baús: a Loja entrega o resultado e a tela de abertura (app.vue) mostra.
export interface ChestOpeningSession {
  type: ChestType;
  mode: ChestOpenMode;
  items: OwnedEquipment[];
  /** Muda a cada abertura (inclusive "Sortear Mais"), para reiniciar a animação */
  id: number;
}

const session = ref<ChestOpeningSession | null>(null);

export function useChestOpening() {
  function start(result: { type: ChestType; mode: ChestOpenMode; items: OwnedEquipment[] }) {
    if (!result.items.length) return;
    session.value = { ...result, id: Date.now() };
  }

  function close() {
    session.value = null;
  }

  return { session, start, close };
}
