// Regras puras da Loja: reset diário, Loja Diária, sorteio dos baús com garantido, pacotes e saneamento.
// Sem Vue/Pinia para dar para testar fora do Nuxt (por isso o import relativo).
import { EQUIPMENT_ITEMS, RARITY_ORDER, type EquipmentRarity } from '../data/equipment';
import {
  CHEST_ORDER,
  CHESTS,
  DAILY_SHOP_SLOTS,
  GEM_PACKS,
  GOLD_PACKS,
  SHOP_RESET,
  type ChestDefinition,
  type ChestType,
  type DailySlotConfig,
  type GemPack,
  type GoldPack,
  type ShopPrice,
} from '../data/shop';
import { rarityIndex, rollEquipment } from './equipment';
import { mulberry32 } from './talents';

const DAY_MS = 24 * 60 * 60 * 1000;
/** 04:00 em GMT-3 = 07:00 UTC */
const RESET_OFFSET_MS = (SHOP_RESET.hour - SHOP_RESET.utcOffsetHours) * 60 * 60 * 1000;

// -- Reset diário -------------------------------------------------------------------

/** Número do "dia da loja" (muda às 04:00 GMT-3) */
export const resetDayKey = (now: number) => Math.floor((now - RESET_OFFSET_MS) / DAY_MS);

/** Timestamp do próximo reset */
export const nextResetAt = (now: number) => (resetDayKey(now) + 1) * DAY_MS + RESET_OFFSET_MS;

/** "08:24:33" (ou "2d 04h" quando passa de um dia) */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}h`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// -- Loja Diária ----------------------------------------------------------------------

export interface DailyOffer {
  defId: string;
  rarity: EquipmentRarity;
  price: ShopPrice;
  stock: number;
  bought: number;
}

export interface DailyShop {
  dayKey: number;
  offers: DailyOffer[];
}

/** Mistura a semente do jogador com o dia (mesmo dia -> mesma loja, mesmo recarregando) */
const dailyRng = (seed: number, dayKey: number) => mulberry32((seed ^ Math.imul(dayKey + 1, 0x9e3779b1)) >>> 0);

/** Sorteia os itens do dia, sem repetir item enquanto houver itens diferentes */
export function rollDailyShop(seed: number, dayKey: number, slots: DailySlotConfig[] = DAILY_SHOP_SLOTS): DailyShop {
  const rng = dailyRng(seed, dayKey);
  const pool = EQUIPMENT_ITEMS.map(item => item.id);
  // Fisher-Yates
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(rng() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap]!, pool[index]!];
  }
  return {
    dayKey,
    offers: slots.map((slot, index) => ({
      defId: pool[index % pool.length]!,
      rarity: slot.rarity,
      price: { ...slot.price },
      stock: slot.stock,
      bought: 0,
    })),
  };
}

export const offerRemaining = (offer: DailyOffer) => Math.max(0, offer.stock - offer.bought);

// -- Baús -------------------------------------------------------------------------------

export interface ChestProgress {
  /** Aberturas seguidas sem a raridade garantida */
  pity: number;
  /** Quando o último grátis foi resgatado (null = nunca, já disponível) */
  freeClaimedAt: number | null;
}

/** Quantas aberturas faltam para o garantido (a última conta: "garantido em 1" = a próxima) */
export const pityRemaining = (chest: ChestDefinition, pity: number) => Math.max(1, chest.pity.every - pity);

function weightedRarity(chest: ChestDefinition, rng: () => number): EquipmentRarity {
  const total = chest.drops.reduce((sum, drop) => sum + drop.weight, 0);
  let roll = rng() * total;
  for (const drop of chest.drops) {
    roll -= drop.weight;
    if (roll < 0) return drop.rarity;
  }
  return chest.drops[chest.drops.length - 1]!.rarity;
}

/** Sorteia a raridade de uma abertura aplicando o garantido; o contador zera quando a raridade sai */
export function rollChestRarity(chest: ChestDefinition, pity: number, rng: () => number) {
  const forced = pity + 1 >= chest.pity.every;
  const rarity = forced ? chest.pity.rarity : weightedRarity(chest, rng);
  const hit = rarityIndex(rarity) >= rarityIndex(chest.pity.rarity);
  return { rarity, pity: hit ? 0 : pity + 1, forced };
}

/** Abre `count` baús em sequência */
export function openChestBatch(chest: ChestDefinition, count: number, pity: number, rng: () => number) {
  const drops: { defId: string; rarity: EquipmentRarity; forced: boolean }[] = [];
  let current = pity;
  for (let index = 0; index < count; index++) {
    const roll = rollChestRarity(chest, current, rng);
    current = roll.pity;
    drops.push({ ...rollEquipment(rng, roll.rarity), forced: roll.forced });
  }
  return { drops, pity: current };
}

/** Chances para o modal (i): por raridade e por item, em % */
export function chestDropTable(chest: ChestDefinition) {
  const total = chest.drops.reduce((sum, drop) => sum + drop.weight, 0);
  return [...chest.drops]
    .sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity))
    .map(drop => {
      const percent = (drop.weight / total) * 100;
      return {
        rarity: drop.rarity,
        percent,
        itemPercent: percent / EQUIPMENT_ITEMS.length,
        items: EQUIPMENT_ITEMS.map(item => item.id),
      };
    });
}

export const batchSize = (keys: number, max = 10) => Math.max(0, Math.min(Math.floor(keys), max));

export const freeReadyAt = (chest: ChestDefinition, progress: ChestProgress) =>
  progress.freeClaimedAt === null ? 0 : progress.freeClaimedAt + chest.freeCooldownMs;

export const isFreeReady = (chest: ChestDefinition, progress: ChestProgress, now: number) =>
  now >= freeReadyAt(chest, progress);

export type ChestOpenMode = 'free' | 'keys' | 'gems';
export type ChestButtonState = ChestOpenMode | 'insufficient';

/** Qual botão mostrar: grátis > chaves > gemas > sem saldo */
export function chestButtonState(input: { freeReady: boolean; keys: number; gems: number; gemCost: number }): ChestButtonState {
  if (input.freeReady) return 'free';
  if (input.keys > 0) return 'keys';
  if (input.gems >= input.gemCost) return 'gems';
  return 'insufficient';
}

// -- Pacotes ------------------------------------------------------------------------------

export const gemBonusApplies = (pack: GemPack, purchasedIds: string[], promo: boolean) =>
  pack.bonus > 0 && (promo || !purchasedIds.includes(pack.id));

export const gemPackCredit = (pack: GemPack, purchasedIds: string[], promo: boolean) =>
  pack.gems + (gemBonusApplies(pack, purchasedIds, promo) ? pack.bonus : 0);

export const goldPackRemaining = (pack: GoldPack, bought: number) =>
  pack.stock === null ? Infinity : Math.max(0, pack.stock - bought);

// -- Estado salvo ----------------------------------------------------------------------------

export interface PixCharge {
  id: string;
  packId: string;
  amountBRL: number;
  copyPaste: string;
  createdAt: number;
  expiresAt: number;
}

export interface ShopState {
  seed: number;
  daily: DailyShop;
  gold: { dayKey: number; bought: Record<string, number> };
  keys: Record<ChestType, number>;
  chests: Record<ChestType, ChestProgress>;
  gemPacksPurchased: string[];
  pendingPix: PixCharge | null;
}

export function freshShopState(seed: number, now: number): ShopState {
  const dayKey = resetDayKey(now);
  return {
    seed: seed >>> 0,
    daily: rollDailyShop(seed >>> 0, dayKey),
    gold: { dayKey, bought: {} },
    keys: { silver: 0, obsidian: 0 },
    chests: { silver: { pity: 0, freeClaimedAt: null }, obsidian: { pity: 0, freeClaimedAt: null } },
    gemPacksPurchased: [],
    pendingPix: null,
  };
}

/** Virou o dia: nova Loja Diária e estoque do ouro zerado. Devolve o mesmo objeto se nada mudou. */
export function refreshShopState(state: ShopState, now: number): ShopState {
  const dayKey = resetDayKey(now);
  if (state.daily.dayKey === dayKey && state.gold.dayKey === dayKey) return state;
  return {
    ...state,
    daily: state.daily.dayKey === dayKey ? state.daily : rollDailyShop(state.seed, dayKey),
    gold: state.gold.dayKey === dayKey ? state.gold : { dayKey, bought: {} },
  };
}

const nonNegativeInt = (value: unknown) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const validPrice = (raw: any): ShopPrice | null =>
  (raw?.currency === 'gems' || raw?.currency === 'gold') && nonNegativeInt(raw.amount) > 0
    ? { currency: raw.currency, amount: nonNegativeInt(raw.amount) }
    : null;

/** Limpa o que veio do localStorage; valores inválidos voltam para o padrão */
export function sanitizeShopState(raw: unknown, now: number): ShopState | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as any;
  if (!Number.isInteger(data.seed)) return null;

  const base = freshShopState(data.seed, now);
  const knownItems = new Set(EQUIPMENT_ITEMS.map(item => item.id));

  const offers: DailyOffer[] = Array.isArray(data.daily?.offers)
    ? data.daily.offers
        .map((offer: any) => {
          const price = validPrice(offer?.price);
          if (!knownItems.has(offer?.defId) || !RARITY_ORDER.includes(offer?.rarity) || !price) return null;
          const stock = nonNegativeInt(offer.stock);
          return { defId: offer.defId, rarity: offer.rarity, price, stock, bought: Math.min(nonNegativeInt(offer.bought), stock) };
        })
        .filter(Boolean)
    : [];
  const daily = Number.isInteger(data.daily?.dayKey) && offers.length ? { dayKey: data.daily.dayKey, offers } : base.daily;

  const bought: Record<string, number> = {};
  for (const pack of GOLD_PACKS) {
    const count = nonNegativeInt(data.gold?.bought?.[pack.id]);
    if (count) bought[pack.id] = count;
  }
  const gold = Number.isInteger(data.gold?.dayKey) ? { dayKey: data.gold.dayKey, bought } : base.gold;

  const keys = { ...base.keys };
  const chests = { ...base.chests };
  for (const type of CHEST_ORDER) {
    keys[type] = nonNegativeInt(data.keys?.[type]);
    const claimed = Number(data.chests?.[type]?.freeClaimedAt);
    chests[type] = {
      pity: Math.min(nonNegativeInt(data.chests?.[type]?.pity), CHESTS[type].pity.every - 1),
      freeClaimedAt: Number.isFinite(claimed) && claimed > 0 && claimed <= now ? claimed : null,
    };
  }

  const packIds = new Set(GEM_PACKS.map(pack => pack.id));
  const gemPacksPurchased = Array.isArray(data.gemPacksPurchased)
    ? [...new Set<string>(data.gemPacksPurchased.filter((id: unknown) => packIds.has(id as string)))]
    : [];

  // Cobrança pendente: pacote de gemas conhecido ou oferta ("offer:<id>", validada pela tela de ofertas)
  const pix = data.pendingPix;
  const knownProduct = (id: unknown) => typeof id === 'string' && (packIds.has(id) || /^offer:[\w-]+$/.test(id));
  const pendingPix: PixCharge | null =
    pix && typeof pix.id === 'string' && knownProduct(pix.packId) && Number.isFinite(pix.expiresAt)
      ? {
          id: pix.id,
          packId: pix.packId,
          amountBRL: Number(pix.amountBRL) || 0,
          copyPaste: String(pix.copyPaste ?? ''),
          createdAt: Number(pix.createdAt) || now,
          expiresAt: pix.expiresAt,
        }
      : null;

  return refreshShopState({ seed: data.seed >>> 0, daily, gold, keys, chests, gemPacksPurchased, pendingPix }, now);
}

/** "R$ 6,90" */
export const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

/** "20K", "200K", "1.2M" */
export function formatShort(amount: number) {
  if (amount >= 1_000_000) return `${Number((amount / 1_000_000).toFixed(1))}M`;
  if (amount >= 1_000) return `${Number((amount / 1_000).toFixed(1))}K`;
  return String(amount);
}
