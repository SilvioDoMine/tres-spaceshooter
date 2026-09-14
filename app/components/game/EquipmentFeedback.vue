<script setup lang="ts">
import {Group,InstancedMesh,PlaneGeometry,ShaderMaterial,AdditiveBlending,Object3D,Color} from 'three';
const store=useEquipmentEffectsStore(),run=useCurrentRunStore();
const root=new Group(),dummy=new Object3D();
const geo=new PlaneGeometry(2,2);geo.rotateX(-Math.PI/2);
const material=new ShaderMaterial({transparent:true,depthWrite:false,side:2,blending:AdditiveBlending,vertexColors:true,
 uniforms:{time:{value:0}},vertexShader:`varying vec2 p;varying vec3 tint;void main(){p=uv*2.-1.;tint=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 p;varying vec3 tint;uniform float time;void main(){float r=length(p);float a=atan(p.y,p.x);
 float ring=exp(-pow((r-.8)*32.,2.));float arcs=pow(.5+.5*sin(a*6.-time*3.),7.);
 float haze=exp(-r*r*5.)*.12;float alpha=(ring*(.12+arcs*.65)+haze)*(1.-smoothstep(.9,1.,r));
 if(alpha<.006)discard;gl_FragColor=vec4(tint,alpha);}`});
const rings=new InstancedMesh(geo,material,48);rings.frustumCulled=false;rings.count=0;root.add(rings);
const color=new Color();let time=0;
// Cria o buffer de cor já na montagem: sem ele o three compila o shader sem declarar instanceColor
rings.setColorAt(0,color);
useGameLoop().onBeforeRender(({delta})=>{
 if(run.isPlaying)time+=Math.min(delta,.1);material.uniforms.time.value=time;
 let count=0;const player=run.getPlayerPosition();
 function place(x:number,z:number,r:number,tint:string,intensity=1){if(count>=48)return;dummy.position.set(x,.2,z);dummy.rotation.set(0,0,0);dummy.scale.set(r,1,r);dummy.updateMatrix();rings.setMatrixAt(count,dummy.matrix);rings.setColorAt(count++,color.set(tint).multiplyScalar(intensity));}
 if(store.effects.aegisCooldown>0 && store.shieldCooldown===0)place(player.x,player.z,1.05,'#70dfff',.3);
 if(store.attackSpeedBuffTime>0)place(player.x,player.z,.8,'#ffc357',.6);
 if(store.regenerating)place(player.x,player.z,.75+(time%1)*.5,'#63ffb1',1-(time%1)*.7);
 if(store.effects.vortexSlowPercent>0)place(player.x,player.z,store.effects.vortexRadius/.8,'#aa79ef',.22);
 for(const event of store.feedback){const t=1-event.ttl/.55;
   if(event.kind==='reflect'&&event.to){
     // A visible return pulse travels along the reflected-damage direction.
     for(let i=0;i<3;i++){const u=Math.max(0,t-i*.08);place(event.from.x+(event.to.x-event.from.x)*u,event.from.z+(event.to.z-event.from.z)*u,.18,'#e1aaff',1-i*.25);}
   }else place(event.from.x,event.from.z,1.1+t*.55,'#9eeaff',1-t);
 }
 rings.count=count;rings.instanceMatrix.needsUpdate=true;if(rings.instanceColor)rings.instanceColor.needsUpdate=true;
});
onUnmounted(()=>{rings.dispose();geo.dispose();material.dispose();});
</script>
<template><primitive :object="root" /></template>
