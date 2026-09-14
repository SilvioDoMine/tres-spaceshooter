<script setup lang="ts">
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, InstancedMesh, LatheGeometry, MeshStandardMaterial, Object3D, Points, ShaderMaterial, Vector2 } from 'three';
import { useLoop } from '@tresjs/core';
import { useCoinStore } from '~/stores/useCoinStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

// Moedinha de ouro: disco 3D com borda alta girando no chão, halo dourado fraco e um brilho de vez em quando.
// Deitada de frente para a câmera de cima; o giro no próprio eixo mostra a espessura e faz o metal piscar.
const MAX_COINS = 96;
const COIN_SCALE = .18; // halo e cintilada acompanham o tamanho da moeda
const SPARKS = 160;
const GLINT_RATE = 1.2; // brilhos por segundo, por moeda
const BURST_SPARKS = 6; // faíscas quando a moeda entra na nave
const FLASH_LIFE = .22;
const store = useCoinStore();
const run = useCurrentRunStore();

// Perfil de meia moeda (raio, altura) girado no eixo Y: miolo rebaixado e borda saltada
const profile = [[0, .06], [.34, .06], [.4, .1], [.5, .1], [.53, .06], [.53, -.06], [.5, -.1], [.4, -.1], [.34, -.06], [0, -.06]];
const geometry = new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 28);
geometry.computeVertexNormals();
const material = new MeshStandardMaterial({ color: '#ffc53a', emissive: '#e08a00', emissiveIntensity: .45, roughness: .25, metalness: .55 });
const mesh = new InstancedMesh(geometry, material, MAX_COINS);
mesh.instanceMatrix.setUsage(DynamicDrawUsage);
mesh.frustumCulled = false;
mesh.count = 0;

// Halos (um por moeda, índices 0..MAX_COINS-1), brilho da coleta (MAX_COINS) e faíscas (resto) num único Points aditivo
const FLASH = MAX_COINS;
const total = MAX_COINS + 1 + SPARKS;
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

const haloColor = new Color('#ffb020');
for (let i = 0; i <= FLASH; i++) tints.set([haloColor.r, haloColor.g, haloColor.b], i * 3);
const sparkColors = [new Color('#ffd24a'), new Color('#fff4c2')];
const sparks = Array.from({ length: SPARKS }, (_, i) => ({ index: FLASH + 1 + i, age: 1, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0 }));
let sparkCursor = 0, tintDirty = true, flashAge = FLASH_LIFE;

// glint: estrelinha parada em cima da moeda; burst: faísca rápida em leque quando entra na nave
function spark(x: number, y: number, z: number, burst = false) {
  const s = sparks[sparkCursor++ % SPARKS]!;
  const angle = Math.random() * Math.PI * 2, offset = burst ? .1 : Math.random() * COIN_SCALE / 3;
  const speed = burst ? 1.8 + Math.random() * 1.2 : 0;
  Object.assign(s, {
    age: 0, life: burst ? .2 + Math.random() * .15 : .22 + Math.random() * .12,
    x: x + Math.cos(angle) * offset, y: y + .08, z: z + Math.sin(angle) * offset,
    vx: Math.cos(angle) * speed, vy: burst ? .3 + Math.random() * .3 : .15, vz: Math.sin(angle) * speed,
    size: burst ? .25 + Math.random() * .12 : (.3 + Math.random() * .15) * COIN_SCALE / .36,
  });
  const color = sparkColors[burst ? (Math.random() < .4 ? 1 : 0) : 1]!;
  tints.set([color.r, color.g, color.b], s.index * 3);
  tintDirty = true;
}

const dummy = new Object3D();
let time = 0;
useLoop().onBeforeRender(({ delta }) => {
  // Pausado: tudo congela no lugar
  const dt = run.isPlaying ? Math.min(delta, .1) : 0;
  time += dt;
  glowMaterial.uniforms.screen!.value = window.innerHeight * Math.min(window.devicePixelRatio, 1.5) * 2;

  const coins = store.coins;
  mesh.count = Math.min(coins.length, MAX_COINS);
  for (let i = 0; i < MAX_COINS; i++) {
    const coin = coins[i];
    if (!coin) { opacities[i] = 0; continue; }
    const flight = Math.max(0, coin.flight), shrink = 1 - flight * .7;
    // Pulinho saindo do inimigo, depois flutua baixinho; em voo sobe um pouco no meio do caminho
    const hopArc = coin.flight < 0 ? Math.sin(coin.hop * Math.PI) * .9 : 0;
    const rest = .28 + Math.sin(time * 2.4 + coin.id) * .04;
    const y = rest + hopArc + Math.sin(flight * Math.PI) * .5;
    // Gira rápido no voo, devagar parada; o pulinho gira junto
    const spin = time * (3 + flight * 14) + coin.id + coin.hop * Math.PI * 3;
    dummy.position.set(coin.x, y, coin.z);
    dummy.rotation.set(.35, coin.id, spin);
    dummy.scale.setScalar(COIN_SCALE * shrink);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    // Halo pulsa com o giro: mais forte quando a face está virada para a câmera
    const face = Math.abs(Math.cos(spin));
    positions.set([coin.x, y - .2, coin.z], i * 3);
    radii[i] = COIN_SCALE * 2.5 * shrink;
    opacities[i] = (.18 + face * .22) * (1 - flight);

    if (coin.flight < 0 && coin.hop >= 1 && Math.random() < dt * GLINT_RATE) spark(coin.x, y, coin.z);
  }

  for (const burst of store.consumeBursts()) {
    flashAge = 0;
    for (let i = 0; i < BURST_SPARKS; i++) spark(burst.x, .25, burst.z, true);
  }
  // Brilho rápido acompanhando a nave depois que a moeda entra
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
    // Glint cresce e some rápido (cintila); faísca só encolhe
    radii[s.index] = s.size * (s.vx || s.vz ? 1 - t * .6 : Math.sin(t * Math.PI));
    opacities[s.index] = Math.pow(1 - t, 1.3);
  }

  mesh.instanceMatrix.needsUpdate = true;
  for (const name of ['position', 'radius', 'opacity']) glowGeometry.getAttribute(name).needsUpdate = true;
  if (tintDirty) { glowGeometry.getAttribute('tint').needsUpdate = true; tintDirty = false; }
});
onUnmounted(() => { mesh.dispose(); geometry.dispose(); material.dispose(); glowGeometry.dispose(); glowMaterial.dispose(); });
</script>

<template>
  <primitive :object="mesh" />
  <primitive :object="glow" />
</template>
