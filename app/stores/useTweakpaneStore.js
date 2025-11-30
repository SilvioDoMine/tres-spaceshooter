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
