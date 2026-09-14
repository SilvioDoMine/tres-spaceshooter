import { useLoop } from '@tresjs/core';

/**
 * useLoop com o tempo da partida: no Fast Game o delta (e o elapsed) chegam multiplicados pela velocidade,
 * então animações e efeitos da cena acompanham a lógica acelerada do GameOrchestrator.
 */
export function useGameLoop() {
  const loop = useLoop();
  const run = useCurrentRunStore();

  function onBeforeRender(fn: (context: any) => void) {
    let elapsed = 0;
    return loop.onBeforeRender((context: any) => {
      const delta = context.delta * run.gameSpeed;
      elapsed += delta;
      fn({ ...context, delta, elapsed });
    });
  }

  return { ...loop, onBeforeRender };
}
