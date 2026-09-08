type View = { x:number, z:number, width:number, height:number }
const palettes = [
  ['#c5efff','#69c7ed','#3d667d'],
  ['#ffe0ae','#ffab5e','#805940'],
  ['#e2ceff','#b392f1','#675780'],
  ['#beffe3','#73d7bc','#426d69'],
  ['#f5f4ef','#d1dce0','#66717a'],
]
export function createMeteorPass(view:View, previousSector=-1, random=Math.random) {
  // Select a different entry quadrant; then aim through a random part of the view.
  const sector=previousSector<0 ? Math.floor(random()*4) : (previousSector+1+Math.floor(random()*3))%4
  const angle=(sector+random())*Math.PI/2
  const depth=1+38/52
  const hx=view.width*.5*depth,hz=view.height*.5*depth
  const distance=Math.hypot(hx,hz)*1.6+8
  const targetX=view.x+(random()-.5)*hx,targetZ=view.z+(random()-.5)*hz
  const dx=Math.cos(angle),dz=Math.sin(angle),speed=7+random()*15
  const palette=palettes[Math.floor(random()*palettes.length)]
  return {sector,x:targetX-dx*distance,z:targetZ-dz*distance,
    vx:dx*speed,vz:dz*speed,minLife:distance*2/speed,
    scale:.65+random()*1.35,stretch:1+random()*.7,
    spinX:(random()-.5)*5,spinZ:(random()-.5)*4,
    body:palette[0],glow:palette[1],smoke:palette[2],
    tailLife:.35+random()*.65,interval:9+random()*12}
}
