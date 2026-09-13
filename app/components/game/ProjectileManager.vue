<script setup lang="js">
import { Group, InstancedMesh, Object3D, PlaneGeometry, ShaderMaterial, MeshBasicMaterial, AdditiveBlending, Color, DynamicDrawUsage } from 'three';
import { useLoop } from '@tresjs/core';
import { useProjectileStore } from '~/stores/projectileStore';

const store=useProjectileStore(),root=new Group(),dummy=new Object3D();
const geometry=new PlaneGeometry(.8,1.9);geometry.rotateX(Math.PI/2);geometry.translate(0,0,-.45);
const orbGeometry=new PlaneGeometry(.72,.72);orbGeometry.rotateX(Math.PI/2);
// 7 = lança da Colmeia (bola esticada, dourada), 8 = tiro da Colmeia (bola âmbar), 9 = tiro da Harpia (bola magenta)
const palette=['#38cfff','#82edff','#c7a3ff','#ffc777','#50caff','#ff719c','#ffbf66','#fff06a','#ffa53d','#ff5fb0'];
const materials=palette.map((color,index)=>new ShaderMaterial({
 transparent:true,depthWrite:false,side:2,blending:AdditiveBlending,
 uniforms:{time:{value:0},tint:{value:new Color(color)},orb:{value:index>=7?1:Math.max(0,index-3)}},
 vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
 fragmentShader:`
 varying vec2 v;uniform float time;uniform vec3 tint;uniform float orb;
 void main(){
  float alpha;float white;
  if(orb>2.5){
   float x=abs(v.x-.5);
   float nose=clamp((.93-v.y)*.5,0.,.09);
   float hull=(1.-smoothstep(nose,nose+.018,x))*smoothstep(.36,.41,v.y)*(1.-smoothstep(.88,.94,v.y));
   float fins=(1.-smoothstep(.04,.07,abs(x-.115)))*smoothstep(.32,.4,v.y)*(1.-smoothstep(.43,.55,v.y));
   float flame=exp(-x*x*650.)*smoothstep(.03,.36,v.y)*(1.-smoothstep(.35,.43,v.y))*(.8+.2*sin(time*35.+v.y*20.));
   alpha=clamp(hull+fins*.8+flame,0.,1.);
   white=hull*.85+flame*.45;
  }else if(orb>1.5){
   vec2 p=vec2((v.x-.5)*4.,(v.y-.58)*2.);
   float r=length(p);
   float core=exp(-r*r*22.);
   float shell=exp(-pow((r-.38)*13.,2.));
   float wake=exp(-pow((v.x-.5)*19.,2.))*smoothstep(.02,.4,v.y)*(1.-smoothstep(.4,.6,v.y));
   alpha=clamp(core+shell*.65+wake*.5,0.,1.);
   white=core;
  }else if(orb>.5){
   float r=length(v-.5)*2.;
   float body=1.-smoothstep(.38,.62,r);
   float rim=exp(-pow((r-.53)*13.,2.));
   alpha=(body*.9+rim*.65+exp(-r*r*4.)*.32)*(1.-smoothstep(.8,1.,r));
   white=exp(-pow(length(v-vec2(.41,.62))*7.,2.));
  }else{
   float x=abs(v.x-.5);
   float head=exp(-pow(x*14.,2.)-pow((v.y-.74)*12.,2.));
   float envelope=smoothstep(.04,.62,v.y)*(1.-smoothstep(.74,.96,v.y));
   float core=exp(-x*x*1600.)*envelope;
   float trail=exp(-x*x*210.)*envelope*(.86+.14*sin(time*18.));
   float edge=smoothstep(0.,.08,v.y)*(1.-smoothstep(.92,1.,v.y))*(1.-smoothstep(.32,.48,x));
   alpha=clamp((head*.85+core+trail*.55)*edge,0.,1.);
   white=clamp(core+head*.7,0.,1.);
  }
  if(alpha<.008)discard;
  gl_FragColor=vec4(mix(tint,vec3(1.),white),alpha);
 }`
}));
const batches=materials.map((material,i)=>{
 const mesh=new InstancedMesh(i>=4?orbGeometry:geometry,material,480);
 mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;root.add(mesh);return mesh;
});
// Shared ribbon pool for rear curves and ricochet paths: no per-shot mesh creation.
const trailGeometry=new PlaneGeometry(1,1);trailGeometry.rotateX(Math.PI/2);
const trailMaterial=new MeshBasicMaterial({color:'#7beaff',transparent:true,opacity:.42,depthWrite:false,side:2,blending:AdditiveBlending});
const trails=new InstancedMesh(trailGeometry,trailMaterial,480*14);
trails.instanceMatrix.setUsage(DynamicDrawUsage);trails.frustumCulled=false;trails.count=0;root.add(trails);
let time=0;
useLoop().onBeforeRender(({delta})=>{
 time+=Math.min(delta,.1);materials.forEach(m=>m.uniforms.time.value=time);
 const counts=Array(batches.length).fill(0);let trailCount=0;
 for(const p of store.projectiles){
  const tier=p.ownerType==='enemy'?(p.type==='enemyLance'?7:p.type==='hiveShot'?8:p.type==='harpyShot'?9:p.type==='enemyMissile'?6:p.type==='enemyPlasma'?5:4):p.burst?3:p.echo?2:p.power>=2.5?3:p.power>=1.75?2:p.power>1?1:0;
  // Bolas inimigas crescem junto com a hitbox (tamanho padrão .22 = escala 1)
  const ball=tier===4||tier>=7;
  const size=p.ownerType==='enemy'?(ball?Math.max(1,(p.size||.22)/.22):1):1+Math.min(.55,Math.max(0,p.power-1)*.35);
  dummy.position.set(p.position.x,1,p.position.z);
  dummy.rotation.set(0,Math.atan2(p.direction.x,p.direction.z),0);
  dummy.scale.set(size,1,p.ownerType==='enemy'?(tier===7?size*1.9:tier===6?1.8:tier===5?1.35:size):1+Math.min(.4,(p.power-1)*.2));
  dummy.updateMatrix();batches[tier].setMatrixAt(counts[tier]++,dummy.matrix);
  for(let i=1;i<p.trail.length;i++){
   const a=p.trail[i-1],b=p.trail[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   if(length<.001)continue;
   dummy.position.set((a.x+b.x)/2,.95,(a.z+b.z)/2);
   dummy.rotation.set(0,Math.atan2(dx,dz),0);
   dummy.scale.set((p.ricochet?.11:.07)*i/p.trail.length,1,length+.015);dummy.updateMatrix();
   trails.setMatrixAt(trailCount++,dummy.matrix);
  }
 }
 batches.forEach((mesh,i)=>{mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=true});
 trails.count=trailCount;trails.instanceMatrix.needsUpdate=true;
});
onUnmounted(()=>{
 batches.forEach(mesh=>mesh.dispose());trails.dispose();
 geometry.dispose();orbGeometry.dispose();trailGeometry.dispose();trailMaterial.dispose();
 materials.forEach(m=>m.dispose());store.cleanup();
});
</script>
<template><primitive :object="root" /></template>
