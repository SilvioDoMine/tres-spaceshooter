type Flash = { id: string; burst: boolean };
const listeners = new Set<(flash: Flash) => void>();
export function emitMuzzleFlash(id: string, burst = false) { listeners.forEach(fn => fn({ id, burst })); }
export function subscribeMuzzleFlashes(fn: (flash: Flash) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
