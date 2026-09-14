import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useAudio } from '~/composables/useAudio';

// delay < 0: parada no chão, sem ímã. flight < 0: ainda não saiu voando.
type Coin = { id: number; x: number; z: number; fromX: number; fromZ: number; toX: number; toZ: number; hop: number; delay: number; flight: number; gold: number };

const MAX_COINS = 96;
// Pulinho da moeda saindo do inimigo até o chão
const HOP_DURATION = .45;
const COIN_FLIGHT_DURATION = .42;
// Uma atrás da outra, as mais perto primeiro, sem passar de ~1s de fila
const FLIGHT_STAGGER = .045;
const MAX_STAGGER = .9;

export const useCoinStore = defineStore('coins', () => {
  // Moeda de ouro: não é pega encostando, fica no chão até a sala ser limpa e aí voa sozinha para a nave
  const coins = shallowRef<Coin[]>([]);
  // Posições onde uma moeda entrou na nave; o componente visual consome para fazer o brilho
  let bursts: { x: number; z: number }[] = [];
  let serial = 0;
  function drop(position: { x: number; z: number }, gold: number, rng = Math.random) {
    if (!(gold > 0)) return;
    // No limite, o ouro entra na última moeda em vez de sumir
    if (coins.value.length >= MAX_COINS) { coins.value.at(-1)!.gold += gold; return; }
    const angle = rng() * Math.PI * 2, distance = .4 + rng() * .6;
    const toX = position.x + Math.cos(angle) * distance, toZ = position.z + Math.sin(angle) * distance;
    coins.value = [...coins.value, { id: ++serial, x: position.x, z: position.z, fromX: position.x, fromZ: position.z, toX, toZ, hop: 0, delay: -1, flight: -1, gold }];
  }
  function update(delta = 0) {
    const run = useCurrentRunStore();
    if (!run.isPlaying || run.currentHealth <= 0 || !coins.value.length) return;
    const player = run.getPlayerPosition();
    if (run.isStageCompleted) magnetize(player);
    const collected = new Set<number>();
    for (const coin of coins.value) {
      if (coin.flight < 0 && coin.hop < 1) {
        coin.hop = Math.min(1, coin.hop + delta / HOP_DURATION);
        const ease = 1 - (1 - coin.hop) ** 2;
        coin.x = coin.fromX + (coin.toX - coin.fromX) * ease;
        coin.z = coin.fromZ + (coin.toZ - coin.fromZ) * ease;
      }
      if (coin.delay < 0) continue;
      if (coin.flight < 0) {
        coin.delay -= delta;
        if (coin.delay > 0) continue;
        // Decola de onde estiver, mesmo no meio do pulinho
        coin.flight = 0;
        coin.hop = 1;
        coin.fromX = coin.x;
        coin.fromZ = coin.z;
      }
      coin.flight = Math.min(1, coin.flight + delta / COIN_FLIGHT_DURATION);
      const ease = coin.flight * coin.flight;
      coin.x = coin.fromX + (player.x - coin.fromX) * ease;
      coin.z = coin.fromZ + (player.z - coin.fromZ) * ease;
      if (coin.flight < 1) continue;
      run.addGold(coin.gold);
      useAudio().playCoinSound('collect');
      bursts.push({ x: player.x, z: player.z });
      collected.add(coin.id);
    }
    if (collected.size) coins.value = coins.value.filter(coin => !collected.has(coin.id));
  }
  function magnetize(player: { x: number; z: number }) {
    const waiting = coins.value.filter(coin => coin.delay < 0);
    if (!waiting.length) return;
    waiting.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z));
    waiting.forEach((coin, i) => { coin.delay = Math.min(i * FLIGHT_STAGGER, MAX_STAGGER); });
    useAudio().playCoinSound('magnet');
  }
  /** Credita o ouro das moedas que ainda não chegaram (troca de sala, fim da partida) e limpa. */
  function collectAll() {
    const gold = coins.value.reduce((sum, coin) => sum + coin.gold, 0);
    cleanup();
    if (gold > 0) useCurrentRunStore().addGold(gold);
  }
  function consumeBursts() {
    const pending = bursts;
    bursts = [];
    return pending;
  }
  function cleanup() { coins.value = []; bursts = []; }
  return { coins, drop, update, collectAll, consumeBursts, cleanup };
});
