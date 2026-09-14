<script setup lang="ts">
import { Group, Mesh, MeshBasicMaterial, ConeGeometry, TorusGeometry, AdditiveBlending } from 'three'
const props = defineProps<{ gameplay?: boolean }>()
const root = new Group()
const jets: Mesh[] = []
const rings: Mesh[] = []
const core = new MeshBasicMaterial({ color:'#a9f8ff', transparent:true, opacity:.9, blending:AdditiveBlending, depthWrite:false })
const glow = new MeshBasicMaterial({ color:'#1daeea', transparent:true, opacity:.35, blending:AdditiveBlending, depthWrite:false })
const geo = new ConeGeometry(.064,.72,12); geo.translate(0,.36,0); geo.rotateX(Math.PI/2)
const ringGeo = new TorusGeometry(.054,.009,4,12)
for (const side of [-1,1]) {
  const jet = new Mesh(geo,core); jet.position.set(side*.306,.011,.606); root.add(jet); jets.push(jet)
  const halo = new Mesh(geo,glow); halo.position.copy(jet.position); halo.scale.set(1.8,1.8,1.1); root.add(halo); jets.push(halo)
  for (let i=0;i<4;i++) { const ring = new Mesh(ringGeo,glow); ring.position.copy(jet.position); ring.userData.phase=i/4; root.add(ring); rings.push(ring) }
}
const run = useCurrentRunStore()
const appearance=useShipAppearance()
const thrusterColor=useThrusterColor()
const dilation=useSpatialDilation().state
let time = 0
// Hiper velocidade (sala limpa): 0..1 suavizado, jatos mais longos, largos e brancos
let hyper = 0
useGameLoop().onBeforeRender(({delta}) => {
  if(run.gameState==='paused')return
  const dt=Math.min(delta,.1)
  time += dt
  hyper += ((props.gameplay && run.isHyperdrive ? 1 : 0)-hyper)*(1-Math.exp(-dt*6))
  glow.color.set(thrusterColor()); core.color.copy(glow.color).lerp({r:1,g:1,b:1} as any,.65+hyper*.25)
  glow.opacity=.35+hyper*.3
  const m=run.getMoveVector(); const thrust=(m.x*m.x+m.z*m.z>0 ? 1.5 : .85)*(1+dilation.value.visual*.2)*(1+hyper*1.1)
  jets.forEach((jet,i) => { jet.scale.z=(appearance.value.power ?? 1)*thrust*(.85+.24*Math.sin(time*24+i*.8)); jet.scale.x=(i%2 ? 1.8 : 1)*(1+hyper*.4)*(.94+.1*Math.cos(time*19+i)) })
  rings.forEach(ring => { const phase=(time*(2.8+hyper*3.2)+ring.userData.phase)%1; ring.position.z=.62+phase*.65*thrust; ring.scale.setScalar(((1-phase)*1.5+.2)*(1+hyper*.5)) })
})
onUnmounted(()=> { geo.dispose(); ringGeo.dispose(); core.dispose(); glow.dispose() })
</script>
<template><primitive :object="root" /></template>
