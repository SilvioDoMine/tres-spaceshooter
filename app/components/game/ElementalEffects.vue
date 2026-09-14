<script setup lang="ts">
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Group, InstancedBufferAttribute,
  InstancedMesh, MeshStandardMaterial, Object3D, OctahedronGeometry, PlaneGeometry, Points, ShaderMaterial, Vector3,
} from 'three'
import { ELEMENT_RULES, subscribeElementalFx } from '~/utils/elementalStatus'
import { useEnemyManager } from '~/composables/useEnemyManager'
import { useProjectileStore } from '~/stores/projectileStore'
import { useCurrentRunStore } from '~/stores/currentRunStore'

// Visual dos efeitos elementais: rastro dos projéteis, brasas/geada/faíscas nos alvos,
// carapaça de cristais no congelamento e arcos do raio em cadeia. Tudo em pools fixos.
const run = useCurrentRunStore(), projectiles = useProjectileStore(), enemies = useEnemyManager().activeEnemies
const root = new Group(), dummy = new Object3D(), UP = new Vector3(0, 1, 0), direction = new Vector3()
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]
const spawnCount = (rate: number, dt: number) => { const n = rate * dt; return Math.floor(n) + (Math.random() < n % 1 ? 1 : 0) }

// ---------------- Partículas: 0 brasa, 1 estrela de geada, 2 faísca, 3 névoa fria ----------------
const COUNT = 900
const geometry = new BufferGeometry()
const positions = new Float32Array(COUNT * 3), colors = new Float32Array(COUNT * 3), sizes = new Float32Array(COUNT), alpha = new Float32Array(COUNT), kinds = new Float32Array(COUNT)
geometry.setAttribute('position', new BufferAttribute(positions, 3))
geometry.setAttribute('tint', new BufferAttribute(colors, 3))
geometry.setAttribute('radius', new BufferAttribute(sizes, 1))
geometry.setAttribute('opacity', new BufferAttribute(alpha, 1))
geometry.setAttribute('kind', new BufferAttribute(kinds, 1))
const particleMaterial = new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { screen: { value: 640 } },
  vertexShader: `attribute vec3 tint;attribute float radius;attribute float opacity;attribute float kind;uniform float screen;
    varying vec3 c;varying float a;varying float k;
    void main(){c=tint;a=opacity;k=kind;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(radius*screen/max(1.,-p.z),1.,160.);}`,
  fragmentShader: `varying vec3 c;varying float a;varying float k;
    void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float mask;vec3 col=c;
      if(k>2.5){mask=exp(-r*r*3.)*.45;}
      else if(k>1.5){mask=exp(-r*r*12.);col=mix(c,vec3(1.),exp(-r*r*40.));}
      else if(k>.5){float star=max(exp(-abs(p.x)*42.)*exp(-abs(p.y)*5.),exp(-abs(p.y)*42.)*exp(-abs(p.x)*5.));
        mask=clamp(star+exp(-r*r*16.),0.,1.);col=mix(c,vec3(1.),exp(-r*r*30.));}
      else{mask=exp(-r*r*6.)*smoothstep(1.,.5,r);col=mix(c,vec3(1.,.9,.55),exp(-r*r*20.));}
      if(mask*a<.004)discard;gl_FragColor=vec4(col,mask*a);}`,
})
const points = new Points(geometry, particleMaterial)
points.frustumCulled = false; points.renderOrder = 4; root.add(points)
const particles = Array.from({ length: COUNT }, () => ({ age: 99, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, kind: 0 }))
const activeParticles = new Set<number>(), colorCache = new Map<string, Color>()
let cursor = 0, staticDirty = false
function emit(x: number, y: number, z: number, color: string, kind: number, size: number, life: number, vx = 0, vy = 0, vz = 0) {
  const i = cursor++ % COUNT
  Object.assign(particles[i], { age: 0, life, x, y, z, vx, vy, vz, size, kind })
  const c = colorCache.get(color) || new Color(color); colorCache.set(color, c)
  colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; kinds[i] = kind
  activeParticles.add(i); staticDirty = true
}
const EMBERS = ['#ffd36b', '#ff8a1f', '#ff4a12', '#e8260f'], FROST = ['#ffffff', '#c9f4ff', '#8fdfff'], SPARKS = ['#ffffff', '#d9c6ff', '#a98bff']

function burnAura(x: number, z: number, radius: number, dt: number) {
  for (let i = spawnCount(8 + radius * 12, dt); i > 0; i--) {
    const angle = Math.random() * 6.283, r = Math.sqrt(Math.random()) * radius
    emit(x + Math.cos(angle) * r, .6 + Math.random() * .4, z + Math.sin(angle) * r, pick(EMBERS), 0,
      .24 + Math.random() * .28, .45 + Math.random() * .35, (Math.random() - .5) * .4, 1.2, -.8 - Math.random() * .6)
  }
}
function frostAura(x: number, z: number, radius: number, dt: number) {
  for (let i = spawnCount(6 + radius * 8, dt); i > 0; i--) {
    const angle = Math.random() * 6.283, r = radius * (.5 + Math.random() * .7)
    emit(x + Math.cos(angle) * r, .8, z + Math.sin(angle) * r, pick(FROST), 1, .3 + Math.random() * .25, .6 + Math.random() * .4,
      Math.cos(angle) * .25, .2, Math.sin(angle) * .25)
  }
  for (let i = spawnCount(1.5 + radius * 1.5, dt); i > 0; i--) {
    emit(x + (Math.random() - .5) * radius, .5, z + (Math.random() - .5) * radius, '#5fc8ff', 3, radius * 2.2, 1.1, 0, 0, -.25)
  }
}
function shockAura(x: number, z: number, radius: number, dt: number) {
  for (let i = spawnCount(28, dt); i > 0; i--) {
    const angle = Math.random() * 6.283, r = radius * Math.random() * .8, speed = 2 + Math.random() * 3
    emit(x + Math.cos(angle) * r, 1, z + Math.sin(angle) * r, pick(SPARKS), 2, .18 + Math.random() * .16, .12 + Math.random() * .1,
      Math.cos(angle) * speed, 0, Math.sin(angle) * speed)
  }
}
function burst(x: number, z: number, kind: number, colorsList: string[], count: number, speedMin: number, speedMax: number, size: number, life: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 6.283, speed = speedMin + Math.random() * (speedMax - speedMin)
    emit(x, 1, z, pick(colorsList), kind, size * (.7 + Math.random() * .6), life * (.7 + Math.random() * .6), Math.cos(angle) * speed, .3, Math.sin(angle) * speed)
  }
}

// ---------------- Carapaça de gelo: cristais apontando para fora do casco ----------------
const SHARDS_PER_TARGET = 10, MAX_SHARDS = 480
const shardGeometry = new OctahedronGeometry(1, 0)
const shardMaterial = new MeshStandardMaterial({
  color: '#e4f9ff', emissive: '#3fc4ff', emissiveIntensity: .6, metalness: .05, roughness: .12,
  transparent: true, opacity: .8, flatShading: true, depthWrite: false,
})
const shards = new InstancedMesh(shardGeometry, shardMaterial, MAX_SHARDS)
shards.instanceMatrix.setUsage(DynamicDrawUsage); shards.frustumCulled = false; shards.count = 0; root.add(shards)
function iceShell(x: number, z: number, radius: number, seed: number, freeze: any, count: number) {
  const grow = Math.min(1, (freeze.duration - freeze.remaining) / .14)
  for (let i = 0; i < SHARDS_PER_TARGET && count < MAX_SHARDS; i++) {
    const h1 = hash(seed + i * 7.13), h2 = hash(seed * 1.7 + i * 3.1)
    const angle = i / SHARDS_PER_TARGET * 6.283 + h1 * .5, r = radius * (.35 + .35 * h2)
    direction.set(Math.cos(angle), .45 + h1 * .6, Math.sin(angle)).normalize()
    dummy.position.set(x + Math.cos(angle) * r, .35 + h2 * .3, z + Math.sin(angle) * r)
    dummy.quaternion.setFromUnitVectors(UP, direction)
    const s = radius * grow
    dummy.scale.set(.1 * s + .03, (.42 + .3 * h1) * s, .1 * s + .03)
    dummy.updateMatrix(); shards.setMatrixAt(count++, dummy.matrix)
  }
  return count
}

// ---------------- Arcos de raio: segmentos instanciados em zigue-zague ----------------
const MAX_SEGMENTS = 400
const arcGeometry = new PlaneGeometry(1, 1); arcGeometry.rotateX(-Math.PI / 2)
const arcFade = new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS), 1).setUsage(DynamicDrawUsage)
arcGeometry.setAttribute('fade', arcFade)
const arcMaterial = new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending, side: 2,
  vertexShader: `attribute float fade;varying float f;varying vec2 v;void main(){f=fade;v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
  fragmentShader: `varying float f;varying vec2 v;void main(){float x=abs(v.x-.5);float core=exp(-x*x*260.);float glow=exp(-x*x*14.)*.55;
    float a=(core+glow)*f;if(a<.004)discard;gl_FragColor=vec4(mix(vec3(.5,.38,1.),vec3(1.),core),a);}`,
})
const arcs = new InstancedMesh(arcGeometry, arcMaterial, MAX_SEGMENTS)
arcs.instanceMatrix.setUsage(DynamicDrawUsage); arcs.frustumCulled = false; arcs.count = 0; arcs.renderOrder = 5; root.add(arcs)
let segmentCount = 0
function segment(ax: number, az: number, bx: number, bz: number, width: number, fade: number) {
  const dx = bx - ax, dz = bz - az, length = Math.hypot(dx, dz)
  if (segmentCount >= MAX_SEGMENTS || length < .001) return
  dummy.position.set((ax + bx) / 2, 1.1, (az + bz) / 2)
  dummy.rotation.set(0, Math.atan2(dx, dz), 0)
  dummy.scale.set(width, 1, length + width * .3)
  dummy.updateMatrix(); arcs.setMatrixAt(segmentCount, dummy.matrix); arcFade.setX(segmentCount, fade); segmentCount++
}
function bolt(ax: number, az: number, bx: number, bz: number, seed: number, width: number, fade: number, jitter: number) {
  const length = Math.hypot(bx - ax, bz - az) || 1
  const steps = Math.max(3, Math.min(12, Math.round(length / .5)))
  const nx = -(bz - az) / length, nz = (bx - ax) / length
  let px = ax, pz = az
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, offset = i === steps ? 0 : (hash(seed + i * 1.37) - .5) * 2 * jitter * Math.min(1, length * .25)
    const qx = ax + (bx - ax) * t + nx * offset, qz = az + (bz - az) * t + nz * offset
    segment(px, pz, qx, qz, width, fade); px = qx; pz = qz
  }
}
function crackle(x: number, z: number, radius: number, seed: number, fade: number) {
  for (let i = 0; i < 3; i++) {
    const angle = hash(seed + i * 5.1) * 6.283, r = radius * (.7 + .5 * hash(seed + i * 2.3))
    bolt(x, z, x + Math.cos(angle) * r, z + Math.sin(angle) * r, seed + i * 11, .16, fade, .35)
  }
}

// ---------------- Eventos: cadeia de raio, congelar, quebrar o gelo ----------------
type Chain = { points: { x: number; z: number }[]; ttl: number; life: number; seed: number }
let chains: Chain[] = []
const unsubscribe = subscribeElementalFx((event: any) => {
  if (event.kind === 'chain') {
    chains.push({ points: event.points, ttl: .3, life: .3, seed: Math.random() * 1000 })
    for (const point of event.points) burst(point.x, point.z, 2, SPARKS, 10, 2, 5, .22, .18)
  } else if (event.kind === 'freeze') {
    burst(event.x, event.z, 1, FROST, 14, .6, 2.2, .4, .6)
    for (let i = 0; i < 3; i++) emit(event.x, .5, event.z, '#5fc8ff', 3, (event.size || 1) * 2.4, .7)
  } else if (event.kind === 'shatter') {
    burst(event.x, event.z, 1, FROST, 22, 3, 6.5, .45, .6)
    burst(event.x, event.z, 2, ['#ffffff', '#bff1ff'], 10, 4, 8, .2, .25)
  }
})

const seeds = new Map<string, number>()
function seedOf(id: string) {
  let seed = seeds.get(id)
  if (seed === undefined) {
    if (seeds.size > 600) seeds.clear()
    seed = [...id].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 17) % 9973
    seeds.set(id, seed)
  }
  return seed
}

let time = 0
useGameLoop().onBeforeRender(({ delta }) => {
  const paused = Boolean(run.currentStage) && !run.isPlaying && run.currentHealth > 0
  const dt = paused ? 0 : Math.min(delta, .05)
  time += dt
  particleMaterial.uniforms.screen.value = window.innerHeight * Math.min(window.devicePixelRatio, 1.5) * 2
  segmentCount = 0
  let shardCount = 0
  const flicker = Math.floor(time / .045)

  // Rastro dos projéteis elementais (orçamento global para rajadas grandes)
  if (dt > 0) {
    let elemental = 0
    for (const p of projectiles.projectiles) if (p.elements && !(p.spawnDelay > 0) && !p.beam) elemental++
    const budget = Math.min(1, 30 / Math.max(1, elemental))
    if (elemental) for (const p of projectiles.projectiles) {
      if (!p.elements || p.spawnDelay > 0 || p.beam) continue
      const y = p.ownerType === 'player' ? (p.position.y ?? 0) + .1 : 1
      const bx = p.position.x - p.direction.x * .35, bz = p.position.z - p.direction.z * .35
      const sx = -p.direction.z, sz = p.direction.x
      if (p.elements.fire) for (let i = spawnCount(38 * budget, dt); i > 0; i--) {
        const side = (Math.random() - .5) * .12
        emit(bx + sx * side, y, bz + sz * side, pick(EMBERS), 0, .2 + Math.random() * .14, .25 + Math.random() * .15,
          -p.direction.x * 1.5 + (Math.random() - .5) * .5, .4, -p.direction.z * 1.5 - .5)
      }
      if (p.elements.ice) for (let i = spawnCount(22 * budget, dt); i > 0; i--) {
        const side = (Math.random() - .5) * .18
        emit(bx + sx * side, y, bz + sz * side, pick(FROST), 1, .17 + Math.random() * .13, .35 + Math.random() * .2, sx * side * 2, 0, sz * side * 2)
      }
      if (p.elements.lightning) for (let i = spawnCount(28 * budget, dt); i > 0; i--) {
        const side = (Math.random() - .5) * .5, speed = (Math.random() - .5) * 4
        emit(bx + sx * side, y, bz + sz * side, pick(SPARKS), 2, .15 + Math.random() * .1, .12 + Math.random() * .08, sx * speed, 0, sz * speed)
      }
    }
  }

  // Alvos afetados: inimigos e a nave do jogador
  const affected = (x: number, z: number, radius: number, seed: number, state: any) => {
    if (dt > 0) {
      if (state.burn) burnAura(x, z, radius, dt)
      if (state.freeze) frostAura(x, z, radius, dt)
      if (state.shock > 0) shockAura(x, z, radius, dt)
    }
    if (state.freeze) shardCount = iceShell(x, z, radius, seed, state.freeze, shardCount)
    if (state.shock > 0) crackle(x, z, radius, seed + flicker * 13, Math.min(1, state.shock / ELEMENT_RULES.lightning.shockTime))
  }
  for (const enemy of enemies.value) {
    if (enemy.state !== 'active' || !enemy.elementState) continue
    affected(enemy.position.x, enemy.position.z, (enemy.size || 1) * .6, seedOf(enemy.id), enemy.elementState)
  }
  if (run.currentHealth > 0) {
    const state = run.getPlayerElements(), player = run.getPlayerPosition()
    if (state.burn || state.freeze || state.shock > 0) affected(player.x, player.z, .9, 7, state)
  }

  // Raio em cadeia: dois fios por salto, redesenhados em tremulação rápida
  chains = chains.filter(chain => (chain.ttl -= dt) > 0)
  for (const chain of chains) {
    const fade = Math.max(0, chain.ttl / chain.life)
    for (let i = 1; i < chain.points.length; i++) {
      const a = chain.points[i - 1], b = chain.points[i], seed = chain.seed + i * 31 + flicker * 7
      bolt(a.x, a.z, b.x, b.z, seed, .34, fade, .32)
      bolt(a.x, a.z, b.x, b.z, seed + 97, .13, fade * .7, .6)
    }
  }

  if (dt > 0) for (const i of activeParticles) {
    const p = particles[i]; p.age += dt
    if (p.age >= p.life) { alpha[i] = 0; activeParticles.delete(i); continue }
    const t = p.age / p.life, drag = Math.exp(-dt * (p.kind === 2 ? 4 : 1.6))
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= drag; p.vz *= drag
    positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z
    sizes[i] = p.size * (p.kind === 3 ? 1 + t : p.kind === 1 ? .6 + .4 * Math.sin(t * Math.PI) : 1 - t * .6)
    alpha[i] = p.kind === 3 ? Math.sin(t * Math.PI) * .35 : p.kind === 1 ? Math.sin(t * Math.PI) : Math.pow(1 - t, 1.2)
  }
  for (const name of ['position', 'radius', 'opacity']) geometry.getAttribute(name).needsUpdate = true
  if (staticDirty) { geometry.getAttribute('tint').needsUpdate = true; geometry.getAttribute('kind').needsUpdate = true; staticDirty = false }
  shards.count = shardCount; shards.instanceMatrix.needsUpdate = true
  arcs.count = segmentCount; arcs.instanceMatrix.needsUpdate = true; arcFade.needsUpdate = true
})

onUnmounted(() => {
  unsubscribe()
  geometry.dispose(); particleMaterial.dispose()
  shards.dispose(); shardGeometry.dispose(); shardMaterial.dispose()
  arcs.dispose(); arcGeometry.dispose(); arcMaterial.dispose()
})
</script>

<template><primitive :object="root" /></template>
