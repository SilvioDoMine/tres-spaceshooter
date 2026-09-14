<script setup lang="ts">
import {
  AdditiveBlending, CircleGeometry, Color, DynamicDrawUsage, Group, InstancedMesh, InstancedBufferAttribute,
  Mesh, MeshBasicMaterial, ShaderMaterial, Object3D, RingGeometry, SphereGeometry, TorusGeometry,
} from 'three';
import { useLoop } from '@tresjs/core';
import { useEquipmentEffectsStore } from '~/stores/useEquipmentEffectsStore';

const store = useEquipmentEffectsStore();
const root = new Group(), dummy = new Object3D();
const orbGeometry = new SphereGeometry(.34, 10, 7);
const orbMaterial = new MeshBasicMaterial({ color: new Color('#bd75ff'), transparent: true, opacity: .86, blending: AdditiveBlending, depthWrite: false });
const orbs = new InstancedMesh(orbGeometry, orbMaterial, 4);
orbs.instanceMatrix.setUsage(DynamicDrawUsage); orbs.frustumCulled = false; root.add(orbs);
const trailGeometry = new CircleGeometry(1, 14); trailGeometry.rotateX(-Math.PI / 2);
const trailLife = new InstancedBufferAttribute(new Float32Array(64), 1).setUsage(DynamicDrawUsage);
trailGeometry.setAttribute('life', trailLife);
const trailMaterial = new ShaderMaterial({ transparent:true, depthWrite:false, blending:AdditiveBlending, side:2,
  uniforms:{time:{value:0}},
  vertexShader:`attribute float life; varying vec2 p; varying vec2 field; varying float heatLife;
    void main(){p=uv*2.-1.;heatLife=life;vec4 world=instanceMatrix*vec4(position,1.);
      field=world.xz;gl_Position=projectionMatrix*modelViewMatrix*world;}`,
  fragmentShader:`varying vec2 p; varying vec2 field; varying float heatLife; uniform float time;
    float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){float r=length(p);
      // Shared world-space turbulence blends neighboring deposits without spiral stamps.
      vec2 flow=field*2.4+vec2(time*.22,-time*.35);
      float smoke=noise(flow)*.65+noise(flow*2.3)*.35;
      float edge=1.-smoothstep(.2,1.,r);
      float core=exp(-r*r*10.)*heatLife;
      vec3 col=mix(vec3(.65,.10,.025),vec3(1.,.38,.07),heatLife);
      col=mix(col,vec3(1.,.86,.45),core*.8);
      float alpha=edge*(.12+smoke*.16+core*.24)*heatLife;
      if(alpha<.003)discard;gl_FragColor=vec4(col,alpha);}` });
const orbCoreMaterial=new MeshBasicMaterial({color:'#f5e6ff',blending:AdditiveBlending,depthWrite:false});
const orbCores=new InstancedMesh(orbGeometry,orbCoreMaterial,4);orbCores.frustumCulled=false;root.add(orbCores);
const orbitRingGeometry=new TorusGeometry(.42,.018,5,20);
const orbitRings=new InstancedMesh(orbitRingGeometry,orbMaterial,8);orbitRings.frustumCulled=false;root.add(orbitRings);
const embers=new InstancedMesh(orbGeometry,orbCoreMaterial,192);embers.frustumCulled=false;embers.count=0;root.add(embers);
let time=0;
const trails = new InstancedMesh(trailGeometry, trailMaterial, 64);
trails.instanceMatrix.setUsage(DynamicDrawUsage); trails.frustumCulled = false; root.add(trails);
const flareGeometry = new RingGeometry(.75, 1, 48); flareGeometry.rotateX(-Math.PI / 2);
const flareMaterial = new MeshBasicMaterial({ color: '#ffd25a', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: 2 });
const flareMesh = new Mesh(flareGeometry, flareMaterial); flareMesh.visible = false; root.add(flareMesh);

useLoop().onBeforeRender(({delta}) => {
  if (useCurrentRunStore().isPlaying) time+=Math.min(delta,.05);
  trailMaterial.uniforms.time.value=time;
  orbCores.count=store.orbPositions.length;orbitRings.count=store.orbPositions.length*2;
  orbs.count = store.orbPositions.length;
  store.orbPositions.forEach((orb, index) => {
        dummy.position.set(orb.x,.15,orb.z);dummy.rotation.set(0,0,0);
    dummy.scale.setScalar(.85+.12*Math.sin(time*7+index));dummy.updateMatrix();orbs.setMatrixAt(index,dummy.matrix);
    dummy.scale.setScalar(.4);dummy.updateMatrix();orbCores.setMatrixAt(index,dummy.matrix);
    for(let band=0;band<2;band++){
      dummy.scale.setScalar(1);dummy.rotation.set(time*1.6+index,band*Math.PI/2+time,.5);
      dummy.updateMatrix();orbitRings.setMatrixAt(index*2+band,dummy.matrix);
    }
  });
  orbs.instanceMatrix.needsUpdate = true; orbCores.instanceMatrix.needsUpdate=true; orbitRings.instanceMatrix.needsUpdate=true;
  trails.count = store.trail.length;embers.count=store.trail.length*3;
  store.trail.forEach((point, index) => {
    const fade = Math.max(0, point.ttl / point.maxTtl);
    trailLife.setX(index, fade);
    dummy.position.set(point.x, .16, point.z); dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(point.width * fade); dummy.updateMatrix(); trails.setMatrixAt(index, dummy.matrix);
    for(let i=0;i<3;i++){
      const age=point.maxTtl-point.ttl;const angle=point.id*2.399+i*2.094;
      dummy.position.set(point.x+Math.cos(angle)*point.width*fade*.65,.18+age*.08,point.z+Math.sin(angle)*point.width*fade*.65);
      dummy.scale.setScalar(fade*.07*(.7+.3*Math.sin(time*5+point.id+i)));dummy.updateMatrix();embers.setMatrixAt(index*3+i,dummy.matrix);
    }
  });
  trailLife.needsUpdate=true;trails.instanceMatrix.needsUpdate = true;embers.instanceMatrix.needsUpdate=true;
  const flare = store.flare;
  flareMesh.visible = !!flare;
  if (flare) {
    const progress = 1 - flare.ttl / flare.maxTtl;
    flareMesh.position.set(flare.x, .28, flare.z);
    flareMesh.scale.setScalar(1 + progress * 8);
    flareMaterial.opacity = (1 - progress) * .82;
  }
});
onUnmounted(() => {
  embers.dispose();orbCores.dispose();orbitRings.dispose();orbitRingGeometry.dispose();orbCoreMaterial.dispose();orbs.dispose(); trails.dispose(); orbGeometry.dispose(); trailGeometry.dispose();
  orbMaterial.dispose(); trailMaterial.dispose(); flareGeometry.dispose(); flareMaterial.dispose();
});
</script>

<template><TresGroup><primitive :object="root" /><GameEquipmentFeedback /></TresGroup></template>
