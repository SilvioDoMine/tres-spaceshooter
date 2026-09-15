// A explosão final cresce com o alvo. `hull` é o raio do casco medido no modelo em escala cheia
// (o que vale de verdade); `size` é o número do baseStats, usado só como reserva quando não houve medição.
export type Impact = { x:number, z:number, fatal:boolean, kind:'hit'|'shot'|'player', enemy?:boolean, size?:number, hull?:number }
const listeners = new Set<(impact:Impact)=>void>()
export function emitImpact(x:number,z:number,fatal=false,kind:Impact['kind']='hit',enemy=false,size=1,hull=0) { listeners.forEach(fn=>fn({x,z,fatal,kind,enemy,size,hull})) }
export function subscribeImpacts(fn:(impact:Impact)=>void) { listeners.add(fn); return () => { listeners.delete(fn) } }
