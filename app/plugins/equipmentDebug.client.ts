import { EQUIPMENT_ITEMS, RARITY_ORDER, type EquipmentRarity } from '~/data/equipment';
import { useItemGrantPopup } from '~/composables/useItemGrantPopup';
import { useEquipmentStore } from '~/stores/useEquipmentStore';

// Comandos de debug no console para testar o inventário:
//   giveItem()                        -> 1 item aleatório, raridade aleatória
//   giveItem('purple')                -> item aleatório épico
//   giveItem('purple', 3)             -> 3 itens aleatórios épicos
//   giveItem('canhao-plasma', 'gray', 3) -> 3 Canhões de Plasma comuns (bom para testar fusão)
//   resetEquipment()                  -> volta ao kit inicial
// Os argumentos podem vir em qualquer ordem.

/** Peso de cada raridade quando ela não é informada */
const RANDOM_RARITY_WEIGHTS: Record<EquipmentRarity, number> = {
  gray: 40,
  green: 25,
  blue: 17,
  purple: 10,
  orange: 6,
  red: 2,
};

function randomRarity(): EquipmentRarity {
  let roll = Math.random() * RARITY_ORDER.reduce((sum, rarity) => sum + RANDOM_RARITY_WEIGHTS[rarity], 0);
  for (const rarity of RARITY_ORDER) {
    roll -= RANDOM_RARITY_WEIGHTS[rarity];
    if (roll < 0) return rarity;
  }
  return 'gray';
}

const isRarity = (value: unknown): value is EquipmentRarity => RARITY_ORDER.includes(value as EquipmentRarity);
const isItemId = (value: unknown) => EQUIPMENT_ITEMS.some(item => item.id === value);

export default defineNuxtPlugin(() => {
  // A store é criada só na hora do comando (não pesa no carregamento)
  function giveItem(...args: unknown[]) {
    let rarity: EquipmentRarity | null = null;
    let defId: string | null = null;
    let count = 1;

    for (const arg of args) {
      if (typeof arg === 'number') count = Math.max(1, Math.min(50, Math.floor(arg)));
      else if (isRarity(arg)) rarity = arg;
      else if (isItemId(arg)) defId = arg as string;
      else {
        console.warn(
          `[giveItem] Argumento inválido: ${JSON.stringify(arg)}\n` +
            `Raridades: ${RARITY_ORDER.join(', ')}\nItens: ${EQUIPMENT_ITEMS.map(item => item.id).join(', ')}`,
        );
        return [];
      }
    }

    const store = useEquipmentStore();
    const items = Array.from({ length: count }, () => {
      const itemRarity = rarity ?? randomRarity();
      return defId ? store.grant(defId, itemRarity)! : store.grantRandom(itemRarity);
    });

    useItemGrantPopup().show(items);
    return items;
  }

  Object.assign(window, {
    giveItem,
    // Mantidos por compatibilidade: grantEquipment(defId | null, raridade, quantidade), sem modal
    grantEquipment: (defId: string | null, rarity: EquipmentRarity = 'gray', count = 1) => {
      const store = useEquipmentStore();
      return Array.from({ length: count }, () => (defId ? store.grant(defId, rarity) : store.grantRandom(rarity)));
    },
    resetEquipment: () => useEquipmentStore().resetEquipment(),
  });

  if (import.meta.dev) {
    console.info(
      "[debug] giveItem() • giveItem('purple', 3) • giveItem('canhao-plasma', 'gray', 3) • resetEquipment()",
    );
  }
});
