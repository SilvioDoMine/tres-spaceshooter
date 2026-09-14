import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useAudio } from '~/composables/useAudio';

export type LootKind = 'coin' | 'exp';
// delay < 0: parada no chão, sem ímã. flight < 0: ainda não saiu voando. tier só vale para EXP (0 comum, 1 grande).
type Loot = { id: number; kind: LootKind; tier: number; value: number; x: number; z: number; fromX: number; fromZ: number; toX: number; toZ: number; hop: number; delay: number; flight: number };

const MAX_LOOT = 160;
// Pulinho da peça saindo do inimigo até o chão
const HOP_DURATION = .45;
const LOOT_FLIGHT_DURATION = .42;
// Uma atrás da outra, as mais perto primeiro, sem passar de ~1s de fila
const FLIGHT_STAGGER = .04;
const MAX_STAGGER = .9;
// Pedrinhas de EXP: quanto vale a comum e a grande (cor diferente); o excesso por abate engrossa as pedrinhas
export const EXP_GEM_VALUES = [10, 100];
const MAX_GEMS_PER_DROP = 12;
// true: a EXP sai do inimigo e já voa para a nave; false: espera a sala ser limpa, igual às moedas
export const EXP_FLIES_ON_DROP = false;

/** Divide a EXP de um abate em pedrinhas, sem perder nada do total. */
export function splitExp(total: number) {
  const [small, big] = EXP_GEM_VALUES as [number, number];
  const gems: { tier: number; value: number }[] = [];
  let rest = Math.max(0, Math.floor(total));
  while (rest >= big && gems.length < MAX_GEMS_PER_DROP - 1) { gems.push({ tier: 1, value: big }); rest -= big; }
  const count = Math.min(Math.ceil(rest / small), MAX_GEMS_PER_DROP - gems.length);
  const each = Math.floor(rest / count);
  for (let i = 0; i < count; i++) {
    const value = i < count - 1 ? each : rest - each * (count - 1);
    gems.push({ tier: value >= big ? 1 : 0, value });
  }
  return gems;
}

export const useLootStore = defineStore('loot', () => {
  // Espólio dos inimigos: não é pego encostando, fica no chão até a sala ser limpa e aí voa sozinho para a nave
  const loot = shallowRef<Loot[]>([]);
  // Onde uma peça entrou na nave; o componente visual consome para fazer o brilho
  let bursts: { x: number; z: number; kind: LootKind; tier: number }[] = [];
  let serial = 0;
  function spawn(kind: LootKind, tier: number, value: number, position: { x: number; z: number }, spread: number, rng: () => number) {
    const angle = rng() * Math.PI * 2, distance = spread * (.4 + rng() * .6);
    const toX = position.x + Math.cos(angle) * distance, toZ = position.z + Math.sin(angle) * distance;
    return { id: ++serial, kind, tier, value, x: position.x, z: position.z, fromX: position.x, fromZ: position.z, toX, toZ, hop: 0, delay: -1, flight: -1 };
  }
  function add(pieces: Loot[]) {
    const room = MAX_LOOT - loot.value.length;
    // No limite, o valor que não cabe entra na última peça do mesmo tipo em vez de sumir
    for (const piece of pieces.slice(Math.max(0, room))) {
      const last = loot.value.findLast(item => item.kind === piece.kind) ?? pieces[Math.max(0, room) - 1];
      if (last) last.value += piece.value;
      else credit(piece);
    }
    if (room > 0) loot.value = [...loot.value, ...pieces.slice(0, room)];
  }
  function dropGold(position: { x: number; z: number }, gold: number, rng = Math.random) {
    if (gold > 0) add([spawn('coin', 0, gold, position, 1, rng)]);
  }
  function dropExp(position: { x: number; z: number }, exp: number, rng = Math.random) {
    const gems = splitExp(exp).map(gem => spawn('exp', gem.tier, gem.value, position, 1.4, rng));
    if (EXP_FLIES_ON_DROP) gems.forEach((gem, i) => { gem.delay = i * FLIGHT_STAGGER; });
    add(gems);
  }
  function credit(item: Loot) {
    const run = useCurrentRunStore();
    if (item.kind === 'coin') {
      run.addGold(item.value);
      useAudio().playLootSound('coin');
    } else {
      run.addExp(item.value);
      useAudio().playLootSound(item.tier ? 'exp-big' : 'exp');
    }
  }
  function update(delta = 0) {
    const run = useCurrentRunStore();
    if (!run.isPlaying || run.currentHealth <= 0 || !loot.value.length) return;
    const player = run.getPlayerPosition();
    if (run.isStageCompleted) magnetize(player);
    const collected = new Set<number>();
    for (const item of loot.value) {
      if (item.flight < 0 && item.hop < 1) {
        item.hop = Math.min(1, item.hop + delta / HOP_DURATION);
        const ease = 1 - (1 - item.hop) ** 2;
        item.x = item.fromX + (item.toX - item.fromX) * ease;
        item.z = item.fromZ + (item.toZ - item.fromZ) * ease;
      }
      if (item.delay < 0) continue;
      if (item.flight < 0) {
        item.delay -= delta;
        if (item.delay > 0) continue;
        // Decola de onde estiver, mesmo no meio do pulinho
        item.flight = 0;
        item.hop = 1;
        item.fromX = item.x;
        item.fromZ = item.z;
      }
      item.flight = Math.min(1, item.flight + delta / LOOT_FLIGHT_DURATION);
      const ease = item.flight * item.flight;
      item.x = item.fromX + (player.x - item.fromX) * ease;
      item.z = item.fromZ + (player.z - item.fromZ) * ease;
      if (item.flight < 1) continue;
      credit(item);
      bursts.push({ x: player.x, z: player.z, kind: item.kind, tier: item.tier });
      collected.add(item.id);
    }
    if (collected.size) loot.value = loot.value.filter(item => !collected.has(item.id));
  }
  function magnetize(player: { x: number; z: number }) {
    const waiting = loot.value.filter(item => item.delay < 0);
    if (!waiting.length) return;
    waiting.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z));
    waiting.forEach((item, i) => { item.delay = Math.min(i * FLIGHT_STAGGER, MAX_STAGGER); });
    useAudio().playLootSound('magnet');
  }
  /**
   * Credita o que ainda não chegou e limpa (troca de sala, fim da partida).
   * No fim da partida a EXP fica de fora: é só da run e subir de nível abriria a escolha de habilidades.
   */
  function collectAll(includeExp = true) {
    const pending = loot.value;
    cleanup();
    const run = useCurrentRunStore();
    const gold = pending.reduce((sum, item) => sum + (item.kind === 'coin' ? item.value : 0), 0);
    const exp = pending.reduce((sum, item) => sum + (item.kind === 'exp' ? item.value : 0), 0);
    if (gold > 0) run.addGold(gold);
    if (includeExp && exp > 0) run.addExp(exp);
  }
  function consumeBursts() {
    const pending = bursts;
    bursts = [];
    return pending;
  }
  function cleanup() { loot.value = []; bursts = []; }
  return { loot, dropGold, dropExp, update, collectAll, consumeBursts, cleanup };
});
