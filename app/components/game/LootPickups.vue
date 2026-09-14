<script setup lang="ts">
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, InstancedMesh, LatheGeometry, MeshStandardMaterial, Object3D, OctahedronGeometry, Points, ShaderMaterial, Vector2, type Material } from 'three';
import { useLoop } from '@tresjs/core';
import { useLootStore, type LootKind } from '~/stores/useLootStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

// Espólio no chão: moedinhas de ouro e pedrinhas de EXP girando, com halo fraco e uma cintilada de vez em quando.
// Deitadas de frente para a câmera de cima; o giro no próprio eixo mostra o volume e faz o material piscar.
const MAX_LOOT = 160;
const SPARKS = 200;
const PIECE_SCALE = .18; // moeda e pedrinha têm o mesmo tamanho; halo e cintilada acompanham
const GLINT_RATE = 1.2; // cintiladas por segundo, por peça
const BURST_SPARKS = 5; // faíscas quando a peça entra na nave
const FLASH_LIFE = .22;
const store = useLootStore();
const run = useCurrentRunStore();

// Moeda: perfil de meia moeda (raio, altura) girado no eixo Y, miolo rebaixado e borda saltada
const profile = [[0, .06], [.34, .06], [.4, .1], [.5, .1], [.53, .06], [.53, -.06], [.5, -.1], [.4, -.1], [.34, -.06], [0, -.06]];
const coinGeometry = new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 28);
coinGeometry.computeVertexNormals();
const coinMaterial = new MeshStandardMaterial({ color: '#ffc53a', emissive: '#e08a00', emissiveIntensity: .45, roughness: .25, metalness: .55 });
// Pedrinha de EXP: octaedro esticado em losango, facetado para os lados piscarem ao girar
const gemGeometry = new OctahedronGeometry(.5);
gemGeometry.scale(.62, .45, 1.1);
const gemMaterials = [
  new MeshStandardMaterial({ color: '#4fb3ff', emissive: '#1a6dff', emissiveIntensity: .6, roughness: .15, metalness: .1, flatShading: true }),
  new MeshStandardMaterial({ color: '#d28bff', emissive: '#9b2cff', emissiveIntensity: .7, roughness: .15, metalness: .1, flatShading: true }),
];
function instanced(geometry: BufferGeometry, material: Material) {
  const mesh = new InstancedMesh(geometry, material, MAX_LOOT);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.count = 0;
  return mesh;
}
const coinMesh = instanced(coinGeometry, coinMaterial);
const gemMeshes = gemMaterials.map(material => instanced(gemGeometry, material));

// Halos (um por peça, índices 0..MAX_LOOT-1), brilho da coleta (MAX_LOOT) e faíscas (resto) num único Points aditivo
const FLASH = MAX_LOOT;
const total = MAX_LOOT + 1 + SPARKS;
const positions = new Float32Array(total * 3), tints = new Float32Array(total * 3), radii = new Float32Array(total), opacities = new Float32Array(total);
const glowGeometry = new BufferGeometry();
glowGeometry.setAttribute('position', new BufferAttribute(positions, 3));
glowGeometry.setAttribute('tint', new BufferAttribute(tints, 3));
glowGeometry.setAttribute('radius', new BufferAttribute(radii, 1));
glowGeometry.setAttribute('opacity', new BufferAttribute(opacities, 1));
const glowMaterial = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: { screen: { value: 640 } },
  vertexShader: `attribute vec3 tint;attribute float radius;attribute float opacity;uniform float screen;varying vec3 c;varying float a;void main(){c=tint;a=opacity;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(radius*screen/max(1.,-p.z),1.,160.);}`,
  fragmentShader: `varying vec3 c;varying float a;void main(){float r=length(gl_PointCoord-.5)*2.;float mask=exp(-r*r*4.)*smoothstep(1.,.6,r);vec3 col=mix(c,vec3(1.),exp(-r*r*18.)*.8);gl_FragColor=vec4(col,mask*a);}`,
});
const glow = new Points(glowGeometry, glowMaterial);
glow.frustumCulled = false;
glow.renderOrder = 3;

// Cor do halo e das faíscas por tipo de peça
const STYLES = {
  coin: { halo: new Color('#ffb020'), sparks: [new Color('#ffd24a'), new Color('#fff4c2')] },
  exp: { halo: new Color('#2f8bff'), sparks: [new Color('#5fb8ff'), new Color('#d6f0ff')] },
  expBig: { halo: new Color('#b44bff'), sparks: [new Color('#c77dff'), new Color('#f3dcff')] },
};
const styleOf = (kind: LootKind, tier: number) => kind === 'coin' ? STYLES.coin : tier ? STYLES.expBig : STYLES.exp;

const sparks = Array.from({ length: SPARKS }, (_, i) => ({ index: FLASH + 1 + i, age: 1, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, glint: false }));
let sparkCursor = 0, flashAge = FLASH_LIFE;

// glint: estrelinha parada em cima da peça; burst: faísca rápida em leque quando entra na nave
function spark(x: number, y: number, z: number, colors: Color[], burst = false) {
  const s = sparks[sparkCursor++ % SPARKS]!;
  const angle = Math.random() * Math.PI * 2, offset = burst ? .1 : Math.random() * PIECE_SCALE / 3;
  const speed = burst ? 1.8 + Math.random() * 1.2 : 0;
  Object.assign(s, {
    age: 0, life: burst ? .2 + Math.random() * .15 : .22 + Math.random() * .12, glint: !burst,
    x: x + Math.cos(angle) * offset, y: y + .08, z: z + Math.sin(angle) * offset,
    vx: Math.cos(angle) * speed, vy: burst ? .3 + Math.random() * .3 : .15, vz: Math.sin(angle) * speed,
    size: burst ? .25 + Math.random() * .12 : (.3 + Math.random() * .15) * PIECE_SCALE / .36,
  });
  const color = colors[burst ? (Math.random() < .4 ? 1 : 0) : 1]!;
  tints.set([color.r, color.g, color.b], s.index * 3);
}

const dummy = new Object3D();
let time = 0;
useLoop().onBeforeRender(({ delta }) => {
  // Pausado: tudo congela no lugar
  const dt = run.isPlaying ? Math.min(delta, .1) : 0;
  time += dt;
  glowMaterial.uniforms.screen!.value = window.innerHeight * Math.min(window.devicePixelRatio, 1.5) * 2;

  const items = store.loot;
  let coins = 0;
  const gems = [0, 0];
  for (let i = 0; i < MAX_LOOT; i++) {
    const item = items[i];
    if (!item) { opacities[i] = 0; continue; }
    const style = styleOf(item.kind, item.tier);
    const flight = Math.max(0, item.flight), shrink = 1 - flight * .7;
    // Pulinho saindo do inimigo, depois flutua baixinho; em voo sobe um pouco no meio do caminho
    const hopArc = item.flight < 0 ? Math.sin(item.hop * Math.PI) * .9 : 0;
    const rest = .28 + Math.sin(time * 2.4 + item.id) * .04;
    const y = rest + hopArc + Math.sin(flight * Math.PI) * .5;
    // Gira rápido no voo, devagar parada; o pulinho gira junto. Losangos giram no eixo comprido, todos apontando quase igual
    const spin = time * ((item.kind === 'coin' ? 3 : 1.8) + flight * 14) + item.id + item.hop * Math.PI * 3;
    dummy.position.set(item.x, y, item.z);
    if (item.kind === 'coin') dummy.rotation.set(.35, item.id, spin);
    else dummy.rotation.set(-.5, Math.sin(item.id) * .4, spin);
    dummy.scale.setScalar(PIECE_SCALE * shrink);
    dummy.updateMatrix();
    if (item.kind === 'coin') coinMesh.setMatrixAt(coins++, dummy.matrix);
    else gemMeshes[item.tier]!.setMatrixAt(gems[item.tier]!++, dummy.matrix);

    // Halo pulsa com o giro: mais forte quando a face está virada para a câmera
    const face = Math.abs(Math.cos(spin));
    positions.set([item.x, y - .2, item.z], i * 3);
    tints.set([style.halo.r, style.halo.g, style.halo.b], i * 3);
    radii[i] = PIECE_SCALE * 2.5 * shrink;
    opacities[i] = (.18 + face * .22) * (1 - flight);

    if (item.flight < 0 && item.hop >= 1 && Math.random() < dt * GLINT_RATE) spark(item.x, y, item.z, style.sparks);
  }
  coinMesh.count = coins;
  gemMeshes.forEach((mesh, tier) => { mesh.count = gems[tier]!; });

  for (const burst of store.consumeBursts()) {
    flashAge = 0;
    const style = styleOf(burst.kind, burst.tier);
    tints.set([style.halo.r, style.halo.g, style.halo.b], FLASH * 3);
    for (let i = 0; i < BURST_SPARKS; i++) spark(burst.x, .25, burst.z, style.sparks, true);
  }
  // Brilho rápido acompanhando a nave depois que a peça entra
  if (flashAge < FLASH_LIFE) {
    flashAge += dt;
    const t = Math.min(1, flashAge / FLASH_LIFE), player = run.getPlayerPosition();
    positions.set([player.x, .1, player.z], FLASH * 3);
    radii[FLASH] = .9 + t * 1.1;
    opacities[FLASH] = Math.pow(1 - t, 1.5) * .7;
  } else {
    opacities[FLASH] = 0;
  }

  for (const s of sparks) {
    if (s.age >= s.life) { opacities[s.index] = 0; continue; }
    s.age += dt;
    const t = Math.min(1, s.age / s.life);
    const drag = Math.exp(-dt * 2);
    s.vx *= drag; s.vz *= drag;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    positions.set([s.x, s.y, s.z], s.index * 3);
    // Cintilada cresce e some rápido; faísca só encolhe
    radii[s.index] = s.size * (s.glint ? Math.sin(t * Math.PI) : 1 - t * .6);
    opacities[s.index] = Math.pow(1 - t, 1.3);
  }

  for (const mesh of [coinMesh, ...gemMeshes]) mesh.instanceMatrix.needsUpdate = true;
  // Halos trocam de cor conforme a lista muda, então o tint sobe todo frame
  for (const name of ['position', 'tint', 'radius', 'opacity']) glowGeometry.getAttribute(name).needsUpdate = true;
});
onUnmounted(() => {
  for (const mesh of [coinMesh, ...gemMeshes]) mesh.dispose();
  coinGeometry.dispose(); coinMaterial.dispose(); gemGeometry.dispose();
  for (const material of gemMaterials) material.dispose();
  glowGeometry.dispose(); glowMaterial.dispose();
});
</script>

<template>
  <primitive :object="coinMesh" />
  <primitive v-for="(mesh, tier) in gemMeshes" :key="tier" :object="mesh" />
  <primitive :object="glow" />
</template>
