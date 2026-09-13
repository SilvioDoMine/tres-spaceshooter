// Configuração da Loja (estilo Archero 2): Loja Diária, Baús, Gemas e Ouro.
// As regras (sorteio, garantido, estoque, reset) ficam em ~/utils/shop; aqui só dados ajustáveis.
import type { EquipmentRarity } from './equipment';

export type ShopCurrency = 'gems' | 'gold';

export interface ShopPrice {
  currency: ShopCurrency;
  amount: number;
}

/** Hora do reset diário (Loja Diária e estoque do Ouro): 04:00 em GMT-3 */
export const SHOP_RESET = { hour: 4, utcOffsetHours: -3 };

// -- Loja Diária ----------------------------------------------------------------

/** Uma posição da Loja Diária: raridade sorteada, preço e quantas vezes dá para comprar */
export interface DailySlotConfig {
  rarity: EquipmentRarity;
  price: ShopPrice;
  stock: number;
}

export const DAILY_SHOP_SLOTS: DailySlotConfig[] = [
  { rarity: 'gray', price: { currency: 'gems', amount: 35 }, stock: 1 },
  { rarity: 'gray', price: { currency: 'gems', amount: 35 }, stock: 1 },
  { rarity: 'gray', price: { currency: 'gems', amount: 35 }, stock: 1 },
];

// -- Baús -----------------------------------------------------------------------

export type ChestType = 'silver' | 'obsidian';

export interface ChestTheme {
  /** Fundo do card e da tela de abertura */
  cardFrom: string;
  cardTo: string;
  openingFrom: string;
  openingTo: string;
  /** Cores do modelo 3D */
  body: string;
  trim: string;
  metal: string;
  gem: string;
  glow: string;
}

export interface ChestDefinition {
  type: ChestType;
  name: string;
  /** Peso por raridade (a chance dentro da raridade é igual entre os itens) */
  drops: { rarity: EquipmentRarity; weight: number }[];
  /** A cada `every` aberturas sem essa raridade, a próxima é garantida */
  pity: { rarity: EquipmentRarity; every: number };
  gemCost: number;
  freeCooldownMs: number;
  /** Máximo de baús abertos de uma vez com chaves */
  maxBatch: number;
  theme: ChestTheme;
}

const HOUR = 60 * 60 * 1000;

export const CHESTS: Record<ChestType, ChestDefinition> = {
  silver: {
    type: 'silver',
    name: 'Baú de Prata',
    drops: [
      { rarity: 'gray', weight: 66.67 },
      { rarity: 'green', weight: 33.33 },
    ],
    pity: { rarity: 'green', every: 10 },
    gemCost: 80,
    freeCooldownMs: 24 * HOUR,
    maxBatch: 10,
    theme: {
      cardFrom: '#5aa6ff',
      cardTo: '#2f63d6',
      openingFrom: '#3a47b8',
      openingTo: '#5670e6',
      body: '#e6eef8',
      trim: '#f07a3a',
      metal: '#b8c6da',
      gem: '#4fc3ff',
      glow: '#ffe9a8',
    },
  },
  obsidian: {
    type: 'obsidian',
    name: 'Baú de Obsidiana',
    drops: [
      { rarity: 'blue', weight: 96 },
      { rarity: 'purple', weight: 4 },
    ],
    pity: { rarity: 'purple', every: 10 },
    gemCost: 300,
    freeCooldownMs: 72 * HOUR,
    maxBatch: 10,
    theme: {
      cardFrom: '#b35cff',
      cardTo: '#6a2bd0',
      openingFrom: '#4a0e8f',
      openingTo: '#9a3ff0',
      body: '#5b3aa8',
      trim: '#c79bff',
      metal: '#ffc857',
      gem: '#ffb03b',
      glow: '#ffd6ff',
    },
  },
};

export const CHEST_ORDER: ChestType[] = ['silver', 'obsidian'];

/** Partidas terminadas (vitória ou derrota) necessárias para liberar os baús grátis */
export const CHEST_FREE_UNLOCK_MATCHES = 1;

// -- Gemas (dinheiro real) --------------------------------------------------------

export interface GemPack {
  id: string;
  name: string;
  gems: number;
  /** Gemas extras na 1ª compra do pacote (ou sempre, com a promoção ligada) */
  bonus: number;
  priceBRL: number;
  /** null = infinito */
  stock: number | null;
  art: 'few' | 'pile' | 'heap' | 'sack' | 'barrel' | 'chest';
}

export const GEM_PACKS: GemPack[] = [
  { id: 'gems-80', name: 'Algumas Gemas', gems: 80, bonus: 80, priceBRL: 6.9, stock: null, art: 'few' },
  { id: 'gems-500', name: 'Pilha de Gemas', gems: 500, bonus: 500, priceBRL: 29.9, stock: null, art: 'pile' },
  { id: 'gems-1200', name: 'Monte de Gemas', gems: 1200, bonus: 1200, priceBRL: 59.9, stock: null, art: 'heap' },
  { id: 'gems-2500', name: 'Saco de Gemas', gems: 2500, bonus: 2500, priceBRL: 129.9, stock: null, art: 'sack' },
  { id: 'gems-6500', name: 'Barril de Gemas', gems: 6500, bonus: 6500, priceBRL: 299.9, stock: null, art: 'barrel' },
  { id: 'gems-14000', name: 'Baú de Gemas', gems: 14000, bonus: 14000, priceBRL: 599.9, stock: null, art: 'chest' },
];

/** Promoção: com a flag ligada o bônus vale em toda compra */
export const GEM_PROMO_BONUS_ACTIVE = false;

/**
 * Promoção de gemas em andamento (acende o "!" da sub-aba Gemas até o jogador ver).
 * Troque o `id` a cada promoção nova para o aviso voltar. null = sem promoção.
 */
export interface GemPromo {
  id: string;
  /** ISO, ex.: '2026-09-20T07:00:00Z' */
  startsAt: string;
  endsAt?: string;
}

export const GEM_PROMO: GemPromo | null = null;

// -- Ouro (comprado com gemas) ------------------------------------------------------

export interface GoldPack {
  id: string;
  name: string;
  gold: number;
  /** null = grátis (futuramente por anúncio) */
  price: ShopPrice | null;
  /** Compras por dia (reseta com a Loja Diária); null = infinito */
  stock: number | null;
  art: 'handful' | 'pile' | 'chest';
}

export const GOLD_PACKS: GoldPack[] = [
  { id: 'gold-2000', name: 'Um Punhado de Ouro', gold: 2000, price: null, stock: 2, art: 'handful' },
  { id: 'gold-20000', name: 'Uma Pilha de Ouro', gold: 20000, price: { currency: 'gems', amount: 200 }, stock: null, art: 'pile' },
  { id: 'gold-200000', name: 'Um Baú de Ouro', gold: 200000, price: { currency: 'gems', amount: 2000 }, stock: null, art: 'chest' },
];
