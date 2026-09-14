<script setup lang="js">
import { Group, InstancedMesh, Object3D, PlaneGeometry, ShaderMaterial, MeshBasicMaterial, AdditiveBlending, Color, DynamicDrawUsage } from 'three';
import { useLoop } from '@tresjs/core';
import { useProjectileStore } from '~/stores/projectileStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

const store=useProjectileStore(),root=new Group(),dummy=new Object3D();
// Trocou de sala (ou recomeçou a partida): tiros da sala anterior somem na hora.
// Fica aqui e não no loadStage porque projectileStore e currentRunStore se importam (dependência circular).
watch(()=>useCurrentRunStore().currentStage,()=>store.cleanup(),{flush:'sync'});
const geometry=new PlaneGeometry(.8,1.9);geometry.rotateX(Math.PI/2);geometry.translate(0,0,-.45);
const orbGeometry=new PlaneGeometry(.72,.72);orbGeometry.rotateX(Math.PI/2);
// 7 = lança da Colmeia (bola esticada, dourada), 8 = tiro da Colmeia (bola âmbar), 9 = tiro da Harpia (bola magenta)
const palette=['#38cfff','#82edff','#c7a3ff','#ffc777','#50caff','#ff719c','#ffbf66','#fff06a','#ffa53d','#ff5fb0','#ae7dff'];
const materials=palette.map((color,index)=>new ShaderMaterial({
 transparent:true,depthWrite:false,side:2,blending:AdditiveBlending,
 uniforms:{time:{value:0},tint:{value:new Color(color)},orb:{value:index===10?-1:index>=7?1:Math.max(0,index-3)}},
 vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
 fragmentShader:`
 varying vec2 v;uniform float time;uniform vec3 tint;uniform float orb;
 void main(){
  float alpha;float white;
  if(orb<-.5){
   float x=abs(v.x-.5);float tip=smoothstep(.04,.22,v.y)*(1.-smoothstep(.9,1.,v.y));
   float needle=exp(-x*x*3800.)*tip;
   float rails=exp(-pow((x-.052)*65.,2.))*tip*(.6+.4*sin(v.y*40.-time*32.));
   alpha=needle+rails*.6+exp(-x*x*210.)*tip*.2;white=needle;
  }else if(orb>2.5){
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
 const mesh=new InstancedMesh(i>=4&&i!==10?orbGeometry:geometry,material,480);
 mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;root.add(mesh);return mesh;
});
// Shared ribbon pool for rear curves and ricochet paths: no per-shot mesh creation.
const trailGeometry=new PlaneGeometry(1,1);trailGeometry.rotateX(Math.PI/2);
const trailMaterial=new MeshBasicMaterial({color:'#7beaff',transparent:true,opacity:.42,depthWrite:false,side:2,blending:AdditiveBlending});
const trails=new InstancedMesh(trailGeometry,trailMaterial,480*14);
trails.instanceMatrix.setUsage(DynamicDrawUsage);trails.frustumCulled=false;trails.count=0;root.add(trails);
const beamGeometry=new PlaneGeometry(1,1);beamGeometry.rotateX(-Math.PI/2);beamGeometry.translate(0,0,.5);
const beamMaterial=new ShaderMaterial({transparent:true,depthWrite:false,side:2,blending:AdditiveBlending,
 uniforms:{time:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 v;uniform float time;void main(){float x=abs(v.x-.5);
 float core=exp(-x*x*1800.);float aura=exp(-x*x*85.);
 float pulse=.8+.2*sin(v.y*65.-time*40.);float tip=smoothstep(0.,.025,v.y)*smoothstep(0.,.025,1.-v.y);
 float a=(core+aura*.5)*pulse*tip;if(a<.006)discard;
 gl_FragColor=vec4(mix(vec3(.12,.55,1.),vec3(.85,1.,1.),core),a);}`});
const beams=new InstancedMesh(beamGeometry,beamMaterial,32);beams.count=0;beams.frustumCulled=false;root.add(beams);
let time=0;
useLoop().onBeforeRender(({delta})=>{
 time+=Math.min(delta,.1);materials.forEach(m=>m.uniforms.time.value=time);
 beamMaterial.uniforms.time.value=time;let beamCount=0; const counts=Array(batches.length).fill(0);let trailCount=0;
 for(const p of store.projectiles){
  if(p.spawnDelay>0)continue;
  if(p.beam){
    const age=p.beamAge||0;const envelope=Math.min(1,age/.055)*Math.min(1,Math.max(0,(p.beamDuration-age)/.13));
    dummy.position.set(p.position.x,p.position.y,p.position.z);
    dummy.rotation.set(0,Math.atan2(p.direction.x,p.direction.z),0);
    dummy.scale.set(.6*envelope,1,p.beamLength||.01);dummy.updateMatrix();
    if(beamCount<32)beams.setMatrixAt(beamCount++,dummy.matrix);
    dummy.position.set(p.position.x+p.direction.x*(p.beamLength||0),p.position.y,p.position.z+p.direction.z*(p.beamLength||0));
    dummy.scale.set(.55*envelope,1,.3*envelope);dummy.updateMatrix();batches[3].setMatrixAt(counts[3]++,dummy.matrix);continue;
  }
  const tier=p.ownerType==='enemy'?(p.type==='enemyLance'?7:p.type==='hiveShot'?8:p.type==='harpyShot'?9:p.type==='enemyMissile'?6:p.type==='enemyPlasma'?5:4):p.burst?3:p.ion?10:p.echo?2:p.power>=2.5?3:p.power>=1.75?2:p.power>1?1:0;
  // Bolas inimigas crescem junto com a hitbox (tamanho padrão .22 = escala 1)
  const ball=tier===4||tier>=7;
  const size=p.ownerType==='enemy'?(ball?Math.max(1,(p.size||.22)/.22):1):1+Math.min(.55,Math.max(0,p.power-1)*.35);
  dummy.position.set(p.position.x,p.ownerType==='player'?(p.position.y??0):1,p.position.z);

  dummy.rotation.set(0,Math.atan2(p.direction.x,p.direction.z),0);
  dummy.scale.set(size,1,p.ownerType==='enemy'?(tier===7?size*1.9:tier===6?1.8:tier===5?1.35:size):p.ion?1.7:1+Math.min(.4,(p.power-1)*.2));
  dummy.updateMatrix();batches[tier].setMatrixAt(counts[tier]++,dummy.matrix);
  for(let i=1;i<p.trail.length;i++){
   const a=p.trail[i-1],b=p.trail[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   if(length<.001)continue;
   dummy.position.set((a.x+b.x)/2,p.ownerType==='player'?(p.position.y??0):.95,(a.z+b.z)/2);
   dummy.rotation.set(0,Math.atan2(dx,dz),0);
   dummy.scale.set((p.ricochet?.11:.07)*i/p.trail.length,1,length+.015);dummy.updateMatrix();
   trails.setMatrixAt(trailCount++,dummy.matrix);
  }
 }
 beams.count=beamCount;beams.instanceMatrix.needsUpdate=true; batches.forEach((mesh,i)=>{mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=true});
 trails.count=trailCount;trails.instanceMatrix.needsUpdate=true;
});
onUnmounted(()=>{
 beams.dispose();beamGeometry.dispose();beamMaterial.dispose(); batches.forEach(mesh=>mesh.dispose());trails.dispose();
 geometry.dispose();orbGeometry.dispose();trailGeometry.dispose();trailMaterial.dispose();
 materials.forEach(m=>m.dispose());store.cleanup();
});
</script>
<template><primitive :object="root" /></template>
