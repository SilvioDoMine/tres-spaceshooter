<script setup lang="ts">
import { AdditiveBlending, Color, Group, Mesh, PlaneGeometry, RingGeometry, ShaderMaterial } from 'three';

// Hiper velocidade da sala limpa: ao ativar, uma faixa de luz corre pela nave e uma onda se abre no chão
const run = useCurrentRunStore();
const thrusterColor = useThrusterColor();
const root = new Group();
const color = new Color('#27c7ff');

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

let burstAge = 99, wasActive = false;

useGameLoop().onBeforeRender(({ delta }) => {
  if (!run.isPlaying) return;
  const active = run.isHyperdrive;
  if (active && !wasActive) burstAge = 0;
  wasActive = active;
  burstAge += Math.min(delta, .1);
  color.set(thrusterColor());

  const player = run.getPlayerPosition(), yaw = run.getPlayerRotation().y;
  // Faixa de luz corre do bico (-z) até a traseira da nave
  const sweepProgress = burstAge / SWEEP_TIME;
  sweep.visible = sweepProgress < 1;
  if (sweep.visible) {
    const along = -1.1 + sweepProgress * 2.2;
    sweep.position.set(player.x + along * Math.sin(yaw), .7, player.z + along * Math.cos(yaw));
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

onUnmounted(() => { sweepGeometry.dispose(); sweepMaterial.dispose(); waveGeometry.dispose(); waveMaterial.dispose(); });
</script>

<template><primitive :object="root" /></template>
