export type Impact = { x:number, z:number, fatal:boolean, kind:'hit'|'shot'|'player', enemy?:boolean }
const listeners = new Set<(impact:Impact)=>void>()
export function emitImpact(x:number,z:number,fatal=false,kind:Impact['kind']='hit',enemy=false) { listeners.forEach(fn=>fn({x,z,fatal,kind,enemy})) }
export function subscribeImpacts(fn:(impact:Impact)=>void) { listeners.add(fn); return () => { listeners.delete(fn) } }
