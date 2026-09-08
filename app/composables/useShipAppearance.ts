export function useShipAppearance() {
 return useState('kestrel-appearance', () => ({ color:'#17a2ad', thrusters:true, exhaust:'#27c7ff', finish:.4, power:1 }))
}
