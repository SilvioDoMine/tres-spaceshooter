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
import { combatAttributes } from './shipAttributes';

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

export interface EquipmentEffects {
  weaponStyle: 'plasma' | 'ion'; plasmaEvery: number; plasmaMultiplier: number; plasmaRadius: number;
  ionExtraHits: number; ionBounces: number;
  dodgeAttackSpeedPercent: number; dodgeAttackSpeedDuration: number;
  nebulaOrbCount: number; nebulaOrbDamageMultiplier: number;
  lockOnCount: number; lockOnCriticalBonus: number;
  quantumEchoChance: number; quantumEchoCanCrit: boolean;
  fusionRegenPercent: number; fusionRegenInCombat: boolean;
  solarFlareStun: number;
  aegisCooldown: number;
  prismReflectPercent: number;
  cometTrailWidth: number; cometTrailDamageMultiplier: number;
  vortexRadius: number; vortexSlowPercent: number; vortexDamagePercent: number;
}

export const emptyEquipmentEffects = (): EquipmentEffects => ({
  weaponStyle: 'plasma', plasmaEvery: 0, plasmaMultiplier: 1, plasmaRadius: 2.6,
  ionExtraHits: 0, ionBounces: 0,
  dodgeAttackSpeedPercent: 0, dodgeAttackSpeedDuration: 0,
  nebulaOrbCount: 0, nebulaOrbDamageMultiplier: 0,
  lockOnCount: 0, lockOnCriticalBonus: 0,
  quantumEchoChance: 0, quantumEchoCanCrit: false,
  fusionRegenPercent: 0, fusionRegenInCombat: false,
  solarFlareStun: 0,
  aegisCooldown: 0,
  prismReflectPercent: 0,
  cometTrailWidth: 0, cometTrailDamageMultiplier: 0,
  vortexRadius: 6, vortexSlowPercent: 0, vortexDamagePercent: 0,
});

/** Converte os effectIds equipados em parâmetros gerais. A versão mítica substitui a épica. */
export function aggregateGearEffects(items: OwnedEquipment[]): EquipmentEffects {
  const effects = emptyEquipmentEffects();
  effects.weaponStyle = items.some(item => item.defId === 'lanca-ionica') ? 'ion' : 'plasma';
  const active = new Set<string>();
  for (const item of items) for (const { ability, unlocked } of itemAbilities(item.defId, item.rarity)) {
    if (unlocked && ability.effectId) active.add(ability.effectId);
  }
  if (active.has('plasma-burst-plus')) Object.assign(effects, { plasmaEvery: 3, plasmaMultiplier: 2 });
  else if (active.has('plasma-burst')) Object.assign(effects, { plasmaEvery: 5, plasmaMultiplier: 1.5 });
  if (active.has('ion-pierce-plus')) Object.assign(effects, { ionExtraHits: 2, ionBounces: 1 });
  else if (active.has('ion-pierce')) effects.ionExtraHits = 1;
  if (active.has('falcon-dash-plus')) Object.assign(effects, { dodgeAttackSpeedPercent: 40, dodgeAttackSpeedDuration: 4 });
  else if (active.has('falcon-dash')) Object.assign(effects, { dodgeAttackSpeedPercent: 20, dodgeAttackSpeedDuration: 3 });
  if (active.has('nebula-orbs-plus')) Object.assign(effects, { nebulaOrbCount: 4, nebulaOrbDamageMultiplier: .5 });
  else if (active.has('nebula-orbs')) Object.assign(effects, { nebulaOrbCount: 2, nebulaOrbDamageMultiplier: .25 });
  if (active.has('lock-on-plus')) Object.assign(effects, { lockOnCount: 3, lockOnCriticalBonus: .3 });
  else if (active.has('lock-on')) Object.assign(effects, { lockOnCount: 1, lockOnCriticalBonus: .15 });
  if (active.has('quantum-echo-plus')) Object.assign(effects, { quantumEchoChance: .2, quantumEchoCanCrit: true });
  else if (active.has('quantum-echo')) effects.quantumEchoChance = .1;
  if (active.has('fusion-regen-plus')) Object.assign(effects, { fusionRegenPercent: 2, fusionRegenInCombat: true });
  else if (active.has('fusion-regen')) effects.fusionRegenPercent = 1;
  if (active.has('solar-flare-plus')) effects.solarFlareStun = 1.5;
  else if (active.has('solar-flare')) effects.solarFlareStun = -1;
  if (active.has('aegis-shield-plus')) effects.aegisCooldown = 5;
  else if (active.has('aegis-shield')) effects.aegisCooldown = 8;
  if (active.has('prism-reflect-plus')) effects.prismReflectPercent = 40;
  else if (active.has('prism-reflect')) effects.prismReflectPercent = 20;
  if (active.has('comet-trail-plus')) Object.assign(effects, { cometTrailWidth: 1.5, cometTrailDamageMultiplier: .5 });
  else if (active.has('comet-trail')) Object.assign(effects, { cometTrailWidth: .9, cometTrailDamageMultiplier: .25 });
  if (active.has('vortex-slow-plus')) Object.assign(effects, { vortexSlowPercent: 35, vortexDamagePercent: 10 });
  else if (active.has('vortex-slow')) effects.vortexSlowPercent = 20;
  return effects;
}

/**
 * Atributos finais do jogador somando base, talentos e equipamentos.
 * O fixo dos equipamentos é ampliado por "Atributos base dos equipamentos" (talento).
 * Compartilhado pelo lobby e pelo snapshot inicial da partida.
 */
export function computePlayerStats(base: TalentBaseStats, talents: TalentBonuses, gear: TalentBonuses, effects = emptyEquipmentEffects()) {
  const gearMultiplier = 1 + talents.gearBaseStatsPercent / 100;
  const bonuses = emptyTalentBonuses();
  for (const stat of Object.keys(bonuses) as TalentStat[]) {
    const gearValue = TALENT_STATS[stat].kind === 'flat' ? gear[stat] * gearMultiplier : gear[stat];
    bonuses[stat] = talents[stat] + gearValue;
  }

  const applied = applyTalentBonuses(base, bonuses);
  return {
    ...combatAttributes(bonuses),
    effects,
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

export const STARTER_ITEM_ID = 'canhao-plasma';

/** Kit inicial: só o Canhão de Plasma comum, já equipado */
export function starterInventory(): EquipmentInventory {
  return {
    nextUid: 2,
    items: [{ uid: 1, defId: STARTER_ITEM_ID, rarity: 'gray' }],
    equipped: { ...emptyEquippedSlots(), weapon: 1 },
  };
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
