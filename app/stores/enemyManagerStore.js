export const useEnemyManagerStore = defineStore('enemyManagerStore', () => {
  // Enemy manager state and actions would go here
  const activeEnemies = ref([]);

  return {
    activeEnemies,
  }
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEnemyManagerStore, import.meta.hot))
}