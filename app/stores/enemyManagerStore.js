export const useEnemyManagerStore = defineStore('enemyManagerStore', () => {
  // Enemy manager state and actions would go here
  const activeEnemies = ref([]);

  // Killed enemies count for the current run, by enemy type and count
  // example : { "goblin": 5, "orc": 2 }
  const killedEnemies = ref({});

  return {
    activeEnemies,
    killedEnemies,
  }
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEnemyManagerStore, import.meta.hot))
}