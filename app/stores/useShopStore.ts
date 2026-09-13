import { defineStore } from 'pinia';
import { CHESTS, GEM_PACKS, GEM_PROMO_BONUS_ACTIVE, GOLD_PACKS, type ChestType } from '~/data/shop';
import { useCash } from '~/composables/useCash';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useEquipmentStore } from '~/stores/useEquipmentStore';
import { useStatisticsStore } from '~/stores/useStatisticsStore';
import type { OwnedEquipment } from '~/utils/equipment';
import {
  batchSize,
  chestButtonState,
  freeReadyAt as chestFreeReadyAt,
  freshShopState,
  gemBonusApplies,
  gemPackCredit,
  goldPackRemaining,
  isFreeUnlocked,
  nextResetAt,
  offerRemaining,
  openChestBatch,
  refreshShopState,
  sanitizeShopState,
  type ChestOpenMode,
  type PixCharge,
  type ShopState,
} from '~/utils/shop';

const STORAGE_KEY = 'shopState';
const STORAGE_VERSION = 1;

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

function loadState(now: number) {
  if (import.meta.server) return { state: freshShopState(0, now), fresh: false };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const state = saved?.version === STORAGE_VERSION ? sanitizeShopState(saved, now) : null;
    if (state) return { state, fresh: false };
  } catch (error) {
    console.error('Failed to parse shop state from localStorage:', error);
  }

  return { state: freshShopState(newSeed(), now), fresh: true };
}

/**
 * Loja: Loja Diária, baús (chaves, grátis, garantido), ouro e gemas.
 * Tudo que cobra ou entrega passa por aqui para o estoque e o saldo ficarem coerentes.
 */
export const useShopStore = defineStore('shop', () => {
  const cash = useCash();
  const runStore = useCurrentRunStore();
  const equipmentStore = useEquipmentStore();
  const statistics = useStatisticsStore();

  const initial = loadState(Date.now());
  const state = ref<ShopState>(initial.state);

  /** Relógio compartilhado (1s) para contagens regressivas e troca de dia */
  const now = ref(Date.now());
  if (import.meta.client) {
    setInterval(() => {
      now.value = Date.now();
      ensureFresh();
    }, 1000);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...state.value }));
  }

  function commit(next: ShopState) {
    state.value = next;
    save();
  }

  if (initial.fresh) save();

  /** Virou o dia (04:00 GMT-3): regenera a Loja Diária e o estoque do ouro */
  function ensureFresh() {
    const next = refreshShopState(state.value, Date.now());
    if (next !== state.value) commit(next);
  }

  const gems = computed(() => Number(cash.getTotalCash.value) || 0);
  const gold = computed(() => Number(runStore.totalGold) || 0);
  const nextReset = computed(() => nextResetAt(now.value));

  function canPay(currency: 'gems' | 'gold', amount: number) {
    return currency === 'gems' ? gems.value >= amount : gold.value >= amount;
  }

  function pay(currency: 'gems' | 'gold', amount: number) {
    return currency === 'gems' ? cash.spendCash(amount) : runStore.spendGold(amount);
  }

  // -- Loja Diária ----------------------------------------------------------------

  const dailyOffers = computed(() => state.value.daily.offers);

  function buyDailyOffer(index: number): OwnedEquipment | null {
    ensureFresh();
    const offer = state.value.daily.offers[index];
    if (!offer || offerRemaining(offer) <= 0 || !pay(offer.price.currency, offer.price.amount)) return null;

    const offers = state.value.daily.offers.map((entry, i) => (i === index ? { ...entry, bought: entry.bought + 1 } : entry));
    commit({ ...state.value, daily: { ...state.value.daily, offers } });
    return equipmentStore.grant(offer.defId, offer.rarity);
  }

  // -- Baús ----------------------------------------------------------------------------

  const keys = computed(() => state.value.keys);

  const freeReadyAt = (type: ChestType) => chestFreeReadyAt(CHESTS[type], state.value.chests[type]);
  /** Grátis ainda travado: a conta não terminou nenhuma partida */
  const freeLocked = computed(() => !isFreeUnlocked(statistics.matchesPlayed));
  const isFreeReady = (type: ChestType) => !freeLocked.value && now.value >= freeReadyAt(type);
  const pity = (type: ChestType) => state.value.chests[type].pity;

  function chestState(type: ChestType) {
    return chestButtonState({
      freeReady: isFreeReady(type),
      keys: state.value.keys[type],
      gems: gems.value,
      gemCost: CHESTS[type].gemCost,
    });
  }

  /** Quantos baús o próximo toque abre (balão "xN") */
  function chestBatch(type: ChestType) {
    const mode = chestState(type);
    return mode === 'keys' ? batchSize(state.value.keys[type], CHESTS[type].maxBatch) : 1;
  }

  /** Abre baús: grátis (1), chaves (até 10) ou gemas (1). Entrega os itens antes de qualquer animação. */
  function openChest(type: ChestType, mode: ChestOpenMode = chestState(type) as ChestOpenMode) {
    const chest = CHESTS[type];
    const progress = state.value.chests[type];
    let count = 1;
    const nextKeys = { ...state.value.keys };
    const nextProgress = { ...progress };

    if (mode === 'free') {
      if (!isFreeReady(type)) return null;
      nextProgress.freeClaimedAt = Date.now();
    } else if (mode === 'keys') {
      count = batchSize(nextKeys[type], chest.maxBatch);
      if (count <= 0) return null;
      nextKeys[type] -= count;
    } else if (mode === 'gems') {
      if (!cash.spendCash(chest.gemCost)) return null;
    } else {
      return null;
    }

    const result = openChestBatch(chest, count, progress.pity, Math.random);
    nextProgress.pity = result.pity;
    commit({ ...state.value, keys: nextKeys, chests: { ...state.value.chests, [type]: nextProgress } });

    const items = result.drops.map(drop => equipmentStore.grant(drop.defId, drop.rarity)!).filter(Boolean);
    return { type, mode, items };
  }

  function addKeys(type: ChestType, amount: number) {
    const count = Math.max(0, Math.floor(amount));
    if (!count) return;
    commit({ ...state.value, keys: { ...state.value.keys, [type]: state.value.keys[type] + count } });
  }

  // -- Ouro ------------------------------------------------------------------------------

  const goldBought = (id: string) => state.value.gold.bought[id] ?? 0;
  const goldRemaining = (id: string) => {
    const pack = GOLD_PACKS.find(entry => entry.id === id);
    return pack ? goldPackRemaining(pack, goldBought(id)) : 0;
  };

  function buyGoldPack(id: string) {
    ensureFresh();
    const pack = GOLD_PACKS.find(entry => entry.id === id);
    if (!pack || goldRemaining(id) <= 0) return null;
    if (pack.price && !pay(pack.price.currency, pack.price.amount)) return null;

    runStore.addPersistentGold(pack.gold);
    commit({
      ...state.value,
      gold: { ...state.value.gold, bought: { ...state.value.gold.bought, [id]: goldBought(id) + 1 } },
    });
    return pack.gold;
  }

  // -- Gemas ------------------------------------------------------------------------------

  const bonusApplies = (id: string) => {
    const pack = GEM_PACKS.find(entry => entry.id === id);
    return !!pack && gemBonusApplies(pack, state.value.gemPacksPurchased, GEM_PROMO_BONUS_ACTIVE);
  };

  /** Pagamento confirmado: credita base (+ bônus quando vale) e marca a compra */
  function creditGemPack(id: string) {
    const pack = GEM_PACKS.find(entry => entry.id === id);
    if (!pack) return 0;
    const amount = gemPackCredit(pack, state.value.gemPacksPurchased, GEM_PROMO_BONUS_ACTIVE);
    cash.addCash(amount);
    commit({
      ...state.value,
      gemPacksPurchased: [...new Set([...state.value.gemPacksPurchased, id])],
      pendingPix: state.value.pendingPix?.packId === id ? null : state.value.pendingPix,
    });
    return amount;
  }

  const pendingPix = computed(() => state.value.pendingPix);

  function setPendingPix(charge: PixCharge | null) {
    commit({ ...state.value, pendingPix: charge });
  }

  // -- Badges ------------------------------------------------------------------------------

  const hasDailyPending = computed(() =>
    state.value.daily.offers.some(offer => offerRemaining(offer) > 0 && canPay(offer.price.currency, offer.price.amount)),
  );
  const hasChestPending = computed(() =>
    (Object.keys(CHESTS) as ChestType[]).some(type => isFreeReady(type) || state.value.keys[type] > 0),
  );
  const hasGoldPending = computed(() => GOLD_PACKS.some(pack => !pack.price && goldRemaining(pack.id) > 0));
  /** "!" da aba Loja: baú grátis/chaves ou ouro grátis */
  const hasPending = computed(() => hasChestPending.value || hasGoldPending.value);

  function resetShop() {
    commit(freshShopState(newSeed(), Date.now()));
  }

  /** Debug: força a virada do dia agora */
  function forceDailyReset() {
    commit({
      ...state.value,
      seed: newSeed(),
      daily: { ...state.value.daily, dayKey: -1 },
      gold: { ...state.value.gold, dayKey: -1 },
    });
    ensureFresh();
  }

  /** Debug: libera os baús grátis */
  function resetFreeChests() {
    const chests = { ...state.value.chests };
    for (const type of Object.keys(chests) as ChestType[]) chests[type] = { ...chests[type], freeClaimedAt: null };
    commit({ ...state.value, chests });
  }

  return {
    state,
    now,
    gems,
    gold,
    nextReset,
    canPay,
    ensureFresh,
    dailyOffers,
    buyDailyOffer,
    keys,
    pity,
    freeReadyAt,
    freeLocked,
    isFreeReady,
    chestState,
    chestBatch,
    openChest,
    addKeys,
    goldBought,
    goldRemaining,
    buyGoldPack,
    bonusApplies,
    creditGemPack,
    pendingPix,
    setPendingPix,
    hasDailyPending,
    hasChestPending,
    hasGoldPending,
    hasPending,
    resetShop,
    forceDailyReset,
    resetFreeChests,
  };
});
