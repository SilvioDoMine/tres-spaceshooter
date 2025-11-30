import { Pane } from 'tweakpane';

export const useTweakpaneStore = defineStore('tweakpane', () => {
  let pane = ref(null);

  function createPane(container, options = {}) {
    pane.value = new Pane({
      container: container || document.body,
      ...options,
    });

    return pane;
  }

  function destroyPane() {
    if (pane) {
      pane.dispose();
      pane = null;
    }
  }

  return {
    createPane,
    destroyPane,
    get pane() {
      return pane;
    },
  };
});

// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTweakpaneStore, import.meta.hot))
}
