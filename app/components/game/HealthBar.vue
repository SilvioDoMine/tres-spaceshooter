<script setup lang="js">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useLoop } from '@tresjs/core';
import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';

const props = defineProps({
  currentHealth: {
    type: Number,
    required: true,
  },
  maxHealth: {
    type: Number,
    required: true,
  },
  width: {
    type: Number,
    default: 1,
  },
  height: {
    type: Number,
    default: 0.1,
  },
  position: {
    type: Array,
    default: () => [0, 0, 0],
  },
  color: {
    type: String,
    default: null,
  },
  hiddenFull: {
    type: Boolean,
    default: false,
  },
  showHp: {
    type: Boolean,
    default: false,
  },
  // Divisórias a cada N de vida (estilo Archero). 0 desliga.
  segmentHp: {
    type: Number,
    default: 0,
  },
});

// Barra "de plástico" estilo Archero: moldura escura, preenchimento com gradiente,
// brilho superior, faixa clara de dano atrasado, flash ao tomar dano e reflexo que atravessa.
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform vec2 uSize;
uniform float uHealth;
uniform float uTrail;
uniform float uFlash;
uniform float uTime;
uniform float uSegments;
uniform vec3 uTop;
uniform vec3 uBottom;
varying vec2 vUv;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float aa = fwidth(p.x);
  float h = uSize.y;

  float dOuter = sdRound(p, uSize * 0.5, h * 0.5);
  float outerA = 1.0 - smoothstep(-aa, aa, dOuter);
  if (outerA <= 0.0) discard;

  float border = h * 0.17;
  float innerA = 1.0 - smoothstep(-aa, aa, dOuter + border);
  vec2 innerHalf = uSize * 0.5 - border;
  float u = (p.x + innerHalf.x) / (innerHalf.x * 2.0);
  float v = (p.y + innerHalf.y) / (innerHalf.y * 2.0);
  float du = fwidth(u);

  // Moldura: escura com um fio de luz na borda de cima
  vec3 frame = mix(vec3(0.02, 0.03, 0.06), vec3(0.14, 0.16, 0.24), smoothstep(0.1, 1.0, vUv.y));
  frame += vec3(0.25) * smoothstep(border * 0.6, 0.0, -dOuter) * smoothstep(0.55, 1.0, vUv.y);

  // Fundo vazio com sombra interna no topo
  vec3 col = mix(vec3(0.04, 0.04, 0.07), vec3(0.12, 0.12, 0.17), v) * mix(1.0, 0.55, smoothstep(0.6, 1.0, v));

  float fillA = 1.0 - smoothstep(uHealth - du, uHealth + du, u);
  float trailA = (1.0 - smoothstep(uTrail - du, uTrail + du, u)) * (1.0 - fillA);

  vec3 fill = mix(uBottom, uTop, smoothstep(0.0, 0.85, v));
  fill += uTop * 0.25 * smoothstep(0.3, 0.0, v);
  if (uSegments > 1.5) {
    float s = fract(u * uSegments);
    float dist = min(s, 1.0 - s) / uSegments;
    float tick = 1.0 - smoothstep(du * 0.7, du * 1.7, dist);
    tick *= step(0.5 / uSegments, u) * step(u, 1.0 - 0.5 / uSegments);
    fill *= 1.0 - tick * 0.5;
  }
  fill = mix(fill, vec3(1.0), uFlash * 0.65);

  col = mix(col, mix(vec3(1.0, 0.9, 0.7), vec3(1.0), v), trailA);
  col = mix(col, fill, fillA);

  // Reflexo que atravessa o preenchimento de tempos em tempos
  float sweepX = fract(uTime * 0.3) * 3.0 - 1.0;
  float sweep = 1.0 - smoothstep(0.0, 0.05, abs(u + (v - 0.5) * 0.15 - sweepX));
  col += vec3(0.35) * sweep * fillA;

  // Brilho plástico: faixa arredondada na metade de cima
  vec2 glossHalf = vec2(innerHalf.x - innerHalf.y * 0.45, innerHalf.y * 0.28);
  float dGloss = sdRound(p - vec2(0.0, innerHalf.y * 0.5), glossHalf, glossHalf.y);
  float gloss = (1.0 - smoothstep(-aa, aa, dGloss)) * mix(0.35, 1.0, smoothstep(0.6, 0.95, v));
  col = mix(col, vec3(1.0), gloss * mix(0.1, 0.45, fillA));

  gl_FragColor = vec4(mix(frame, col, innerA), outerA);
}`;

const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  // Nunca fica escondida atrás de cascos
  depthTest: false,
  toneMapped: false,
  uniforms: {
    uSize: { value: new Vector2(props.width, props.height) },
    uHealth: { value: 1 },
    uTrail: { value: 1 },
    uFlash: { value: 0 },
    uTime: { value: 0 },
    uSegments: { value: 0 },
    uTop: { value: new Color() },
    uBottom: { value: new Color() },
  },
});
const mesh = new Mesh(new PlaneGeometry(props.width, props.height), material);
mesh.renderOrder = 10;

watch(() => [props.width, props.height], ([width, height]) => {
  mesh.geometry.dispose();
  mesh.geometry = new PlaneGeometry(width, height);
  material.uniforms.uSize.value.set(width, height);
});

// Calcula a porcentagem de vida
const healthPercentage = computed(() => {
  return Math.max(0, Math.min(1, props.currentHealth / props.maxHealth));
});

// Cor da barra baseada na porcentagem de vida ou cor customizada
const WHITE = new Color('#ffffff');
watch(() => [props.color, healthPercentage.value], () => {
  let base = props.color;
  if (!base) {
    if (healthPercentage.value > 0.6) base = '#3fcf2a';
    else if (healthPercentage.value > 0.3) base = '#f2b500';
    else base = '#e8261e';
  }
  const color = new Color(base);
  material.uniforms.uTop.value.copy(color).lerp(WHITE, 0.3);
  material.uniforms.uBottom.value.copy(color).multiplyScalar(0.55);
}, { immediate: true });

watch(() => [props.maxHealth, props.segmentHp], () => {
  const segments = props.segmentHp > 0 ? props.maxHealth / props.segmentHp : 0;
  material.uniforms.uSegments.value = segments <= 30 ? segments : 0;
}, { immediate: true });

// Faixa de dano: segura um instante e depois escorre até a vida atual
let trailHold = 0;
material.uniforms.uHealth.value = healthPercentage.value;
material.uniforms.uTrail.value = healthPercentage.value;
watch(healthPercentage, (value, previous) => {
  material.uniforms.uHealth.value = value;
  if (value < previous) {
    trailHold = 0.35;
    material.uniforms.uFlash.value = 1;
  } else {
    material.uniforms.uTrail.value = value;
  }
});

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta, elapsed }) => {
  const uniforms = material.uniforms;
  uniforms.uTime.value = elapsed;
  uniforms.uFlash.value = Math.max(0, uniforms.uFlash.value - delta * 6);
  if (trailHold > 0) trailHold -= delta;
  else if (uniforms.uTrail.value > uniforms.uHealth.value) {
    uniforms.uTrail.value = Math.max(uniforms.uHealth.value, uniforms.uTrail.value - delta * 0.8);
  }
});

onBeforeUnmount(() => {
  mesh.geometry.dispose();
  material.dispose();
});

// Visibilidade: só mostra se a vida não tiver cheia
const isVisible = computed(() => props.currentHealth >= props.maxHealth ? false : true);

// Texto de HP
const hpText = computed(() => {
  return `${Math.ceil(props.currentHealth)}`;
});
</script>

<template>
  <TresGroup :position="position" :rotation="[-Math.PI / 2, 0, 0]" v-if="isVisible || !props.hiddenFull">
    <primitive :object="mesh" />

    <!-- Texto de HP (se habilitado), com sombra escura por trás -->
    <Suspense v-if="showHp">
      <TresGroup :position="[0, height * 1.1, 0.01]">
        <Text3D
          :position="[height * 0.08, -height * 0.08, -0.005]"
          :scale="[height * 2, height * 2, 0.01]"
          :text="hpText"
          font="/fonts/PoppinsBold.json"
          need-updates
          center
        >
          <TresMeshBasicMaterial color="#05070d" />
        </Text3D>
        <Text3D
          :scale="[height * 2, height * 2, 0.01]"
          :text="hpText"
          font="/fonts/PoppinsBold.json"
          need-updates
          center
        >
          <TresMeshBasicMaterial color="#fff" />
        </Text3D>
      </TresGroup>
    </Suspense>
  </TresGroup>
</template>
