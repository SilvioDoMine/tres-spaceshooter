import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { COMBAT_BASE } from '~/utils/shipAttributes';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';

export const useHeartStore = defineStore('hearts', () => {
  const hearts = shallowRef<{ id: number; x: number; z: number }[]>([]);
  let serial = 0;
  function tryDrop(position: { x: number; z: number }, rng = Math.random) {
    if (hearts.value.length >= 32 || rng() >= COMBAT_BASE.heartDropChance) return;
    hearts.value = [...hearts.value, { id: ++serial, x: position.x, z: position.z }];
  }
  function update() {
    const run = useCurrentRunStore();
    if (!run.isPlaying || run.currentHealth <= 0 || run.currentHealth >= run.maxHealth) return;
    const player = run.getPlayerPosition();
    const collected = new Set<number>();
    for (const heart of hearts.value) {
      if (run.currentHealth >= run.maxHealth) break;
      if (Math.hypot(heart.x - player.x, heart.z - player.z) > 1.1) continue;
      run.healPlayer(usePlayerStats().attributes.heartHeal);
      collected.add(heart.id);
    }
    if (collected.size) hearts.value = hearts.value.filter(heart => !collected.has(heart.id));
  }
  function cleanup() { hearts.value = []; }
  return { hearts, tryDrop, update, cleanup };
});
