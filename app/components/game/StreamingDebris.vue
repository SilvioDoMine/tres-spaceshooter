<script setup lang="ts">

import { Group, InstancedMesh, IcosahedronGeometry, MeshStandardMaterial, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, Object3D, Vector3, Euler, DynamicDrawUsage } from 'three'
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
type DebrisBody={position:Vector3,rotation:Euler,scale:Vector3,baseScale:Vector3,radius:number,geometryIndex:number,instanceIndex:number}
const bodies:DebrisBody[]=[]
const random=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.54;return v-Math.floor(v)}
function free(x:number,y:number,z:number,r:number,except?:DebrisBody){
 return bodies.every(other=>other===except || (other.position.x-x)**2+(other.position.y-y)**2+(other.position.z-z)**2 > (other.radius+r+.6)**2)
}
for(let i=0;i<95;i++){
 const position=new Vector3((random(i+1)-.5)*110,-32-random(i+400)*.8,(random(i+200)-.5)*110)
 const scale=new Vector3(.3+random(i+5)*1.4,.3+random(i+10),.5+random(i+15)*1.5)
 const radius=Math.max(scale.x,scale.y,scale.z)*1.35*(1+DILATION_CONFIG.sceneryStretch)
 for(let attempt=0;attempt<100;attempt++){
  position.x=(random(i*101+attempt+6000)-.5)*140
  position.z=(random(i*103+attempt+9000)-.5)*140
  if(free(position.x,position.y,position.z,radius))break
 }
 if(!free(position.x,position.y,position.z,radius))continue
 bodies.push({position,scale:scale.clone(),baseScale:scale,rotation:new Euler(i*.37,i*.71,i*.19),radius,geometryIndex:i%geometries.length,instanceIndex:0})
}
const groupCounts=geometries.map((_,geometryIndex)=>bodies.filter(body=>body.geometryIndex===geometryIndex).length)
const instanceMeshes=geometries.map((geometry,geometryIndex)=>{
 const mesh=new InstancedMesh(geometry,materials[geometryIndex%materials.length],groupCounts[geometryIndex])
 mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;root.add(mesh);return mesh
})
const groupIndexes=geometries.map(()=>0),dummy=new Object3D()
bodies.forEach(body=>{body.instanceIndex=groupIndexes[body.geometryIndex]++})
const particles=new BufferGeometry(),coords=[]
for(let i=0;i<550;i++)coords.push((random(i+800)-.5)*110,-5-random(i+1500)*20,(random(i+2300)-.5)*110)
particles.setAttribute('position',new Float32BufferAttribute(coords,3))
const dustMaterial=new PointsMaterial({color:'#7abaca',size:.045,transparent:true,opacity:.55,depthWrite:false})
const dust=new Points(particles,dustMaterial);root.add(dust)
const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}))
const wrap=(n:number,span:number)=>((n+span/2)%span+span)%span-span/2
// World-space streaming envelope: resizing may reveal more scenery, never
// compress its positions. Only player travel can recycle distant bodies.
let recycleWidth=140,recycleHeight=140
let previous={...run.getPlayerPosition()}
useLoop().onBeforeRender(({delta})=>{
 const p=run.getPlayerPosition(),dt=Math.min(delta,.1)
 if(run.isPlaying)elasticTime+=dt
 const span=240
 recycleWidth=Math.max(recycleWidth,view.value.width*2.5+30)
 recycleHeight=Math.max(recycleHeight,view.value.height*2.5+30)
 const dx=(p.x-previous.x)*.2,dz=(p.z-previous.z)*.2
 const traveling=run.isPlaying && (Math.abs(dx)+Math.abs(dz)>1e-8)
 bodies.forEach(body=>{body.position.x+=dx;body.position.z+=dz})
 bodies.forEach((body,i)=>{
   const bx=recycleWidth*.5,bz=recycleHeight*.5
   const outsideX=Math.abs(body.position.x-p.x)>bx,outsideZ=Math.abs(body.position.z-p.z)>bz
   if(traveling && (outsideX || outsideZ)){
     for(let attempt=0;attempt<30;attempt++){
       const x=outsideX ? p.x-Math.sign(body.position.x-p.x)*(bx-2) : (attempt ? p.x+(random(i*71+attempt)-.5)*bx*2 : body.position.x)
       const z=outsideZ ? p.z-Math.sign(body.position.z-p.z)*(bz-2) : (attempt ? p.z+(random(i*89+attempt)-.5)*bz*2 : body.position.z)
       if(free(x,body.position.y,z,body.radius,body)){body.position.x=x;body.position.z=z;break}
     }
   }
   body.rotation.y+=dt*(.03+(i%3)*.015)
   const proximity=Math.max(0,1-Math.hypot(body.position.x-p.x,body.position.z-p.z)/DILATION_CONFIG.sceneryResponseRadius)
   const stretch=1+(reduced.value?0:DILATION_CONFIG.sceneryStretch)*sceneryDilation(body.position.x,body.position.z,dilation.value)*proximity*(.8+.2*Math.sin(elasticTime*2+i))
   const base=body.baseScale
   body.scale.set(base.x*stretch,base.y/Math.sqrt(stretch),base.z/Math.sqrt(stretch))
   dummy.position.copy(body.position);dummy.rotation.copy(body.rotation);dummy.scale.copy(body.scale);dummy.updateMatrix()
   instanceMeshes[body.geometryIndex].setMatrixAt(body.instanceIndex,dummy.matrix)
 })
 instanceMeshes.forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true})
 previous={...p}

 const a=particles.getAttribute('position')
 for(let i=0;i<a.count;i++){a.setXYZ(i,p.x+wrap(coords[i*3]-p.x*.65,span),coords[i*3+1],p.z+wrap(coords[i*3+2]-p.z*.65,span))}a.needsUpdate=true
})
onUnmounted(()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());particles.dispose();dustMaterial.dispose()})
</script>
<template><primitive :object="root" /></template>



