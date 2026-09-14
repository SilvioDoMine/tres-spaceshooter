import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { COMBAT_BASE } from '~/utils/shipAttributes';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useCombatTextStore } from '~/stores/useCombatTextStore';

type Heart = { id: number; x: number; z: number; startX: number; startZ: number; flight: number; heal: number; warned: boolean };

const PICKUP_RADIUS = 1.1;
// Só avisa de novo depois que a nave saiu por completo de cima do coração
const WARNING_RESET_RADIUS = 1.9;
const FLIGHT_DURATION = .32;

export const useHeartStore = defineStore('hearts', () => {
  const hearts = shallowRef<Heart[]>([]);
  // Posições onde um coração entrou na nave; o componente visual consome para fazer o brilho
  let bursts: { x: number; z: number }[] = [];
  let serial = 0;
  function tryDrop(position: { x: number; z: number }, rng = Math.random) {
    if (hearts.value.length >= 32 || rng() >= COMBAT_BASE.heartDropChance) return;
    hearts.value = [...hearts.value, { id: ++serial, x: position.x, z: position.z, startX: position.x, startZ: position.z, flight: -1, heal: 0, warned: false }];
  }
  function update(delta = 0) {
    const run = useCurrentRunStore();
    if (!run.isPlaying || run.currentHealth <= 0) return;
    const player = run.getPlayerPosition();
    // Cura já a caminho conta como vida para não puxar corações que seriam desperdiçados
    let incoming = hearts.value.reduce((sum, heart) => sum + (heart.flight >= 0 ? heart.heal : 0), 0);
    const collected = new Set<number>();
    for (const heart of hearts.value) {
      if (heart.flight >= 0) {
        // Voa atrás da nave acelerando até entrar nela
        heart.flight = Math.min(1, heart.flight + delta / FLIGHT_DURATION);
        const ease = heart.flight * heart.flight;
        heart.x = heart.startX + (player.x - heart.startX) * ease;
        heart.z = heart.startZ + (player.z - heart.startZ) * ease;
        if (heart.flight < 1) continue;
        run.healPlayer(heart.heal);
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
      heart.heal = usePlayerStats().attributes.heartHeal;
      heart.flight = 0;
      incoming += heart.heal;
    }
    if (collected.size) hearts.value = hearts.value.filter(heart => !collected.has(heart.id));
  }
  function consumeBursts() {
    const pending = bursts;
    bursts = [];
    return pending;
  }
  function cleanup() { hearts.value = []; bursts = []; }
  return { hearts, tryDrop, update, consumeBursts, cleanup };
});
