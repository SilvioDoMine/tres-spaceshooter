<script setup lang="ts">
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Group, Mesh, PlaneGeometry, RingGeometry, ShaderMaterial,
} from 'three';

// Hiper velocidade da sala limpa: varredura de luz na nave ao ativar, onda no chão e rastro dos dois propulsores
const run = useCurrentRunStore();
const thrusterColor = useThrusterColor();
const root = new Group();
const color = new Color('#27c7ff');

// ==================== RASTRO ====================
const POINTS = 40, TRAIL_LIFE = .5, MIN_STEP = .1, HALF_WIDTH = .24, TELEPORT = 3;
// Saída dos jatos no espaço local da nave (a traseira aponta para +z)
const ENGINES = [{ x: -.306, z: .75 }, { x: .306, z: .75 }];
const ribbonMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, side: 2,
  uniforms: { color: { value: color } },
  vertexShader: `attribute float fade; attribute float side; varying float vFade; varying float vSide;
    void main(){vFade=fade;vSide=side;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform vec3 color; varying float vFade; varying float vSide;
    void main(){float d=abs(vSide);float core=exp(-d*d*16.);float glow=1.-smoothstep(.15,1.,d);
      vec3 col=mix(color,vec3(1.),core*.75);float alpha=(glow*.4+core*.75)*vFade*vFade;
      if(alpha<.003)discard;gl_FragColor=vec4(col,alpha);}` });

type Sample = { x: number; z: number; t: number };
const ribbons = ENGINES.map(() => {
  const geometry = new BufferGeometry();
  const position = new BufferAttribute(new Float32Array(POINTS * 6), 3).setUsage(DynamicDrawUsage);
  const fade = new BufferAttribute(new Float32Array(POINTS * 2), 1).setUsage(DynamicDrawUsage);
  const side = new Float32Array(POINTS * 2), index: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    side[i * 2] = -1; side[i * 2 + 1] = 1;
    if (i < POINTS - 1) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  geometry.setAttribute('position', position); geometry.setAttribute('fade', fade);
  geometry.setAttribute('side', new BufferAttribute(side, 1)); geometry.setIndex(index); geometry.setDrawRange(0, 0);
  const mesh = new Mesh(geometry, ribbonMaterial); mesh.frustumCulled = false; root.add(mesh);
  return { geometry, position, fade, samples: [] as Sample[] };
});

// ==================== VARREDURA + ONDA ====================
const SWEEP_TIME = .42, WAVE_TIME = .65;
const sweepGeometry = new PlaneGeometry(1, 1); sweepGeometry.rotateX(-Math.PI / 2);
const sweepMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, side: 2,
  uniforms: { color: { value: color }, opacity: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform vec3 color; uniform float opacity; varying vec2 vUv;
    void main(){vec2 p=abs(vUv*2.-1.);float band=exp(-p.y*p.y*6.)*(1.-smoothstep(.55,1.,p.x));
      gl_FragColor=vec4(mix(color,vec3(1.),.6),band*opacity);}` });
const sweep = new Mesh(sweepGeometry, sweepMaterial); sweep.renderOrder = 10; sweep.visible = false; root.add(sweep);
const waveGeometry = new RingGeometry(.85, 1, 48); waveGeometry.rotateX(-Math.PI / 2);
const waveMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, side: 2,
  uniforms: { color: { value: color }, opacity: { value: 0 } },
  vertexShader: `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform vec3 color; uniform float opacity; void main(){gl_FragColor=vec4(color,opacity);}` });
const wave = new Mesh(waveGeometry, waveMaterial); wave.visible = false; root.add(wave);

let clock = 0, intensity = 0, burstAge = 99, wasActive = false;

useGameLoop().onBeforeRender(({ delta }) => {
  if (!run.isPlaying) return;
  const dt = Math.min(delta, .1), active = run.isHyperdrive;
  clock += dt;
  intensity += ((active ? 1 : 0) - intensity) * (1 - Math.exp(-dt * 5));
  if (active && !wasActive) burstAge = 0;
  wasActive = active;
  burstAge += dt;
  color.set(thrusterColor());

  const player = run.getPlayerPosition(), yaw = run.getPlayerRotation().y;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);

  ribbons.forEach((ribbon, engine) => {
    const { x: lx, z: lz } = ENGINES[engine]!;
    const head = { x: player.x + lx * cos + lz * sin, z: player.z - lx * sin + lz * cos, t: clock };
    const last = ribbon.samples[0];
    // Troca de sala teleporta a nave: não liga o rastro velho à posição nova
    if (last && Math.hypot(head.x - last.x, head.z - last.z) > TELEPORT) ribbon.samples.length = 0;
    if (active && (!last || Math.hypot(head.x - last.x, head.z - last.z) >= MIN_STEP)) {
      ribbon.samples.unshift(head);
      if (ribbon.samples.length > POINTS - 1) ribbon.samples.length = POINTS - 1;
    }
    while (ribbon.samples.length && clock - ribbon.samples[ribbon.samples.length - 1]!.t > TRAIL_LIFE) ribbon.samples.pop();
    const points = ribbon.samples.length ? [head, ...ribbon.samples] : [];
    let nx = 0, nz = 0;
    points.forEach((point, i) => {
      const a = points[Math.max(0, i - 1)]!, b = points[Math.min(points.length - 1, i + 1)]!;
      const dx = a.x - b.x, dz = a.z - b.z, length = Math.hypot(dx, dz);
      if (length > 1e-5) { nx = -dz / length; nz = dx / length; }
      const age = Math.min(1, (clock - point.t) / TRAIL_LIFE), width = HALF_WIDTH * (1 - age * .7);
      ribbon.position.setXYZ(i * 2, point.x + nx * width, .08, point.z + nz * width);
      ribbon.position.setXYZ(i * 2 + 1, point.x - nx * width, .08, point.z - nz * width);
      const fade = (1 - age) * intensity;
      ribbon.fade.setX(i * 2, fade); ribbon.fade.setX(i * 2 + 1, fade);
    });
    ribbon.geometry.setDrawRange(0, Math.max(0, points.length - 1) * 6);
    ribbon.position.needsUpdate = true; ribbon.fade.needsUpdate = true;
  });

  // Faixa de luz corre do bico (-z) até a traseira da nave
  const sweepProgress = burstAge / SWEEP_TIME;
  sweep.visible = sweepProgress < 1;
  if (sweep.visible) {
    const along = -1.1 + sweepProgress * 2.2;
    sweep.position.set(player.x + along * sin, .7, player.z + along * cos);
    sweep.rotation.y = yaw; sweep.scale.set(1.7, 1, .5);
    sweepMaterial.uniforms.opacity.value = Math.sin(Math.PI * sweepProgress) * 1.4;
  }
  const waveProgress = burstAge / WAVE_TIME;
  wave.visible = waveProgress < 1;
  if (wave.visible) {
    wave.position.set(player.x, .1, player.z);
    wave.scale.setScalar(.8 + (1 - (1 - waveProgress) ** 3) * 4.5);
    waveMaterial.uniforms.opacity.value = (1 - waveProgress) * .7;
  }
});

onUnmounted(() => {
  ribbons.forEach(ribbon => ribbon.geometry.dispose());
  ribbonMaterial.dispose(); sweepGeometry.dispose(); sweepMaterial.dispose(); waveGeometry.dispose(); waveMaterial.dispose();
});
</script>

<template><primitive :object="root" /></template>
