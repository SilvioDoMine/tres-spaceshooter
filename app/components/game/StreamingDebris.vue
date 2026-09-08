<script setup lang="ts">

import { Group, Mesh, IcosahedronGeometry, MeshStandardMaterial, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three'
import { DILATION_CONFIG, sceneryDilation } from '~/utils/spatialDilation'
const root=new Group(),run=useCurrentRunStore()
const dilation=useSpatialDilation().state
const reduced=useState('spatial-reduced-motion',()=>false)
let elasticTime=0
const geometries=Array.from({length:8},(_,index)=>{
 const geo=new IcosahedronGeometry(1,3),p=geo.getAttribute('position')
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i)
  const noise=Math.sin(x*7+index)*Math.cos(y*9-index)*Math.sin(z*6+index)*.1
  const crater=Math.exp(-((x-.45)**2+(y-.6)**2+(z-.55)**2)*18)*.23
  const r=1+noise-crater+.12*Math.sin(x*3+z*4+index)
  p.setXYZ(i,x*r,y*r,z*r)
 }
 geo.computeVertexNormals();return geo
})
const materials=['#24315c','#523251','#6b4632','#174c65'].map(color=>new MeshStandardMaterial({color,roughness:.85,metalness:.25,flatShading:true}));
const bodies:Mesh[]=[]
const random=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.54;return v-Math.floor(v)}
function free(x:number,y:number,z:number,r:number,except?:Mesh){
 return bodies.every(other=>other===except || (other.position.x-x)**2+(other.position.y-y)**2+(other.position.z-z)**2 > (other.userData.radius+r+.6)**2)
}
for(let i=0;i<95;i++){
 const m=new Mesh(geometries[i%geometries.length],materials[i%materials.length])
 m.userData={x:(random(i+1)-.5)*110,z:(random(i+200)-.5)*110,y:-32-random(i+400)*.8}
 m.scale.set(.3+random(i+5)*1.4,.3+random(i+10),.5+random(i+15)*1.5)
 m.userData.baseScale=m.scale.clone()
 m.userData.radius=Math.max(m.scale.x,m.scale.y,m.scale.z)*1.35*(1+DILATION_CONFIG.sceneryStretch)
 for(let attempt=0;attempt<100;attempt++){
  m.userData.x=(random(i*101+attempt+6000)-.5)*140
  m.userData.z=(random(i*103+attempt+9000)-.5)*140
  if(free(m.userData.x,m.userData.y,m.userData.z,m.userData.radius))break
 }
 if(!free(m.userData.x,m.userData.y,m.userData.z,m.userData.radius))continue
 m.position.set(m.userData.x,m.userData.y,m.userData.z);m.rotation.set(i*.37,i*.71,i*.19);root.add(m);bodies.push(m)
}
const particles=new BufferGeometry(),coords=[]
for(let i=0;i<550;i++)coords.push((random(i+800)-.5)*110,-5-random(i+1500)*20,(random(i+2300)-.5)*110)
particles.setAttribute('position',new Float32BufferAttribute(coords,3))
const dustMaterial=new PointsMaterial({color:'#7abaca',size:.045,transparent:true,opacity:.55,depthWrite:false})
const dust=new Points(particles,dustMaterial);root.add(dust)
const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}))
const wrap=(n:number,span:number)=>((n+span/2)%span+span)%span-span/2
let previous={...run.getPlayerPosition()}
useLoop().onBeforeRender(({delta})=>{
 const p=run.getPlayerPosition(),dt=Math.min(delta,.1)
 if(run.isPlaying)elasticTime+=dt
 const span=Math.max(150,view.value.width*2.5+30,view.value.height*2.5+30)
 // Relocate only beyond the projected frustum, preserving positions on viewport resize.
 const dx=(p.x-previous.x)*.2,dz=(p.z-previous.z)*.2
 bodies.forEach(m=>{m.position.x+=dx;m.position.z+=dz})
 bodies.forEach((m,i)=>{
   const depth=1-m.position.y/52
   const bx=view.value.width*.5*depth+12,bz=view.value.height*.5*depth+12
   const outsideX=Math.abs(m.position.x-view.value.x)>bx,outsideZ=Math.abs(m.position.z-view.value.z)>bz
   if(outsideX || outsideZ){
     for(let attempt=0;attempt<30;attempt++){
       const x=outsideX ? view.value.x-Math.sign(m.position.x-view.value.x)*(bx-2) : (attempt ? view.value.x+(random(i*71+attempt)-.5)*bx*2 : m.position.x)
       const z=outsideZ ? view.value.z-Math.sign(m.position.z-view.value.z)*(bz-2) : (attempt ? view.value.z+(random(i*89+attempt)-.5)*bz*2 : m.position.z)
       if(free(x,m.position.y,z,m.userData.radius,m)){m.position.x=x;m.position.z=z;break}
     }
   }
   m.rotation.y+=dt*(.03+(i%3)*.015)
   const proximity=Math.max(0,1-Math.hypot(m.position.x-p.x,m.position.z-p.z)/DILATION_CONFIG.sceneryResponseRadius)
   const stretch=1+(reduced.value?0:DILATION_CONFIG.sceneryStretch)*sceneryDilation(m.position.x,m.position.z,dilation.value)*proximity*(.8+.2*Math.sin(elasticTime*2+i))
   const base=m.userData.baseScale
   m.scale.set(base.x*stretch,base.y/Math.sqrt(stretch),base.z/Math.sqrt(stretch))
 })
 previous={...p}

 const a=particles.getAttribute('position')
 for(let i=0;i<a.count;i++){a.setXYZ(i,p.x+wrap(coords[i*3]-p.x*.65,span),coords[i*3+1],p.z+wrap(coords[i*3+2]-p.z*.65,span))}a.needsUpdate=true
})
onUnmounted(()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());particles.dispose();dustMaterial.dispose()})
</script>
<template><primitive :object="root" /></template>



