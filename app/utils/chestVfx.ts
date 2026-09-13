// Efeitos da abertura do baú com shaders aditivos (bloom "falso", barato no celular):
// luz na boca do baú, leque de raios, clarão, onda de choque no chão, faíscas em espiral e halo do item.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  type Material,
} from 'three';
import type { ChestFrame } from './chestTimeline';

/** Câmera da cena de abertura (a tela HTML usa o mesmo valor para posicionar o card do item) */
export const OPENING_CAMERA = { position: [0, 2.6, 6.4] as const, target: [0, 2.0, 0] as const, fov: 40 };
/** Onde o item para, no alto (mundo), bem acima da tampa aberta */
export const ITEM_ANCHOR = [0, 3.75, 0] as const;

/**
 * Área mínima de cena visível. Largura: em tela de pé a câmera se afasta para o baú não estourar as laterais.
 * Altura: em tela deitada (desktop) garante espaço do chão até o nome do item acima dele.
 */
const MIN_VISIBLE_WIDTH = 5.2;
const MIN_VISIBLE_HEIGHT = 6.6;

/** Posição da câmera para a proporção da tela (mesma direção de visão, só mais longe) */
export function openingCameraPosition(aspect: number): [number, number, number] {
  const [px, py, pz] = OPENING_CAMERA.position;
  const [, ty] = OPENING_CAMERA.target;
  const baseDistance = Math.hypot(py - ty, pz);
  const tanHalfFov = Math.tan((OPENING_CAMERA.fov * Math.PI) / 360);
  const neededForWidth = MIN_VISIBLE_WIDTH / 2 / (tanHalfFov * Math.max(0.3, aspect));
  const neededForHeight = MIN_VISIBLE_HEIGHT / 2 / tanHalfFov;
  const needed = Math.max(neededForWidth, neededForHeight);
  const scale = Math.max(1, needed / baseDistance);
  return [px, ty + (py - ty) * scale, pz * scale];
}

const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide };

const FULLSCREEN_UV_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export interface ChestVfx {
  group: Group;
  update(frame: ChestFrame, time: number, delta: number): void;
  setColors(glow: string, halo: string): void;
  dispose(): void;
}

export function buildChestVfx(options: { mouthY: number; glow: string; halo: string; maxParticles?: number }): ChestVfx {
  const { mouthY } = options;
  const group = new Group();
  const materials: Material[] = [];
  const geometries: BufferGeometry[] = [];
  const glowColor = { value: new Color(options.glow) };
  const haloColor = { value: new Color(options.halo) };
  const time = { value: 0 };

  const shader = (uniforms: Record<string, { value: unknown }>, fragmentShader: string, vertexShader = FULLSCREEN_UV_VERTEX) => {
    const material = new ShaderMaterial({ ...additive, uniforms: { uTime: time, ...uniforms }, vertexShader, fragmentShader });
    materials.push(material);
    return material;
  };
  const plane = (w: number, h: number) => {
    const geometry = new PlaneGeometry(w, h);
    geometries.push(geometry);
    return geometry;
  };

  // -- Luz na boca do baú: gradiente quente que cresce ao abrir -----------------------------
  const innerIntensity = { value: 0 };
  const inner = new Mesh(
    plane(1.5, 1.0),
    shader(
      { uIntensity: innerIntensity, uColor: glowColor },
      /* glsl */ `
      uniform float uIntensity; uniform vec3 uColor; uniform float uTime; varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * vec2(1.5, 1.0) * 2.0;
        float r = length(p);
        float core = exp(-r * r * 2.2);
        float pulse = 0.85 + 0.15 * sin(uTime * 6.0);
        vec3 col = mix(uColor, vec3(1.0), core * 0.8);
        gl_FragColor = vec4(col, core * uIntensity * pulse);
      }`,
    ),
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = mouthY + 0.02;
  group.add(inner);

  // Um brilho de frente, para a luz "vazar" pela fresta mesmo com a câmera de lado
  const spillIntensity = { value: 0 };
  const spill = new Mesh(
    plane(3.2, 2.2),
    shader(
      { uIntensity: spillIntensity, uColor: glowColor },
      /* glsl */ `
      uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        vec2 p = (vUv - vec2(0.5, 0.35)) * vec2(1.4, 2.0);
        float glow = exp(-dot(p, p) * 5.0);
        gl_FragColor = vec4(mix(uColor, vec3(1.0), glow), glow * uIntensity);
      }`,
    ),
  );
  spill.position.set(0, mouthY + 0.5, 0.45);
  group.add(spill);

  // -- Leque de raios de luz ------------------------------------------------------------------
  const rays = new Group();
  rays.position.set(0, mouthY, 0.1);
  group.add(rays);
  const rayIntensity = { value: 0 };
  const rayGeometry = plane(0.7, 5.2);
  rayGeometry.translate(0, 2.6, 0);
  const RAY_COUNT = 9;
  for (let i = 0; i < RAY_COUNT; i++) {
    const seed = { value: i / RAY_COUNT };
    const ray = new Mesh(
      rayGeometry,
      shader(
        { uIntensity: rayIntensity, uColor: glowColor, uSeed: seed },
        /* glsl */ `
        uniform float uIntensity; uniform vec3 uColor; uniform float uTime; uniform float uSeed; varying vec2 vUv;
        void main() {
          // Mais largo na ponta: afina a máscara perto da base
          float width = mix(0.18, 1.0, vUv.y);
          float x = abs(vUv.x - 0.5) * 2.0 / width;
          float edge = pow(clamp(1.0 - x, 0.0, 1.0), 2.2);
          float along = pow(1.0 - vUv.y, 1.4) * smoothstep(0.0, 0.06, vUv.y);
          float breathe = 0.55 + 0.45 * sin(uTime * (1.6 + uSeed) + uSeed * 6.283);
          vec3 col = mix(uColor, vec3(1.0), edge * (1.0 - vUv.y) * 0.9);
          gl_FragColor = vec4(col, edge * along * breathe * uIntensity * 0.75);
        }`,
      ),
    );
    ray.rotation.z = (i / (RAY_COUNT - 1) - 0.5) * 2.1;
    ray.scale.set(0.8 + ((i * 7) % 5) * 0.12, 0.75 + ((i * 3) % 4) * 0.12, 1);
    rays.add(ray);
  }

  // -- Clarão ------------------------------------------------------------------------------------
  const flashIntensity = { value: 0 };
  const flash = new Mesh(
    plane(7, 7),
    shader(
      { uIntensity: flashIntensity, uColor: glowColor },
      /* glsl */ `
      uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float core = exp(-r * r * 9.0);
        float wide = exp(-r * r * 2.5) * 0.45;
        vec3 col = mix(uColor, vec3(1.0), core);
        gl_FragColor = vec4(col, (core + wide) * uIntensity);
      }`,
    ),
  );
  flash.position.set(0, mouthY + 0.35, 0.9);
  group.add(flash);

  // -- Onda de choque no chão ----------------------------------------------------------------------
  const ringProgress = { value: 0 };
  const ring = new Mesh(
    plane(1, 1),
    shader(
      { uProgress: ringProgress, uColor: glowColor },
      /* glsl */ `
      uniform float uProgress; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float band = smoothstep(0.72, 0.9, r) * smoothstep(1.0, 0.9, r);
        float fade = (1.0 - uProgress) * step(0.001, uProgress);
        gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.5), band * fade);
      }`,
    ),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  // -- Halo atrás do item (cor da raridade) ----------------------------------------------------------
  const haloIntensity = { value: 0 };
  const halo = new Mesh(
    plane(3.6, 3.6),
    shader(
      { uIntensity: haloIntensity, uColor: haloColor },
      /* glsl */ `
      uniform float uIntensity; uniform vec3 uColor; uniform float uTime; varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float angle = atan(p.y, p.x);
        float spokes = pow(max(0.0, cos(angle * 7.0 + uTime * 0.9)), 8.0);
        float spokes2 = pow(max(0.0, cos(angle * 5.0 - uTime * 0.6)), 10.0) * 0.6;
        float radial = exp(-r * r * 4.0);
        float mask = smoothstep(1.0, 0.25, r);
        vec3 col = mix(uColor, vec3(1.0), radial * 0.6);
        gl_FragColor = vec4(col, (radial * 0.85 + (spokes + spokes2) * mask * 0.55) * uIntensity);
      }`,
    ),
  );
  halo.position.set(ITEM_ANCHOR[0], ITEM_ANCHOR[1], ITEM_ANCHOR[2] - 0.2);
  group.add(halo);

  // -- Faíscas em espiral (estrelinhas de 4 pontas) -----------------------------------------------------
  const MAX = options.maxParticles ?? 120;
  const LIFE = 1.5;
  const positions = new Float32Array(MAX * 3);
  const seeds = new Float32Array(MAX * 3);
  const births = new Float32Array(MAX).fill(-100);
  for (let i = 0; i < MAX; i++) {
    seeds[i * 3] = Math.random();
    seeds[i * 3 + 1] = Math.random();
    seeds[i * 3 + 2] = Math.random();
  }
  const particleGeometry = new BufferGeometry();
  particleGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  particleGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 3));
  const birthAttribute = new BufferAttribute(births, 1);
  particleGeometry.setAttribute('aBirth', birthAttribute);
  geometries.push(particleGeometry);

  const particleMaterial = shader(
    { uColor: glowColor, uLife: { value: LIFE }, uMouth: { value: mouthY }, uScale: { value: 340 } },
    /* glsl */ `
    uniform vec3 uColor; varying float vAlpha; varying float vKind;
    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float star;
      if (vKind > 0.5) {
        float cross = max(0.0, 1.0 - abs(p.x * p.y) * 90.0);
        star = pow(cross, 3.0) * smoothstep(0.5, 0.1, length(p));
        star += exp(-dot(p, p) * 60.0);
      } else {
        star = exp(-dot(p, p) * 30.0);
      }
      gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.6), star * vAlpha);
    }`,
    /* glsl */ `
    attribute vec3 aSeed; attribute float aBirth;
    uniform float uTime; uniform float uLife; uniform float uMouth; uniform float uScale;
    varying float vAlpha; varying float vKind;
    void main() {
      float age = uTime - aBirth;
      float life = clamp(age / uLife, 0.0, 1.0);
      float alive = step(0.0, age) * step(age, uLife);
      float angle = aSeed.x * 6.2831 + age * (1.5 + aSeed.y * 2.0);
      float radius = 0.2 + life * (0.5 + aSeed.y * 1.1);
      vec3 pos = vec3(cos(angle) * radius, uMouth + life * (1.4 + aSeed.z * 2.2), sin(angle) * radius * 0.6 + 0.3);
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      float size = mix(0.06, 0.16, aSeed.z) * (1.0 - life * 0.6);
      gl_PointSize = size * uScale / max(0.5, -mv.z);
      vAlpha = alive * smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.6, 1.0, life));
      vKind = step(0.55, aSeed.x);
    }`,
  );
  const particles = new Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  group.add(particles);

  let nextParticle = 0;
  let spawnCarry = 0;
  let wasFlashing = false;

  function burst(count: number, now: number) {
    for (let i = 0; i < count; i++) {
      births[nextParticle] = now - Math.random() * 0.05;
      nextParticle = (nextParticle + 1) % MAX;
    }
    birthAttribute.needsUpdate = true;
  }

  return {
    group,
    update(frame, now, delta) {
      time.value = now;
      innerIntensity.value = Math.min(1, frame.lid * 1.2) * (0.8 + frame.rays * 0.4);
      spillIntensity.value = frame.lid * 0.45;
      rayIntensity.value = frame.rays;
      rays.rotation.z = Math.sin(now * 0.5) * 0.08;
      flashIntensity.value = frame.flash * 1.6;
      ringProgress.value = frame.ring;
      ring.scale.setScalar(0.6 + frame.ring * 6);
      haloIntensity.value = frame.item;
      halo.scale.setScalar(0.4 + frame.item * 0.6 + Math.sin(now * 2) * 0.03);

      // Rajada no clarão + fluxo contínuo enquanto o item sai
      if (frame.flash > 0.5 && !wasFlashing) burst(Math.floor(MAX * 0.45), now);
      wasFlashing = frame.flash > 0.5;
      spawnCarry += frame.particles * 45 * delta;
      const spawn = Math.floor(spawnCarry);
      if (spawn > 0) {
        spawnCarry -= spawn;
        burst(spawn, now);
      }
    },
    setColors(glow, haloHex) {
      glowColor.value.set(glow);
      haloColor.value.set(haloHex);
    },
    dispose() {
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}
