// Regras puras dos equipamentos: atributos, fusão, ordenação e saneamento do inventário.
// Sem Vue/Pinia para dar para testar fora do Nuxt (por isso o import relativo).
import {
  EQUIPMENT_ITEMS,
  EQUIPMENT_RARITIES,
  EQUIPMENT_SLOTS,
  RARITY_ORDER,
  SLOT_ORDER,
  type EquipmentAbility,
  type EquipmentDefinition,
  type EquipmentRarity,
  type EquipmentSlot,
} from '../data/equipment';
import { TALENT_STATS, type TalentStat } from '../data/talents';
import { applyTalentBonuses, emptyTalentBonuses, type TalentBaseStats, type TalentBonuses } from './talents';

export interface OwnedEquipment {
  uid: number;
  defId: string;
  rarity: EquipmentRarity;
}

export type EquippedSlots = Record<EquipmentSlot, number | null>;

export interface EquipmentInventory {
  nextUid: number;
  items: OwnedEquipment[];
  equipped: EquippedSlots;
}

const itemsById = new Map(EQUIPMENT_ITEMS.map(item => [item.id, item]));

export const getEquipment = (defId: string) => itemsById.get(defId);

/** Definição de um item do inventário (o saneamento garante que existe) */
export const definitionOf = (item: OwnedEquipment) => itemsById.get(item.defId) as EquipmentDefinition;

export const rarityIndex = (rarity: EquipmentRarity) => RARITY_ORDER.indexOf(rarity);

export function nextRarity(rarity: EquipmentRarity): EquipmentRarity | null {
  return RARITY_ORDER[rarityIndex(rarity) + 1] ?? null;
}

export const emptyEquippedSlots = (): EquippedSlots =>
  Object.fromEntries(SLOT_ORDER.map(slot => [slot, null])) as EquippedSlots;

// -- Atributos ----------------------------------------------------------------

/** Atributo principal: base do slot × multiplicador da raridade */
export function itemMainStat(defId: string, rarity: EquipmentRarity) {
  const slot = EQUIPMENT_SLOTS[getEquipment(defId)!.slot];
  return { stat: slot.mainStat, value: Math.round(slot.base * EQUIPMENT_RARITIES[rarity].multiplier) };
}

/** Habilidades do item, marcando as já liberadas pela raridade */
export function itemAbilities(defId: string, rarity: EquipmentRarity): { ability: EquipmentAbility; unlocked: boolean }[] {
  const current = rarityIndex(rarity);
  return getEquipment(defId)!.abilities.map(ability => ({ ability, unlocked: rarityIndex(ability.unlock) <= current }));
}

/** Soma dos atributos dos itens (principal + habilidades liberadas), no mesmo formato dos talentos */
export function aggregateGearBonuses(items: OwnedEquipment[]): TalentBonuses {
  const bonuses = emptyTalentBonuses();
  for (const item of items) {
    const main = itemMainStat(item.defId, item.rarity);
    bonuses[main.stat] += main.value;
    for (const { ability, unlocked } of itemAbilities(item.defId, item.rarity)) {
      if (unlocked && ability.stat) bonuses[ability.stat] += ability.value ?? 0;
    }
  }
  return bonuses;
}

export type PlayerStats = ReturnType<typeof computePlayerStats>;

/**
 * Atributos finais do jogador somando base, talentos e equipamentos.
 * O fixo dos equipamentos é ampliado por "Atributos base dos equipamentos" (talento).
 * Pronto para o jogo usar (ainda não ligado).
 */
export function computePlayerStats(base: TalentBaseStats, talents: TalentBonuses, gear: TalentBonuses) {
  const gearMultiplier = 1 + talents.gearBaseStatsPercent / 100;
  const bonuses = emptyTalentBonuses();
  for (const stat of Object.keys(bonuses) as TalentStat[]) {
    const gearValue = TALENT_STATS[stat].kind === 'flat' ? gear[stat] * gearMultiplier : gear[stat];
    bonuses[stat] = talents[stat] + gearValue;
  }

  const applied = applyTalentBonuses(base, bonuses);
  return {
    damage: Math.round(applied.damage),
    maxHealth: Math.round(applied.maxHealth),
    baseDamage: base.projectiles.damage,
    baseHealth: base.maxHealth,
    gearDamage: Math.round(gear.damageFlat * gearMultiplier),
    gearHealth: Math.round(gear.maxHealthFlat * gearMultiplier),
    talentDamage: talents.damageFlat,
    talentHealth: talents.maxHealthFlat,
    moveSpeed: applied.moveSpeed,
    shotCooldown: applied.shotCooldown,
    bonuses,
  };
}

// -- Fusão ----------------------------------------------------------------------

export const isEquipped = (inventory: EquipmentInventory, uid: number) =>
  Object.values(inventory.equipped).includes(uid);

/** Peças necessárias para fundir (a principal conta); null = não funde */
export const fuseRequirement = (rarity: EquipmentRarity) => EQUIPMENT_RARITIES[rarity].fuseCount;

/** Material válido: mesmo item, mesma raridade, não equipado e diferente da principal */
export function isValidMaterial(inventory: EquipmentInventory, main: OwnedEquipment, candidate: OwnedEquipment) {
  return (
    candidate.uid !== main.uid &&
    candidate.defId === main.defId &&
    candidate.rarity === main.rarity &&
    !isEquipped(inventory, candidate.uid)
  );
}

export function canFuse(inventory: EquipmentInventory, mainUid: number, materialUids: number[]) {
  const main = inventory.items.find(item => item.uid === mainUid);
  if (!main) return false;
  const required = fuseRequirement(main.rarity);
  if (required === null || materialUids.length !== required - 1) return false;
  if (new Set(materialUids).size !== materialUids.length) return false;
  return materialUids.every(uid => {
    const material = inventory.items.find(item => item.uid === uid);
    return !!material && isValidMaterial(inventory, main, material);
  });
}

/** Funde: a principal sobe uma raridade (continua equipada se estava) e os materiais somem */
export function fuse(inventory: EquipmentInventory, mainUid: number, materialUids: number[]): EquipmentInventory | null {
  if (!canFuse(inventory, mainUid, materialUids)) return null;
  const consumed = new Set(materialUids);
  return {
    ...inventory,
    items: inventory.items
      .filter(item => !consumed.has(item.uid))
      .map(item => (item.uid === mainUid ? { ...item, rarity: nextRarity(item.rarity)! } : item)),
  };
}

/** uids de todos os itens que fazem parte de um grupo fundível agora */
export function fusableUids(inventory: EquipmentInventory) {
  const groups = new Map<string, OwnedEquipment[]>();
  for (const item of inventory.items) {
    const key = `${item.defId}|${item.rarity}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const result = new Set<number>();
  for (const group of groups.values()) {
    const required = fuseRequirement(group[0]!.rarity);
    if (required === null) continue;
    const free = group.filter(item => !isEquipped(inventory, item.uid)).length;
    // Uma peça equipada pode ser a principal, mas nunca material
    const hasEquipped = free < group.length;
    if (hasEquipped ? free >= required - 1 : free >= required) group.forEach(item => result.add(item.uid));
  }
  return result;
}

// -- Ordenação e filtro ---------------------------------------------------------

const slotIndex = (item: OwnedEquipment) => SLOT_ORDER.indexOf(definitionOf(item).slot);
const byRarityDesc = (a: OwnedEquipment, b: OwnedEquipment) => rarityIndex(b.rarity) - rarityIndex(a.rarity);
const bySlot = (a: OwnedEquipment, b: OwnedEquipment) => slotIndex(a) - slotIndex(b);
const byIdentity = (a: OwnedEquipment, b: OwnedEquipment) => a.defId.localeCompare(b.defId) || a.uid - b.uid;

export type EquipmentSort = 'quality' | 'type';

export function sortEquipment(items: OwnedEquipment[], sort: EquipmentSort) {
  const compare =
    sort === 'quality'
      ? (a: OwnedEquipment, b: OwnedEquipment) => byRarityDesc(a, b) || bySlot(a, b) || byIdentity(a, b)
      : (a: OwnedEquipment, b: OwnedEquipment) => bySlot(a, b) || byRarityDesc(a, b) || byIdentity(a, b);
  return [...items].sort(compare);
}

/** Armazém do Mecânico: filtra por slot e põe os fundíveis no topo */
export function mechanicStorage(inventory: EquipmentInventory, filter: EquipmentSlot | 'all') {
  const fusable = fusableUids(inventory);
  const visible = inventory.items.filter(item => filter === 'all' || definitionOf(item).slot === filter);
  return sortEquipment(visible, 'quality').sort((a, b) => Number(fusable.has(b.uid)) - Number(fusable.has(a.uid)));
}

/** Itens guardados mais fortes que o equipado no seu slot (slot vazio: qualquer item dele é melhoria) */
export function upgradeableUids(inventory: EquipmentInventory) {
  const result = new Set<number>();
  for (const item of inventory.items) {
    if (isEquipped(inventory, item.uid)) continue;
    const equipped = inventory.items.find(entry => entry.uid === inventory.equipped[definitionOf(item).slot]);
    const current = equipped ? itemMainStat(equipped.defId, equipped.rarity).value : 0;
    if (itemMainStat(item.defId, item.rarity).value > current) result.add(item.uid);
  }
  return result;
}

// -- Inventário -----------------------------------------------------------------

/** Kit inicial: um item comum de cada slot, com a arma já equipada */
export function starterInventory(): EquipmentInventory {
  const items = SLOT_ORDER.map((slot, index) => ({
    uid: index + 1,
    defId: EQUIPMENT_ITEMS.find(item => item.slot === slot)!.id,
    rarity: 'gray' as EquipmentRarity,
  }));
  return { nextUid: items.length + 1, items, equipped: { ...emptyEquippedSlots(), weapon: 1 } };
}

/** Sorteia qual item de uma raridade o jogador ganha */
export function rollEquipment(rng: () => number, rarity: EquipmentRarity) {
  const def = EQUIPMENT_ITEMS[Math.floor(rng() * EQUIPMENT_ITEMS.length)] ?? EQUIPMENT_ITEMS[0]!;
  return { defId: def.id, rarity };
}

/** Limpa o que veio do localStorage: itens conhecidos, uids únicos e equipados coerentes com o slot */
export function sanitizeInventory(raw: unknown): EquipmentInventory | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<EquipmentInventory>;
  if (!Array.isArray(data.items)) return null;

  const seen = new Set<number>();
  const items: OwnedEquipment[] = [];
  for (const entry of data.items) {
    const uid = Math.floor(Number(entry?.uid));
    if (!(uid > 0) || seen.has(uid) || !getEquipment(entry?.defId) || !RARITY_ORDER.includes(entry?.rarity)) continue;
    seen.add(uid);
    items.push({ uid, defId: entry.defId, rarity: entry.rarity });
  }

  const equipped = emptyEquippedSlots();
  for (const slot of SLOT_ORDER) {
    const uid = Number(data.equipped?.[slot]);
    const item = items.find(entry => entry.uid === uid);
    if (item && definitionOf(item).slot === slot) equipped[slot] = uid;
  }

  const maxUid = items.reduce((max, item) => Math.max(max, item.uid), 0);
  const nextUid = Math.max(maxUid + 1, Math.floor(Number(data.nextUid)) || 0);
  return { nextUid, items, equipped };
}

// -- Texto --------------------------------------------------------------------------

/** "1.250" */
export const formatStat = (value: number) => Math.round(value).toLocaleString('pt-BR');
