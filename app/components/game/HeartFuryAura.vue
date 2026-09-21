<script setup lang="ts">
import { AdditiveBlending, Box3, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, Vector3 } from 'three';
import { usePlayerStats } from '~/stores/playerStats';
import { useCurrentRunStore } from '~/stores/currentRunStore';

// Fúria Carmesim: enquanto o bônus de dano dura, dois elétrons vermelhos giram rentes ao casco em
// planos cruzados, como um átomo, deixando um rastro curto que apaga logo atrás. Não é um anel nem
// um domo: nada fica parado em volta da nave.
// O raio sai do tamanho real do modelo na cena, então trocar asas ou a nave inteira mantém os
// elétrons colados — a chama dos motores fica de fora da medida porque estica com o acelerador.
const ELECTRONS = [
  { tilt: .95, yaw: .5, speed: 5.4, size: .34 },
  { tilt: -.8, yaw: -.7, speed: -4.2, size: .26 },
];
const TRAIL = 18; // amostras de rastro por elétron
const TRAIL_LIFE = .26; // segundos até a amostra sumir
const ANGLE_STEP = .16; // espaçamento máximo entre amostras: o rastro não picota se o fps cair
const HEAD_FADE = .12; // o elétron apaga neste tempo quando o bônus acaba
const FINAL_SECONDS = 1.2; // o efeito já vai esmaecendo antes de o bônus expirar
const TAU = Math.PI * 2;

const stats = usePlayerStats();
const run = useCurrentRunStore();
const { scene } = useTresContext();

// Um ponto por elétron (a cabeça) e TRAIL pontos de rastro, todos no mesmo Points aditivo
const SLOTS = ELECTRONS.length * (1 + TRAIL);
const positions = new Float32Array(SLOTS * 3);
const tints = new Float32Array(SLOTS * 3);
const radii = new Float32Array(SLOTS);
const opacities = new Float32Array(SLOTS);
const geometry = new BufferGeometry();
geometry.setAttribute('position', new BufferAttribute(positions, 3));
geometry.setAttribute('tint', new BufferAttribute(tints, 3));
geometry.setAttribute('radius', new BufferAttribute(radii, 1));
geometry.setAttribute('opacity', new BufferAttribute(opacities, 1));
// Mesmo ponto luminoso dos corações: disco suave com miolo claro, sem geometria de anel
const material = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: { screen: { value: 640 } },
  vertexShader: `attribute vec3 tint;attribute float radius;attribute float opacity;uniform float screen;varying vec3 c;varying float a;void main(){c=tint;a=opacity;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(radius*screen/max(1.,-p.z),1.,160.);}`,
  fragmentShader: `varying vec3 c;varying float a;void main(){float r=length(gl_PointCoord-.5)*2.;float mask=exp(-r*r*4.)*smoothstep(1.,.55,r);vec3 col=mix(c,vec3(1.),exp(-r*r*16.)*.85);gl_FragColor=vec4(col,mask*a);}`,
});
const points = new Points(geometry, material);
points.frustumCulled = false;
points.renderOrder = 3;
points.visible = false;

const HEAD_TINT = new Color('#ffdce1');
const TAIL_TINT = new Color('#ff1f3d');
ELECTRONS.forEach((_, index) => {
  const base = index * (1 + TRAIL);
  tints.set([HEAD_TINT.r, HEAD_TINT.g, HEAD_TINT.b], base * 3);
  for (let i = 1; i <= TRAIL; i++) tints.set([TAIL_TINT.r, TAIL_TINT.g, TAIL_TINT.b], (base + i) * 3);
});
geometry.getAttribute('tint').needsUpdate = true;

const orbits = ELECTRONS.map((electron, index) => ({
  ...electron,
  angle: index * Math.PI * .8,
  cursor: 0,
  trail: Array.from({ length: TRAIL }, () => ({ age: TRAIL_LIFE, x: 0, y: 0, z: 0 })),
}));

// Raio e altura medidos no casco de verdade; só refaz quando a aura acende
let radius = 0, center = .18, measured = false;
const box = new Box3(), part = new Box3(), size = new Vector3();
function expand(object: any) {
  // A chama dos motores muda de tamanho com o acelerador: fora da medida
  if (object.name === 'EnginePlumes' || object.visible === false) return;
  if (object.isMesh && object.geometry) {
    object.updateWorldMatrix(true, false);
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    part.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
    box.union(part);
  }
  for (const child of object.children) expand(child);
}
function measureShip() {
  const ship = scene.value?.getObjectByName('PlayerCharacter');
  if (!ship) return;
  box.makeEmpty();
  expand(ship);
  if (box.isEmpty()) return;
  box.getSize(size);
  if (size.x <= 0) return;
  // Rente à maior meia-largura do casco, com uma folga curta para o elétron não entrar no modelo
  radius = Math.max(size.x, size.z) * .5 + .12;
  center = (box.min.y + box.max.y) * .5 - run.getPlayerPosition().y;
  measured = true;
}

const offset = new Vector3();
function orbitPoint(orbit: typeof orbits[number], angle: number, yaw: number) {
  const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
  const y = -z * Math.sin(orbit.tilt), depth = z * Math.cos(orbit.tilt);
  const turn = orbit.yaw + yaw;
  offset.set(x * Math.cos(turn) + depth * Math.sin(turn), y, depth * Math.cos(turn) - x * Math.sin(turn));
}

let head = 0, wasActive = false; // head 0..1: o elétron acende ao pegar o coração e apaga no fim

useGameLoop().onBeforeRender(({ delta }) => {
  const active = stats.heartFuryActive;
  const dt = run.isPlaying ? Math.min(delta, .1) : 0;
  if (active && !measured) measureShip();
  if (!active && !wasActive && !points.visible) return;

  material.uniforms.screen!.value = window.innerHeight * Math.min(window.devicePixelRatio, 1.5) * 2;
  // Nos últimos segundos o brilho já cai sozinho; quando o bônus acaba, apaga depressa
  const target = active ? Math.min(1, stats.heartFuryTime / FINAL_SECONDS) : 0;
  // Coração pego com a aura apagada: acende na hora, sem subida
  head = active && !wasActive ? target : head + (target - head) * Math.min(1, dt / HEAD_FADE);
  wasActive = active;

  const player = run.getPlayerPosition();
  const yaw = run.getPlayerRotation().y;
  let alive = head > .01;

  orbits.forEach((orbit, index) => {
    const base = index * (1 + TRAIL);
    if (active && radius > 0) {
      // Amostras espaçadas pelo ângulo percorrido: o rastro sai contínuo em qualquer fps e no Fast Game
      const from = orbit.angle;
      orbit.angle += orbit.speed * dt;
      const sweep = orbit.angle - from;
      const steps = Math.min(TRAIL, Math.max(1, Math.ceil(Math.abs(sweep) / ANGLE_STEP)));
      for (let step = 1; step <= steps; step++) {
        const progress = step / steps;
        orbitPoint(orbit, from + sweep * progress, yaw);
        const slot = orbit.trail[orbit.cursor++ % TRAIL]!;
        slot.age = dt * (1 - progress);
        slot.x = player.x + offset.x;
        slot.y = player.y + center + offset.y;
        slot.z = player.z + offset.z;
      }
      orbitPoint(orbit, orbit.angle, yaw);
      positions.set([player.x + offset.x, player.y + center + offset.y, player.z + offset.z], base * 3);
      radii[base] = orbit.size * (1 + .12 * Math.sin(orbit.angle * 3));
      opacities[base] = head;
      // Partida longa: sem dobrar o ângulo a precisão do seno derrete e o giro começa a tremer
      orbit.angle = ((orbit.angle % TAU) + TAU) % TAU;
    } else {
      opacities[base] = 0;
    }

    for (let i = 0; i < TRAIL; i++) {
      const slot = orbit.trail[i]!;
      const at = base + 1 + i;
      if (slot.age >= TRAIL_LIFE) { opacities[at] = 0; continue; }
      slot.age += dt;
      const fade = Math.max(0, 1 - slot.age / TRAIL_LIFE);
      positions.set([slot.x, slot.y, slot.z], at * 3);
      radii[at] = orbit.size * (.16 + fade * .78);
      // Sem o bônus o rastro continua apagando sozinho: some em TRAIL_LIFE, sem ficar preso na nave
      opacities[at] = Math.pow(fade, 1.5) * (active ? head : 1);
      alive = true;
    }
  });

  points.visible = alive;
  if (!alive) { head = 0; return; }
  for (const name of ['position', 'radius', 'opacity']) geometry.getAttribute(name).needsUpdate = true;
});

// Equipamento e nave só mudam entre partidas: a medida é refeita a cada sala carregada
watch(() => run.currentStage, () => { measured = false; });

onUnmounted(() => { geometry.dispose(); material.dispose(); });
</script>

<template>
  <primitive :object="points" />
</template>
