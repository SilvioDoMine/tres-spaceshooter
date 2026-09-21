// Sorteio de equipamento como recompensa: a peça ainda não existe quando a recompensa é mostrada,
// então o que aparece na tela é a promessa — "Arma Aleatória", "Propulsores Aleatórios"... O item de
// verdade só nasce no resgate (useEquipmentStore.grantDrops, que sorteia dentro do slot pedido).
//
// Serve para os marcos de capítulo, as missões diárias e o fim de partida: todos guardam a recompensa
// no mesmo formato `{ slot, rarity }` e usam o mesmo ícone com tooltip (BaseRandomEquipmentIcon).
import { EQUIPMENT_SLOTS, RARITY_ORDER, type EquipmentRarity, type EquipmentSlot } from './equipment';

/** 'any' sorteia entre todos os slots; os demais restringem o sorteio àquele slot */
export type RandomEquipmentSlot = EquipmentSlot | 'any';

/** Recompensa "um equipamento do slot X na raridade Y", antes do sorteio */
export interface RandomEquipmentDrop {
  slot: RandomEquipmentSlot;
  rarity: EquipmentRarity;
}

export interface RandomEquipmentDefinition {
  slot: RandomEquipmentSlot;
  name: string;
  description: string;
}

/**
 * Nome e descrição por slot. Cada slot tem gênero e número próprios ("a arma", "os propulsores"),
 * então nada aqui é montado por concatenação — tudo é escrito à mão.
 */
export const RANDOM_EQUIPMENT: Record<RandomEquipmentSlot, RandomEquipmentDefinition> = {
  any: {
    slot: 'any',
    name: 'Equipamento Aleatório',
    description: 'Uma peça sorteada entre todos os slots da nave. Vai direto para a mochila no resgate.',
  },
  weapon: {
    slot: 'weapon',
    name: 'Arma Aleatória',
    description: 'Uma arma sorteada do arsenal da frota. Vai direto para a mochila no resgate.',
  },
  wings: {
    slot: 'wings',
    name: 'Asas Aleatórias',
    description: 'Um par de asas sorteado entre os modelos da frota. Vai direto para a mochila no resgate.',
  },
  cockpit: {
    slot: 'cockpit',
    name: 'Cockpit Aleatório',
    description: 'Um cockpit sorteado entre os modelos da frota. Vai direto para a mochila no resgate.',
  },
  generator: {
    slot: 'generator',
    name: 'Gerador Aleatório',
    description: 'Um gerador sorteado entre os modelos da frota. Vai direto para a mochila no resgate.',
  },
  forcefield: {
    slot: 'forcefield',
    name: 'Campo de Força Aleatório',
    description: 'Um campo de força sorteado entre os modelos da frota. Vai direto para a mochila no resgate.',
  },
  thrusters: {
    slot: 'thrusters',
    name: 'Propulsores Aleatórios',
    description: 'Um conjunto de propulsores sorteado entre os modelos da frota. Vai direto para a mochila no resgate.',
  },
};

export const RANDOM_EQUIPMENT_SLOTS = Object.keys(RANDOM_EQUIPMENT) as RandomEquipmentSlot[];

export const getRandomEquipment = (slot: RandomEquipmentSlot) => RANDOM_EQUIPMENT[slot] ?? RANDOM_EQUIPMENT.any;

/** Linha de cima do tooltip: o slot ainda não está definido quando o sorteio é livre */
export const randomEquipmentSlotLabel = (slot: RandomEquipmentSlot) =>
  slot === 'any' ? 'Qualquer slot' : EQUIPMENT_SLOTS[slot].label;

/** Atalho para montar a recompensa nos catálogos (marcos, missões, fim de partida) */
export const randomEquipment = (rarity: EquipmentRarity, slot: RandomEquipmentSlot = 'any'): RandomEquipmentDrop =>
  ({ slot, rarity });

/**
 * Normaliza o que vem dos catálogos (alguns são JS puro, sem tipagem) para a UI e o sorteio nunca
 * receberem slot ou raridade desconhecidos. Devolve null quando não dá para aproveitar nada.
 */
export function sanitizeDrop(raw: unknown): RandomEquipmentDrop | null {
  const drop = raw as Partial<RandomEquipmentDrop> | undefined;
  const rarity = drop?.rarity;
  if (!rarity || !RARITY_ORDER.includes(rarity)) return null;
  const slot = drop?.slot && drop.slot in RANDOM_EQUIPMENT ? drop.slot : 'any';
  return { slot, rarity };
}

/**
 * Equipamento sorteado ao concluir um capítulo (fim de partida vitoriosa). Trocar 'any' por um slot
 * ('weapon', 'thrusters'...) prende o sorteio àquela categoria.
 */
export const MATCH_END_EQUIPMENT_DROP: RandomEquipmentDrop = randomEquipment('gray', 'any');
