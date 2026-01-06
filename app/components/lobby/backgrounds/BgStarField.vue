<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { shallowRef, ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  atmosphereColor: {
    type: String,
    default: '#1a0b2e'
  },
  galaxyOpacity: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  }
})

const { onBeforeRender } = useLoop()

// --- STAR LAYERS CONFIG ---
const layers = [
  { count: 2000, size: 0.1, speed: 0.01, radius: 200, color: '#ffffff' }, // Background (Very far, tiny)
  { count: 1000, size: 0.2, speed: 0.02, radius: 180, color: '#aaddff' }, // Mid
  { count: 300, size: 0.6, speed: 0.05, radius: 160, color: '#ffffff' }   // Foreground (Still distant, just brighter)
]

const starSystems = ref([])
const smokeMaterial = shallowRef(null)
const galaxyMaterial = shallowRef(null)

const smokeUniforms = {
  uTime: { value: 0 },
  uColor: { value: new THREE.Color(props.atmosphereColor) }
}

const galaxyUniforms = {
  uTime: { value: 0 },
  uOpacity: { value: props.galaxyOpacity },
  uLevel: { value: props.level }
}

const targetColor = new THREE.Color(props.atmosphereColor)
const targetGalaxyOpacity = ref(props.galaxyOpacity)
const targetLevel = ref(props.level)

watch(() => props.atmosphereColor, (newVal) => {
  targetColor.set(newVal)
})

watch(() => props.galaxyOpacity, (newVal) => {
  targetGalaxyOpacity.value = newVal
})

watch(() => props.level, (newVal) => {
  targetLevel.value = newVal
})

// Generate random points on a sphere surface or volume
const generateStars = (count, radius) => {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const randoms = new Float32Array(count) // For twinkling/variation

  for (let i = 0; i < count; i++) {
    const r = radius * (0.8 + Math.random() * 0.4) // Vary radius slightly
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    
    sizes[i] = Math.random()
    randoms[i] = Math.random()
  }
  return { positions, sizes, randoms }
}


// --- STAR SHADER ---
const starVertexShader = `
  attribute float size;
  attribute float random;
  uniform float uTime;
  uniform float uBaseSize;
  
  varying float vRandom;
  
  void main() {
    vRandom = random;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Twinkle effect
    float twinkle = 0.8 + 0.4 * sin(uTime * 2.0 + random * 10.0);
    
    gl_PointSize = uBaseSize * size * twinkle * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying float vRandom;
  
  void main() {
    // Distance from center of point (0.0 to 0.5)
    vec2 pos = gl_PointCoord - vec2(0.5);
    float dist = length(pos);
    
    // Circular glow
    float circle = 1.0 - smoothstep(0.1, 0.5, dist);
    
    // Radiating spikes (cross flare)
    float rays = max(
      1.0 - abs(pos.x * 10.0),
      1.0 - abs(pos.y * 10.0)
    );
    rays = pow(rays, 3.0); // Sharpen
    
    // Combine for final star shape
    // Foreground stars (vRandom > 0.8) get more flare
    float glow = circle * 0.8;
    float flare = rays * smoothstep(0.8, 1.0, vRandom) * 0.5;
    
    float alpha = glow + flare;
    
    // Soft edges
    if (alpha < 0.01) discard;
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`

// --- SMOKE SHADER (Subtle FBM) ---
const smokeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const smokeFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  // Simple Noise
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  
  float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
      }
      return v;
  }

  void main() {
      // Slow moving smoke
      float n = fbm(vUv * 4.0 + uTime * 0.05);
      
      // Very transparent
      float opacity = smoothstep(0.3, 0.8, n) * 0.15;
      
      gl_FragColor = vec4(uColor, opacity);
  }
`

// --- GALAXY RIFT SHADER ---
const galaxyVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const galaxyFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uLevel;
  varying vec2 vUv;

  // Simplex Noise (2D)
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
      vec2 uv = vUv;
      float levelMix = smoothstep(2.0, 3.0, uLevel); // 0.0 at L2, 1.0 at L3
      
      // Center the UVs
      vec2 centered = uv * 2.0 - 1.0;
      
      // Rotate 45 degrees
      float angle = 0.785;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      centered *= rot;
      
      // Shape Distortion (Aurora-like wavy ribbon) - Interpolated
      float distortion = sin(centered.x * 2.0 + uTime * 0.2) * 0.3;
      distortion += sin(centered.x * 5.0 - uTime * 0.1) * 0.1;
      
      centered.y += distortion * levelMix; // Apply distortion gradually
      
      // Squeeze Y to make a band
      float bandDist = abs(centered.y);
      float bandMask = smoothstep(0.8, 0.0, bandDist); // Fade out at edges
      
      if (bandMask < 0.01) discard;
      
      // Noise texture for clouds
      float n = snoise(uv * 5.0 + uTime * 0.05); // Base shape
      float detail = snoise(uv * 10.0 - uTime * 0.02); // Details
      
      float clouds = n * 0.6 + detail * 0.4;
      
      // Colors
      // Default / Level 2 Base: Warm/Magma Theme (Orange/Red/Gold)
      vec3 colorL2_1 = vec3(1.0, 0.4, 0.1); // Bright Orange
      vec3 colorL2_2 = vec3(0.6, 0.1, 0.2); // Deep Red
      vec3 level2Color = mix(colorL2_2, colorL2_1, clouds);

      // Level 3: Colorful Nebula Theme (Pink/Cyan/Deep Purple)
      vec3 colorL3_1 = vec3(0.1, 0.8, 0.9); // Cyan
      vec3 colorL3_2 = vec3(0.9, 0.2, 0.8); // Magenta/Pink
      vec3 colorL3_3 = vec3(0.2, 0.1, 0.6); // Deep Purple
      
      // Complex mix for L3
      float rainbow = sin(uv.x * 3.0 + uTime * 0.1) * 0.5 + 0.5;
      vec3 level3Color = mix(colorL3_1, colorL3_2, clouds);
      level3Color = mix(level3Color, colorL3_3, rainbow);

      // Interpolate between Level 2 and Level 3 Colors based on levelMix
      vec3 finalColor = mix(level2Color, level3Color, levelMix);
      
      // Combine mask and noise
      float alpha = bandMask * (clouds * 0.5 + 0.5) * uOpacity * 0.6; // Slightly opacity increase
      
      gl_FragColor = vec4(finalColor, alpha);
  }
`

// Loop animation
onBeforeRender(({ elapsed, delta }) => {
  // Rotate star layers
  starSystems.value.forEach((system, index) => {
    if (!system) return
    const speed = layers[index].speed * 0.1
    system.rotation.y = elapsed * speed * 0.5
    system.rotation.x = elapsed * speed * 0.2
    
    // Update uniforms
    if (system.material.uniforms) {
      system.material.uniforms.uTime.value = elapsed
    }
  })
  
  // Update smoke
  if (smokeMaterial.value) {
    smokeMaterial.value.uniforms.uTime.value = elapsed
    // Interpolate color values separately
    smokeMaterial.value.uniforms.uColor.value.lerp(targetColor, delta * 2.0)
  }
  
  // Update galaxy
  if (galaxyMaterial.value) {
    galaxyMaterial.value.uniforms.uTime.value = elapsed
    // Interpolate opacity
    const currentOpacity = galaxyMaterial.value.uniforms.uOpacity.value
    galaxyMaterial.value.uniforms.uOpacity.value += (targetGalaxyOpacity.value - currentOpacity) * delta * 2.0
    
    // Interpolate Level morphing
    const currentLevel = galaxyMaterial.value.uniforms.uLevel.value
    galaxyMaterial.value.uniforms.uLevel.value += (targetLevel.value - currentLevel) * delta * 2.0
  }
})
</script>

<template>
  <TresGroup>
    <!-- Lighting (kept basic for scene illumination) -->
    <TresAmbientLight :intensity="0.6" color="#ffffff" />
    <TresDirectionalLight :position="[2, 2, 5]" :intensity="1.5" color="#ffffff" />

    <!-- Star Layers -->
    <TresPoints 
      v-for="(layer, index) in layers" 
      :key="index"
      :ref="(el) => starSystems[index] = el"
    >
      <TresBufferGeometry>
        <TresBufferAttribute
          attach="attributes-position"
          :count="layer.count"
          :array="generateStars(layer.count, layer.radius).positions"
          :item-size="3"
        />
        <TresBufferAttribute
          attach="attributes-size"
          :count="layer.count"
          :array="generateStars(layer.count, layer.radius).sizes"
          :item-size="1"
        />
        <TresBufferAttribute
          attach="attributes-random"
          :count="layer.count"
          :array="generateStars(layer.count, layer.radius).randoms"
          :item-size="1"
        />
      </TresBufferGeometry>
      <TresShaderMaterial
        :vertex-shader="starVertexShader"
        :fragment-shader="starFragmentShader"
        :uniforms="{
          uTime: { value: 0 },
          uBaseSize: { value: layer.size * 20.0 } // Scale up sizing
        }"
        :transparent="true"
        :depth-write="false"
        :blending="THREE.AdditiveBlending"
      />
    </TresPoints>
    
    <!-- Galaxy Rift Band (Milky Way) -->
    <TresMesh :scale="150" :rotation="[0.5, 0.5, 0]">
      <TresSphereGeometry :args="[1, 64, 64]" /> 
      <!-- Using Sphere instead of plane to wrap around the deep distance -->
      <TresShaderMaterial
        ref="galaxyMaterial"
        :vertex-shader="galaxyVertexShader"
        :fragment-shader="galaxyFragmentShader"
        :uniforms="galaxyUniforms"
        :side="THREE.BackSide"
        :transparent="true"
        :depth-write="false"
        :blending="THREE.AdditiveBlending"
      />
    </TresMesh>
    
    <!-- Distant Smoke/Nebula Background -->
    <TresMesh :scale="90">
      <TresSphereGeometry :args="[1, 32, 32]" />
      <TresShaderMaterial
        ref="smokeMaterial"
        :vertex-shader="smokeVertexShader"
        :fragment-shader="smokeFragmentShader"
        :uniforms="smokeUniforms"
        :side="THREE.BackSide"
        :transparent="true"
        :depth-write="false"
      />
    </TresMesh>
  </TresGroup>
</template>
