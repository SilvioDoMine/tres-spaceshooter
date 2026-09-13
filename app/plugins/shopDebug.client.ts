import { CHEST_ORDER, type ChestType } from '~/data/shop';
import { useCash } from '~/composables/useCash';
import { simulatePixPayment } from '~/composables/usePix';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useShopStore } from '~/stores/useShopStore';

// Comandos de debug no console para testar a Loja:
//   giveKeys('silver', 22)   -> chaves de prata (ou 'obsidian')
//   giveGems(1000)           -> gemas
//   giveGold(50000)          -> ouro
//   resetFreeChests()        -> libera os baús grátis
//   forceShopReset()         -> vira o dia da Loja Diária e do estoque do ouro
//   simulatePixPayment()     -> confirma a cobrança PIX pendente (depois toque em Atualizar)
//   resetShop()              -> estado da loja do zero
export default defineNuxtPlugin(() => {
  Object.assign(window, {
    giveKeys: (type: ChestType = 'silver', amount = 10) => {
      if (!CHEST_ORDER.includes(type)) return console.warn(`[giveKeys] Tipo inválido. Use: ${CHEST_ORDER.join(', ')}`);
      useShopStore().addKeys(type, amount);
    },
    giveGems: (amount = 1000) => useCash().addCash(Math.max(0, Math.floor(amount))),
    giveGold: (amount = 10000) => useCurrentRunStore().addPersistentGold(amount),
    resetFreeChests: () => useShopStore().resetFreeChests(),
    forceShopReset: () => useShopStore().forceDailyReset(),
    simulatePixPayment,
    resetShop: () => useShopStore().resetShop(),
  });

  if (import.meta.dev) {
    console.info("[debug] giveKeys('silver', 22) • giveGems(1000) • giveGold(50000) • resetFreeChests() • forceShopReset() • simulatePixPayment() • resetShop()");
  }
});
