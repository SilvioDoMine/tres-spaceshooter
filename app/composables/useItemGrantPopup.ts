import type { OwnedEquipment } from '~/utils/equipment';

// Itens recém-ganhos para o modal global "Item obtido!" (estado único, compartilhado entre páginas).
const grantedItems = ref<OwnedEquipment[]>([]);

export function useItemGrantPopup() {
  return {
    grantedItems,
    show: (items: OwnedEquipment[]) => {
      grantedItems.value = items;
    },
    close: () => {
      grantedItems.value = [];
    },
  };
}
