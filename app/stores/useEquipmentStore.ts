import { defineStore } from 'pinia';
import { EQUIPMENT_SLOTS, type EquipmentRarity, type EquipmentSlot } from '~/data/equipment';
import { PlayerBaseStats } from '~/stores/currentRunStore';
import { useTalentStore } from '~/stores/useTalentStore';
import {
  aggregateGearBonuses,
  computePlayerStats,
  definitionOf,
  fusableUids as findFusableUids,
  fuse as fuseItems,
  getEquipment,
  isEquipped,
  rollEquipment,
  sanitizeInventory,
  starterInventory,
  upgradeableUids as findUpgradeableUids,
  type EquipmentInventory,
  type OwnedEquipment,
  type PlayerStats,
} from '~/utils/equipment';

const STORAGE_KEY = 'equipmentInventory';
const STORAGE_VERSION = 1;

// Carrega o inventário salvo ou começa com o kit inicial
function loadInventory() {
  if (import.meta.server) return { inventory: starterInventory(), fresh: false };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const inventory = saved?.version === STORAGE_VERSION ? sanitizeInventory(saved) : null;
    if (inventory) return { inventory, fresh: false };
  } catch (error) {
    console.error('Failed to parse equipment inventory from localStorage:', error);
  }

  return { inventory: starterInventory(), fresh: true };
}

export interface StatChange {
  before: PlayerStats;
  after: PlayerStats;
}

/**
 * Equipamentos: inventário persistente, equipar/desequipar e fusão no Mecânico.
 * O jogo pode ler `stats` (atributos finais com base + talentos + equipamentos)
 * e `gearBonuses` (só os equipamentos, no mesmo formato dos talentos).
 */
export const useEquipmentStore = defineStore('equipment', () => {
  const talentStore = useTalentStore();

  const initial = loadInventory();
  const inventory = ref<EquipmentInventory>(initial.inventory);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...inventory.value }));
  }

  if (initial.fresh) save();

  const items = computed(() => inventory.value.items);
  const equipped = computed(() => inventory.value.equipped);

  const findItem = (uid: number | null) => inventory.value.items.find(item => item.uid === uid) ?? null;

  const equippedItem = (slot: EquipmentSlot) => findItem(inventory.value.equipped[slot]);
  const equippedItems = computed(() =>
    Object.values(inventory.value.equipped)
      .map(uid => findItem(uid))
      .filter((item): item is OwnedEquipment => !!item),
  );
  const unequippedItems = computed(() => inventory.value.items.filter(item => !isEquipped(inventory.value, item.uid)));

  const gearBonuses = computed(() => aggregateGearBonuses(equippedItems.value));
  const stats = computed(() => computePlayerStats(PlayerBaseStats, talentStore.bonuses, gearBonuses.value));

  const fusableUids = computed(() => findFusableUids(inventory.value));
  const hasFusable = computed(() => fusableUids.value.size > 0);
  /** Itens guardados que melhorariam o slot deles (seta verde no inventário) */
  const upgradeableUids = computed(() => findUpgradeableUids(inventory.value));

  /** Aplica uma mudança no inventário e devolve os atributos antes/depois (para a animação) */
  function commit(next: EquipmentInventory): StatChange {
    const before = stats.value;
    inventory.value = next;
    save();
    return { before, after: stats.value };
  }

  /** Equipa no slot do item (trocando o que estava lá) */
  function equip(uid: number) {
    const item = findItem(uid);
    if (!item) return null;
    const slot = definitionOf(item).slot;
    return commit({ ...inventory.value, equipped: { ...inventory.value.equipped, [slot]: uid } });
  }

  function unequip(slot: EquipmentSlot) {
    if (inventory.value.equipped[slot] === null) return null;
    return commit({ ...inventory.value, equipped: { ...inventory.value.equipped, [slot]: null } });
  }

  /** Funde a principal com os materiais; devolve o item resultante ou null se não puder */
  function fuse(mainUid: number, materialUids: number[]) {
    const next = fuseItems(inventory.value, mainUid, materialUids);
    if (!next) return null;
    const change = commit(next);
    return { item: findItem(mainUid)!, ...change };
  }

  function grant(defId: string, rarity: EquipmentRarity): OwnedEquipment | null {
    if (!getEquipment(defId)) return null;
    const item = { uid: inventory.value.nextUid, defId, rarity };
    commit({ ...inventory.value, nextUid: item.uid + 1, items: [...inventory.value.items, item] });
    return item;
  }

  function grantRandom(rarity: EquipmentRarity) {
    const rolled = rollEquipment(Math.random, rarity);
    return grant(rolled.defId, rolled.rarity)!;
  }

  function resetEquipment() {
    inventory.value = starterInventory();
    save();
  }

  // Comandos de debug no console (giveItem, grantEquipment, resetEquipment): ~/plugins/equipmentDebug.client.ts

  return {
    items,
    equipped,
    equippedItems,
    unequippedItems,
    gearBonuses,
    stats,
    fusableUids,
    hasFusable,
    upgradeableUids,
    findItem,
    equippedItem,
    slotOf: (item: OwnedEquipment) => EQUIPMENT_SLOTS[definitionOf(item).slot],
    equip,
    unequip,
    fuse,
    grant,
    grantRandom,
    resetEquipment,
  };
});
