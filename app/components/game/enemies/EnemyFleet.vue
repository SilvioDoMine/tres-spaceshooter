<script setup lang="js">
import { AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, SphereGeometry } from 'three';
import { loadFleetModel } from '~/utils/enemyFleetLoader';
import { ENEMY_FLEET, fleetScale, fleetHeading, fleetRotorAngle, fleetSockets, fleetSocketWorld } from '~/utils/enemyFleet';
import { attackProfile } from '~/utils/combatPatterns';

const props = defineProps({ enemy: Object, baseStats: Object, setVisualMeshRef: Function, preview: Boolean });
const run = useCurrentRunStore();
const root = new Group(), effects = new Group();
root.name = 'enemy-hull';
let outer, release, disposed = false, time = 0;
const rotors = [], doors = [], glows = [], flashes = [], warnings = [];
function bind(el) { outer = el; if (el) props.setVisualMeshRef(props.enemy.id)(el); }
const flashGeometry = new SphereGeometry(.07, 8, 6);
const warningGeometry = new PlaneGeometry(1, 1);
warningGeometry.rotateX(-Math.PI / 2); warningGeometry.translate(0, 0, -.5);
const flashMaterial = new MeshBasicMaterial({ color: '#fff3c6', transparent: true, opacity: .85, depthWrite: false });
// Mira do feixe. Antes era um retângulo rosa chapado, que na tela lia como um
// bloco sólido saindo do canhão; agora é um fio de mira com núcleo fino, halo
// que desvanece ao longo do alcance e pulso que aperta conforme a carga sobe.
const warningMaterial = new ShaderMaterial({
  transparent: true, depthWrite: false, side: 2, blending: AdditiveBlending,
  uniforms: { time: { value: 0 }, charge: { value: 0 }, tint: { value: new Color('#ff6f92') } },
  vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec2 v;uniform float time;uniform float charge;uniform vec3 tint;
  void main(){
   float x = abs(v.x - .5) * 2.;
   // O fio afina conforme a carga sobe: mira frouxa vira mira travada.
   float core = exp(-x * x * mix(60., 320., charge));
   float halo = exp(-x * x * 7.) * .28;
   // Some perto do alvo, para não virar uma barra maciça atravessando a tela.
   float fade = smoothstep(0., .12, v.y) * (1. - smoothstep(.55, 1., v.y));
   // Pulsos correndo do canhão para o alvo, marcando o tempo até o disparo.
   float run = fract(v.y * 3. - time * (.7 + charge * 1.6));
   float pulse = exp(-run * run * 26.) * (.35 + charge * .5);
   float alpha = (core + halo + pulse * core * 2.) * fade * (.35 + charge * .65);
   if (alpha < .01) discard;
   gl_FragColor = vec4(mix(tint, vec3(1.), core * .7), alpha);
  }`,
});
for (let i = 0; i < 12; i++) {
  const flash = new Mesh(flashGeometry, flashMaterial); flash.visible = false; effects.add(flash); flashes.push(flash);
  if (i < 4) { const warning = new Mesh(warningGeometry, warningMaterial); warning.visible = false; effects.add(warning); warnings.push(warning); }
}
loadFleetModel(props.enemy.type).then(model => {
  if (disposed) { model.dispose(); return; }
  release = model.dispose;
  model.root.traverse(part => {
    const name = (part.userData.name || part.name).replace(/\.\d+$/, '');
    if (['radial_emitter', 'ring_rotor', 'radial_rotor'].includes(name)) rotors.push(part);
    if (name.startsWith('hangar_door')) doors.push({ part, position: part.position.clone(), sign: name.endsWith('left') ? -1 : 1 });
  });
  const seen = new Set();
  model.root.traverse(part => {
    for (const mat of (Array.isArray(part.material) ? part.material : [part.material])) {
      if (mat?.emissive && mat.emissive.getHex() && !seen.has(mat)) { seen.add(mat); glows.push({ mat, intensity: mat.emissiveIntensity }); }
    }
  });
  root.add(model.root);
  if (outer) outer.userData.fleetReady = true;
  if (outer) props.setVisualMeshRef(props.enemy.id)(outer);
}).catch(error => console.error(`Falha ao carregar ${ENEMY_FLEET[props.enemy.type]?.name}`, error));

useGameLoop().onBeforeRender(({ delta }) => {
  const enemy = props.enemy;
  const frozen = enemy.elementState?.freeze;
  const dt = !frozen && (props.preview || run.isPlaying) ? Math.min(delta, .1) : 0;
  time += dt;
  root.scale.setScalar(fleetScale(enemy));
  const clock = enemy.attackClock;
  const volley = clock?.charging ? clock.volley : enemy.firedVolley ?? 0;
  const profile = clock?.charging ? clock.profile ?? attackProfile(enemy.type, enemy.room, volley, enemy)
    : enemy.firedProfile ?? attackProfile(enemy.type, enemy.room, volley, enemy);
  const rotor = fleetRotorAngle(enemy, profile, volley);
  if (!frozen) rotors.forEach(part => { part.rotation.y = rotor; });
  if (outer && !props.preview && !frozen) outer.rotation.y = fleetHeading(enemy, run.getPlayerPosition());
  const charge = enemy.attackCharge || 0;
  if (dt) {
    glows.forEach(({ mat, intensity }) => { mat.emissiveIntensity = intensity * (1 + charge * 1.6 + Math.sin(time * 3) * .1); });
    doors.forEach(({ part, position, sign }) => {
      part.position.x += (position.x + (enemy.hangarOpen ? sign * .18 : 0) - part.position.x) * Math.min(1, dt * 5);
      part.position.y += (position.y + (enemy.hangarOpen ? .14 : 0) - part.position.y) * Math.min(1, dt * 5);
    });
  }
  const sockets = fleetSockets(enemy.type, profile, enemy);
  const telegraphSocket = enemy.type === 'chapter4Boss' && profile.beam
    ? ENEMY_FLEET.chapter4Boss.sockets.find(socket => socket.role === 'beam_telegraph')
    : null;
  const localEnemy = { ...enemy, position: { x: 0, y: 0, z: 0 } };
  flashes.forEach((mesh, index) => {
    mesh.visible = !props.preview && !frozen && enemy.fleetRecoil > 0 && index < sockets.length;
    if (mesh.visible) { const p = fleetSocketWorld(localEnemy, sockets[index], 0, rotor).origin; mesh.position.set(p.x, p.y, p.z); }
  });
  warnings.forEach((mesh, index) => {
    if (index === 0 && enemy.dashState === 'aim' && enemy.dashDirection && !props.preview && !frozen) {
      mesh.visible = true;
      mesh.position.set(0, .05, 0);
      mesh.rotation.y = Math.atan2(-enemy.dashDirection.x, -enemy.dashDirection.z) - (outer?.rotation.y || 0);
      mesh.scale.set(enemy.dashWidth || 2.2, 1, enemy.dashLength || 14);
      warningMaterial.uniforms.charge.value = enemy.dashCharge || 0;
      return;
    }
    mesh.visible = !props.preview && !frozen && enemy.state === 'active' && clock?.charging && profile.beam && index < sockets.length;
    if (!mesh.visible) return;
    const { origin, direction } = fleetSocketWorld(localEnemy, index === 0 && telegraphSocket ? telegraphSocket : sockets[index], 0, rotor);
    mesh.position.set(origin.x, origin.y + .015, origin.z);
    mesh.rotation.y = Math.atan2(-direction.x, -direction.z);
    mesh.scale.set(profile.beamWidth * 2, 1, profile.range);
    warningMaterial.uniforms.charge.value = charge;
  });
  warningMaterial.uniforms.time.value = time;
});
onUnmounted(() => { disposed = true; release?.(); flashGeometry.dispose(); warningGeometry.dispose(); flashMaterial.dispose(); warningMaterial.dispose(); });
</script>
<template>
  <TresGroup :ref="bind" :name="`enemy-visual-${enemy.id}`">
    <primitive :object="root" />
    <primitive :object="effects" />
  </TresGroup>
</template>
