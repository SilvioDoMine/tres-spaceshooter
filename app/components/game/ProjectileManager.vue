<script setup lang="js">
import { storeToRefs } from 'pinia';
import { PlaneGeometry, ShaderMaterial, AdditiveBlending, Color } from 'three';
const geometry=new PlaneGeometry(.8,1.9);geometry.rotateX(Math.PI/2);geometry.translate(0,0,-.45);
const materials=['#38cfff','#ff743e'].map(color=>new ShaderMaterial({
 transparent:true,depthWrite:false,blending:AdditiveBlending,
 uniforms:{t:{value:0},tint:{value:new Color(color)}},
 vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`
 varying vec2 v;uniform float t;uniform vec3 tint;
 void main(){
   float x=abs(v.x-.5);
   float head=exp(-pow(x*14.,2.)-pow((v.y-.74)*12.,2.));
   float envelope=smoothstep(.04,.62,v.y)*(1.-smoothstep(.74,.96,v.y));
   float core=exp(-x*x*1600.)*envelope;
   float trail=exp(-x*x*210.)*envelope*(.86+.14*sin(t*18.));
   float edge=smoothstep(0.,.08,v.y)*(1.-smoothstep(.92,1.,v.y));
   edge*=1.-smoothstep(.32,.48,x);
   float a=clamp((head*.85+core+trail*.55)*edge,0.,1.);
   if(a<.008)discard;
   gl_FragColor=vec4(mix(tint,vec3(1.),clamp(core+head*.7,0.,1.)),a);
 }`
}));
// The projectile plane faces downward; render both faces for the overhead camera.
materials.forEach(material => { material.side = 2 });
let time=0;

import { useLoop } from '@tresjs/core';
import { useProjectileStore, projectilesType } from '~/stores/projectileStore';

const projectileStore = useProjectileStore();
// ✅ Usa storeToRefs para garantir reatividade correta com shallowRef
const { projectiles: activeProjectiles } = storeToRefs(projectileStore);

// Map para armazenar refs dos meshes de cada projétil
// Chave: projectile.id, Valor: mesh ref
const projectileRefs = new Map();

// Função para setar ref do mesh
const setProjectileMeshRef = (projectileId) => (el) => {
  if (el) {
    projectileRefs.set(projectileId, el);
  }
};

// ==================== GAME LOOP (60 FPS) ====================
const { onBeforeRender } = useLoop();
onBeforeRender(({delta}) => {
  time+=Math.min(delta,.1);materials.forEach(m=>m.uniforms.t.value=time);
  // ✅ Verificação defensiva: garante que activeProjectiles.value existe
  if (!activeProjectiles.value) return;

  activeProjectiles.value.forEach(projectile => {
    const mesh = projectileRefs.get(projectile.id);
    if (!mesh) return;

    // ✅ MUTAÇÃO DIRETA: Atualiza posição sem disparar reatividade
    mesh.position.set(projectile.position.x, 1, projectile.position.z);
    mesh.rotation.y = Math.atan2(projectile.direction.x, projectile.direction.z);
  });

  // Limpa refs de projéteis removidos
  const activeIds = new Set(activeProjectiles.value.map(p => p.id));
  for (const [id] of projectileRefs) {
    if (!activeIds.has(id)) {
      projectileRefs.delete(id);
    }
  }
});

onUnmounted(() => {
  geometry.dispose();materials.forEach(m=>m.dispose());
  projectileStore.cleanup();
  projectileRefs.clear();
});
</script>

<template>
  <TresGroup>
    <TresGroup
      v-for="projectile in activeProjectiles"
      :key="projectile.id"
      :ref="setProjectileMeshRef(projectile.id)"
      :name="`projectile-${projectile.id}`"
    >
      <TresMesh :geometry="geometry" :material="materials[projectile.ownerType==='player'?0:1]" />
    </TresGroup>
  </TresGroup>
</template>
