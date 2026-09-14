import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { COMBAT_BASE } from '~/utils/shipAttributes';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useCombatTextStore } from '~/stores/useCombatTextStore';
import { useAudio } from '~/composables/useAudio';

// delay >= 0: na fila para voar sozinho depois da sala limpa
type Heart = { id: number; x: number; z: number; startX: number; startZ: number; flight: number; delay: number; heal: number; warned: boolean };

const PICKUP_RADIUS = 1.8;
// Só avisa de novo depois que a nave saiu por completo de perto do coração
const WARNING_RESET_RADIUS = 2.6;
const FLIGHT_DURATION = .32;
// Sala limpa: um coração atrás do outro, os mais perto primeiro
const HEART_STAGGER = .08;

export const useHeartStore = defineStore('hearts', () => {
  const hearts = shallowRef<Heart[]>([]);
  // Posições onde um coração entrou na nave; o componente visual consome para fazer o brilho
  let bursts: { x: number; z: number }[] = [];
  let serial = 0;
  function tryDrop(position: { x: number; z: number }, rng = Math.random) {
    if (hearts.value.length >= 32 || rng() >= COMBAT_BASE.heartDropChance) return;
    hearts.value = [...hearts.value, { id: ++serial, x: position.x, z: position.z, startX: position.x, startZ: position.z, flight: -1, delay: -1, heal: 0, warned: false }];
  }
  function startFlight(heart: Heart) {
    heart.heal = usePlayerStats().attributes.heartHeal;
    heart.flight = 0;
    heart.startX = heart.x;
    heart.startZ = heart.z;
    useAudio().playHeartSound('pull', FLIGHT_DURATION);
  }
  // Sala limpa: todos os corações do chão vêm até a nave, mesmo com vida cheia (ficariam para trás de qualquer jeito)
  function magnetize(player: { x: number; z: number }) {
    const waiting = hearts.value.filter(heart => heart.flight < 0 && heart.delay < 0);
    waiting.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z));
    waiting.forEach((heart, i) => { heart.delay = i * HEART_STAGGER; });
  }
  function update(delta = 0) {
    const run = useCurrentRunStore();
    if (!run.isPlaying || run.currentHealth <= 0) return;
    const player = run.getPlayerPosition();
    if (run.isStageCompleted) magnetize(player);
    // Cura já a caminho conta como vida para não puxar corações que seriam desperdiçados
    let incoming = hearts.value.reduce((sum, heart) => sum + (heart.flight >= 0 ? heart.heal : 0), 0);
    const collected = new Set<number>();
    for (const heart of hearts.value) {
      if (heart.flight < 0 && heart.delay >= 0) {
        heart.delay -= delta;
        if (heart.delay > 0) continue;
        startFlight(heart);
      }
      if (heart.flight >= 0) {
        // Voa atrás da nave acelerando até entrar nela
        heart.flight = Math.min(1, heart.flight + delta / FLIGHT_DURATION);
        const ease = heart.flight * heart.flight;
        heart.x = heart.startX + (player.x - heart.startX) * ease;
        heart.z = heart.startZ + (player.z - heart.startZ) * ease;
        if (heart.flight < 1) continue;
        run.healPlayer(heart.heal);
        useAudio().playHeartSound('heal');
        bursts.push({ x: player.x, z: player.z });
        collected.add(heart.id);
        continue;
      }
      const distance = Math.hypot(heart.x - player.x, heart.z - player.z);
      if (distance > WARNING_RESET_RADIUS) heart.warned = false;
      if (distance > PICKUP_RADIUS) continue;
      if (run.currentHealth + incoming >= run.maxHealth) {
        if (!heart.warned) useCombatTextStore().emitForTarget(PlayerBaseStats.id, 'full', 'VIDA CHEIA');
        heart.warned = true;
        continue;
      }
      startFlight(heart);
      incoming += heart.heal;
    }
    if (collected.size) hearts.value = hearts.value.filter(heart => !collected.has(heart.id));
  }
  /** Troca de sala: corações já voando ou na fila curam na hora; os parados no chão ficam para trás. */
  function collectAll() {
    const run = useCurrentRunStore();
    const heal = hearts.value.reduce((sum, heart) => sum + (heart.flight >= 0 ? heart.heal : heart.delay >= 0 ? usePlayerStats().attributes.heartHeal : 0), 0);
    cleanup();
    if (heal > 0) run.healPlayer(heal);
  }
  function consumeBursts() {
    const pending = bursts;
    bursts = [];
    return pending;
  }
  function cleanup() { hearts.value = []; bursts = []; }
  return { hearts, tryDrop, update, collectAll, consumeBursts, cleanup };
});
