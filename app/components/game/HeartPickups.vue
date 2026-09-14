<script setup lang="ts">
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, ExtrudeGeometry, InstancedMesh, MeshStandardMaterial, Object3D, Points, ShaderMaterial, Shape } from 'three';
import { useHeartStore } from '~/stores/useHeartStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

// Coração de cura: miolo 3D vermelho batendo, halo brilhante embaixo e faíscas saindo dele.
// A câmera olha de cima, então o coração fica deitado de frente para ela e balança para mostrar o volume.
const MAX_HEARTS = 32;
const SPARKS = 192;
const SPARK_RATE = 6; // faíscas por segundo, por coração
const BURST_SPARKS = 14; // faíscas do brilho quando o coração entra na nave
const FLASH_LIFE = .3;
const store = useHeartStore();
const run = useCurrentRunStore();

const shape = new Shape();
shape.moveTo(0, -.5);
shape.bezierCurveTo(-1, .1, -.65, .8, 0, .35);
shape.bezierCurveTo(.65, .8, 1, .1, 0, -.5);
// Bevel largo e arredondado deixa o coração "estufado" em vez de uma placa recortada
const geometry = new ExtrudeGeometry(shape, { depth: .1, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: .16, bevelThickness: .2, curveSegments: 18 });
geometry.center();
geometry.rotateX(-Math.PI / 2);
const material = new MeshStandardMaterial({ color: '#ff2340', emissive: '#d4002a', emissiveIntensity: .55, roughness: .2, metalness: .15 });
const mesh = new InstancedMesh(geometry, material, MAX_HEARTS);
mesh.instanceMatrix.setUsage(DynamicDrawUsage);
mesh.frustumCulled = false;
mesh.count = 0;

// Halos (um por coração, índices 0..MAX_HEARTS-1), brilho da coleta (MAX_HEARTS) e faíscas (resto) num único Points aditivo
const FLASH = MAX_HEARTS;
const total = MAX_HEARTS + 1 + SPARKS;
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

const haloColor = new Color('#ff1a3c');
for (let i = 0; i <= FLASH; i++) tints.set([haloColor.r, haloColor.g, haloColor.b], i * 3);
const sparkColors = [new Color('#ff3b5c'), new Color('#ffc2cf')];
const sparks = Array.from({ length: SPARKS }, (_, i) => ({ index: FLASH + 1 + i, age: 1, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0 }));
let sparkCursor = 0, tintDirty = true, flashAge = FLASH_LIFE;

// burst: faísca curta e rápida em leque, usada quando o coração entra na nave
function spark(x: number, y: number, z: number, burst = false) {
  const s = sparks[sparkCursor++ % SPARKS]!;
  const angle = Math.random() * Math.PI * 2, offset = .15 + Math.random() * .15;
  const speed = burst ? 2.2 + Math.random() * 1.4 : .5 + Math.random() * .7;
  Object.assign(s, {
    age: 0, life: burst ? .25 + Math.random() * .2 : .5 + Math.random() * .45,
    x: x + Math.cos(angle) * offset, y: y + .1, z: z + Math.sin(angle) * offset,
    vx: Math.cos(angle) * speed, vy: burst ? .3 + Math.random() * .4 : .8 + Math.random() * .6, vz: Math.sin(angle) * speed,
    size: burst ? .35 + Math.random() * .2 : .3 + Math.random() * .25,
  });
  const color = sparkColors[Math.random() < .35 ? 1 : 0]!;
  tints.set([color.r, color.g, color.b], s.index * 3);
  tintDirty = true;
}

const dummy = new Object3D();
let time = 0;
useGameLoop().onBeforeRender(({ delta }) => {
  // Pausado: tudo congela no lugar
  const dt = run.isPlaying ? Math.min(delta, .1) : 0;
  time += dt;
  glowMaterial.uniforms.screen!.value = window.innerHeight * Math.min(window.devicePixelRatio, 1.5) * 2;

  const hearts = store.hearts;
  mesh.count = hearts.length;
  for (let i = 0; i < MAX_HEARTS; i++) {
    const heart = hearts[i];
    if (!heart) { opacities[i] = 0; continue; }
    // Batida curta e forte, defasada por coração
    const beat = Math.pow(Math.max(0, Math.sin(time * 4.5 + heart.id)), 6);
    // Em voo até a nave: desce para a altura dela, encolhe e o halo apaga, como se entrasse no casco
    const flight = Math.max(0, heart.flight), shrink = 1 - flight * .85;
    const y = (.45 + Math.sin(time * 2 + heart.id) * .08) * (1 - flight) + .25 * flight;
    dummy.position.set(heart.x, y, heart.z);
    dummy.rotation.set(0, flight * Math.PI * 2, Math.sin(time * 1.8 + heart.id) * .6 * (1 - flight));
    dummy.scale.setScalar(.4 * (1 + beat * .2) * shrink);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    positions.set([heart.x, y - .3, heart.z], i * 3);
    radii[i] = 1.6 * (1 + beat * .3) * shrink;
    opacities[i] = (.5 + beat * .4) * (1 - flight);

    if (heart.flight < 0 && Math.random() < dt * SPARK_RATE) spark(heart.x, y, heart.z);
  }

  for (const burst of store.consumeBursts()) {
    flashAge = 0;
    for (let i = 0; i < BURST_SPARKS; i++) spark(burst.x, .25, burst.z, true);
  }
  // Brilho rápido acompanhando a nave depois que o coração entra
  if (flashAge < FLASH_LIFE) {
    flashAge += dt;
    const t = Math.min(1, flashAge / FLASH_LIFE), player = run.getPlayerPosition();
    positions.set([player.x, .1, player.z], FLASH * 3);
    radii[FLASH] = 1.2 + t * 1.6;
    opacities[FLASH] = Math.pow(1 - t, 1.5) * .9;
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
    radii[s.index] = s.size * (1 - t * .6);
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
