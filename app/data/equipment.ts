// Catálogo e balanceamento dos equipamentos (estilo Archero 2).
// As regras (stats, fusão, ordenação) ficam em ~/utils/equipment; aqui só dados e números ajustáveis.
import type { TalentStat } from './talents';

export type EquipmentRarity = 'gray' | 'green' | 'blue' | 'purple' | 'orange' | 'red';

export type EquipmentSlot = 'weapon' | 'wings' | 'cockpit' | 'generator' | 'forcefield' | 'thrusters';

/** Da pior para a melhor; a fusão sobe uma posição */
export const RARITY_ORDER: EquipmentRarity[] = ['gray', 'green', 'blue', 'purple', 'orange', 'red'];

/**
 * multiplier: multiplica o atributo base do slot.
 * fuseCount: peças iguais para fundir (a principal conta); null = raridade máxima.
 */
export const EQUIPMENT_RARITIES: Record<
  EquipmentRarity,
  { label: string; color: string; multiplier: number; fuseCount: number | null }
> = {
  gray: { label: 'Comum', color: '#b7bfcc', multiplier: 1, fuseCount: 3 },
  green: { label: 'Incomum', color: '#5ad66a', multiplier: 1.6, fuseCount: 3 },
  blue: { label: 'Raro', color: '#4aa8ff', multiplier: 2.6, fuseCount: 3 },
  purple: { label: 'Épico', color: '#c27bff', multiplier: 4.2, fuseCount: 2 },
  orange: { label: 'Lendário', color: '#ffb23e', multiplier: 6.8, fuseCount: 2 },
  red: { label: 'Mítico', color: '#ff5a5a', multiplier: 11, fuseCount: null },
};

/** Esquerda dá ATQ, direita dá HP (mesmo layout do Archero) */
export const SLOT_ORDER: EquipmentSlot[] = ['weapon', 'wings', 'cockpit', 'generator', 'forcefield', 'thrusters'];

export const EQUIPMENT_SLOTS: Record<
  EquipmentSlot,
  { label: string; side: 'left' | 'right'; mainStat: 'damageFlat' | 'maxHealthFlat'; base: number }
> = {
  weapon: { label: 'Arma', side: 'left', mainStat: 'damageFlat', base: 12 },
  wings: { label: 'Asas', side: 'left', mainStat: 'damageFlat', base: 6 },
  cockpit: { label: 'Cockpit', side: 'left', mainStat: 'damageFlat', base: 6 },
  generator: { label: 'Gerador', side: 'right', mainStat: 'maxHealthFlat', base: 40 },
  forcefield: { label: 'Campo de Força', side: 'right', mainStat: 'maxHealthFlat', base: 70 },
  thrusters: { label: 'Propulsores', side: 'right', mainStat: 'maxHealthFlat', base: 40 },
};

/**
 * Habilidade liberada quando o item chega na raridade `unlock`.
 * Com `stat`, soma nos atributos (como os talentos). Com `effectId`, é um efeito de gameplay
 * descrito em `text` (ainda não ligado no jogo).
 */
export interface EquipmentAbility {
  unlock: EquipmentRarity;
  stat?: TalentStat;
  value?: number;
  effectId?: string;
  text?: string;
}

export interface EquipmentDefinition {
  id: string;
  slot: EquipmentSlot;
  name: string;
  description: string;
  abilities: EquipmentAbility[];
}

export const EQUIPMENT_ITEMS: EquipmentDefinition[] = [
  // -- Armas ------------------------------------------------------------------
  {
    id: 'canhao-plasma',
    slot: 'weapon',
    name: 'Canhão de Plasma',
    description: 'Canhão padrão da frota. Condensa plasma instável em disparos rápidos.',
    abilities: [
      { unlock: 'green', stat: 'critRatePercent', value: 3 },
      { unlock: 'blue', stat: 'attackSpeedPercent', value: 5 },
      { unlock: 'purple', effectId: 'plasma-burst', text: 'A cada 5 disparos, o próximo causa 150% de dano em área.' },
      { unlock: 'orange', stat: 'damagePercent', value: 10 },
      { unlock: 'red', effectId: 'plasma-burst-plus', text: 'Rajada de plasma a cada 3 disparos, com 200% de dano.' },
    ],
  },
  {
    id: 'lanca-ionica',
    slot: 'weapon',
    name: 'Lança Iônica',
    description: 'Feixe concentrado de íons que perfura blindagens leves.',
    abilities: [
      { unlock: 'green', stat: 'critDamagePercent', value: 12 },
      { unlock: 'blue', stat: 'critRatePercent', value: 4 },
      { unlock: 'purple', effectId: 'ion-pierce', text: 'Os tiros atravessam 1 inimigo extra.' },
      { unlock: 'orange', stat: 'damagePercent', value: 10 },
      { unlock: 'red', effectId: 'ion-pierce-plus', text: 'Os tiros atravessam 2 inimigos extras e ricocheteiam.' },
    ],
  },
  // -- Asas -------------------------------------------------------------------
  {
    id: 'asas-falcao',
    slot: 'wings',
    name: 'Asas Falcão',
    description: 'Estabilizadores aerodinâmicos para manobras de caça.',
    abilities: [
      { unlock: 'green', stat: 'moveSpeedPercent', value: 5 },
      { unlock: 'blue', stat: 'dodgePercent', value: 4 },
      { unlock: 'purple', effectId: 'falcon-dash', text: 'Ao desviar de um ataque, ganha +20% VEL ATQ por 3s.' },
      { unlock: 'orange', stat: 'damagePercent', value: 8 },
      { unlock: 'red', effectId: 'falcon-dash-plus', text: 'Ao desviar, ganha +40% VEL ATQ por 4s.' },
    ],
  },
  {
    id: 'asas-nebula',
    slot: 'wings',
    name: 'Asas Nébula',
    description: 'Painéis tecidos com poeira estelar que emitem um brilho violeta.',
    abilities: [
      { unlock: 'green', stat: 'critDamagePercent', value: 10 },
      { unlock: 'blue', stat: 'attackSpeedPercent', value: 4 },
      { unlock: 'purple', effectId: 'nebula-orbs', text: 'Duas esferas de nébula orbitam a nave causando dano por contato.' },
      { unlock: 'orange', stat: 'damagePercent', value: 8 },
      { unlock: 'red', effectId: 'nebula-orbs-plus', text: 'Quatro esferas orbitam a nave, com dano dobrado.' },
    ],
  },
  // -- Cockpit ----------------------------------------------------------------
  {
    id: 'cockpit-mira',
    slot: 'cockpit',
    name: 'Cockpit Mira Tática',
    description: 'Painel de mira com rastreamento térmico de alvos.',
    abilities: [
      { unlock: 'green', stat: 'critRatePercent', value: 3 },
      { unlock: 'blue', stat: 'critDamagePercent', value: 15 },
      { unlock: 'purple', effectId: 'lock-on', text: 'Inimigos marcados recebem +15% de dano crítico.' },
      { unlock: 'orange', stat: 'damagePercent', value: 8 },
      { unlock: 'red', effectId: 'lock-on-plus', text: 'Marca até 3 inimigos, que recebem +30% de dano crítico.' },
    ],
  },
  {
    id: 'cockpit-quantico',
    slot: 'cockpit',
    name: 'Cockpit Quântico',
    description: 'Computador de bordo que calcula trajetórias em múltiplas realidades.',
    abilities: [
      { unlock: 'green', stat: 'attackSpeedPercent', value: 4 },
      { unlock: 'blue', stat: 'critRatePercent', value: 3 },
      { unlock: 'purple', effectId: 'quantum-echo', text: '10% de chance de disparar um tiro-eco extra.' },
      { unlock: 'orange', stat: 'damagePercent', value: 8 },
      { unlock: 'red', effectId: 'quantum-echo-plus', text: '20% de chance de tiro-eco, que também pode critar.' },
    ],
  },
  // -- Geradores --------------------------------------------------------------
  {
    id: 'gerador-fusao',
    slot: 'generator',
    name: 'Gerador de Fusão',
    description: 'Reator compacto que mantém os sistemas vitais sempre carregados.',
    abilities: [
      { unlock: 'green', stat: 'heartHealPercent', value: 20 },
      { unlock: 'blue', stat: 'maxHealthPercent', value: 5 },
      { unlock: 'purple', effectId: 'fusion-regen', text: 'Regenera 1% do HP máx. por segundo fora de combate.' },
      { unlock: 'orange', stat: 'maxHealthPercent', value: 10 },
      { unlock: 'red', effectId: 'fusion-regen-plus', text: 'Regenera 2% do HP máx. por segundo, mesmo em combate.' },
    ],
  },
  {
    id: 'gerador-solar',
    slot: 'generator',
    name: 'Núcleo Solar',
    description: 'Fragmento de estrela contido em um casco de liga pesada.',
    abilities: [
      { unlock: 'green', stat: 'levelUpHealPercent', value: 10 },
      { unlock: 'blue', stat: 'collisionReductionPercent', value: 6 },
      { unlock: 'purple', effectId: 'solar-flare', text: 'Ao perder 30% do HP, emite uma explosão solar que empurra inimigos.' },
      { unlock: 'orange', stat: 'maxHealthPercent', value: 10 },
      { unlock: 'red', effectId: 'solar-flare-plus', text: 'A explosão solar também atordoa inimigos por 1,5s.' },
    ],
  },
  // -- Campos de força --------------------------------------------------------
  {
    id: 'campo-egide',
    slot: 'forcefield',
    name: 'Campo Égide',
    description: 'Escudo hexagonal que dispersa impactos cinéticos.',
    abilities: [
      { unlock: 'green', stat: 'collisionReductionPercent', value: 5 },
      { unlock: 'blue', stat: 'dodgePercent', value: 3 },
      { unlock: 'purple', effectId: 'aegis-shield', text: 'Bloqueia 1 golpe a cada 8 segundos.' },
      { unlock: 'orange', stat: 'maxHealthPercent', value: 10 },
      { unlock: 'red', effectId: 'aegis-shield-plus', text: 'Bloqueia 1 golpe a cada 5 segundos.' },
    ],
  },
  {
    id: 'campo-prisma',
    slot: 'forcefield',
    name: 'Campo Prisma',
    description: 'Barreira cristalina que refrata a energia dos projéteis inimigos.',
    abilities: [
      { unlock: 'green', stat: 'heartHealPercent', value: 15 },
      { unlock: 'blue', stat: 'collisionReductionPercent', value: 8 },
      { unlock: 'purple', effectId: 'prism-reflect', text: 'Reflete 20% do dano de projéteis recebidos.' },
      { unlock: 'orange', stat: 'maxHealthPercent', value: 10 },
      { unlock: 'red', effectId: 'prism-reflect-plus', text: 'Reflete 40% do dano de projéteis recebidos.' },
    ],
  },
  // -- Propulsores ------------------------------------------------------------
  {
    id: 'propulsor-cometa',
    slot: 'thrusters',
    name: 'Propulsor Cometa',
    description: 'Motor de ignição rápida que deixa um rastro incandescente.',
    abilities: [
      { unlock: 'green', stat: 'moveSpeedPercent', value: 6 },
      { unlock: 'blue', stat: 'dodgePercent', value: 4 },
      { unlock: 'purple', effectId: 'comet-trail', text: 'Deixa um rastro que causa dano aos inimigos que o atravessam.' },
      { unlock: 'orange', stat: 'maxHealthPercent', value: 10 },
      { unlock: 'red', effectId: 'comet-trail-plus', text: 'O rastro fica mais largo e causa o dobro de dano.' },
    ],
  },
  {
    id: 'propulsor-vortice',
    slot: 'thrusters',
    name: 'Propulsor Vórtice',
    description: 'Turbinas gêmeas que distorcem o espaço ao redor da nave.',
    abilities: [
      { unlock: 'green', stat: 'dodgePercent', value: 3 },
      { unlock: 'blue', stat: 'moveSpeedPercent', value: 8 },
      { unlock: 'purple', effectId: 'vortex-slow', text: 'Inimigos próximos ficam 20% mais lentos.' },
      { unlock: 'orange', stat: 'maxHealthPercent', value: 10 },
      { unlock: 'red', effectId: 'vortex-slow-plus', text: 'Inimigos próximos ficam 35% mais lentos e recebem +10% de dano.' },
    ],
  },
];

/** Recompensas de equipamento dos marcos das missões diárias (pontos -> raridade) */
export const MILESTONE_EQUIPMENT: Record<number, EquipmentRarity> = {
  40: 'gray',
  60: 'green',
  80: 'gray',
  100: 'blue',
};
