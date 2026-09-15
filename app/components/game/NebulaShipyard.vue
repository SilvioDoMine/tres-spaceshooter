<script setup lang="ts">
import { Group, Mesh, MeshStandardMaterial, PlaneGeometry, ShaderMaterial, AdditiveBlending, MeshBasicMaterial, InstancedMesh, Matrix4, Vector3, TextureLoader, ClampToEdgeWrapping, DoubleSide, Color } from 'three'
import { buildDrydock, buildFoundry, buildHulk, buildScrapPiece } from '~/utils/shipyardModels'
import { disposeModel } from '~/utils/spaceModels'
import GameGasGiant from './GasGiant.vue'

// Estaleiro na nebulosa: a doca seca com o casco inacabado, a fundição que
// recicla os destroços e a poeira quente da nebulosa em volta. Tudo fica abaixo
// do plano de combate e nunca participa de colisão.
const run = useCurrentRunStore()
const root = new Group()
const models: Group[] = []
const place = (model: Group, pos: number[], rot: number[], scale = 1) => {
  model.position.set(pos[0], pos[1], pos[2]); model.rotation.set(rot[0], rot[1], rot[2]); model.scale.setScalar(scale)
  models.push(model); root.add(model); return model
}
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 37.7) * 43758.5453; return x - Math.floor(x) }

const drydock = place(buildDrydock(), [28, -26, 12], [.1, -.52, .05])
const foundry = place(buildFoundry(), [17, -35, -30], [.12, .4, -.16])
// Destroços à deriva: cada casco gira e oscila no seu próprio ritmo, senão o
// campo inteiro lê como cenário congelado.
type Drift = { model: Group; home: Vector3; spin: Vector3; sway: Vector3; rate: number }
const drifters: Drift[] = []
const adrift = (model: Group, seed: number, slow: number) => {
  drifters.push({
    model, home: model.position.clone(),
    spin: new Vector3(rnd(seed) - .5, rnd(seed + 1) - .5, rnd(seed + 2) - .5).multiplyScalar(slow),
    sway: new Vector3(rnd(seed + 3) - .5, rnd(seed + 4) - .5, rnd(seed + 5) - .5).multiplyScalar(1.4),
    rate: .1 + rnd(seed + 6) * .16,
  })
}
for (let i = 0; i < 4; i++) {
  const a = i * 1.83 + .5, r = 13 + rnd(i + 11) * 5
  adrift(place(buildHulk(i), [17 + Math.cos(a) * r, -39 - rnd(i + 3) * 4, -30 + Math.sin(a) * r], [rnd(i) * 3, rnd(i + 5) * 6, rnd(i + 9) * 3], .9 + rnd(i + 7) * .5), i * 7, .05)
}
for (let i = 0; i < 14; i++) {
  const a = i * 2.399, r = 7 + rnd(i + 300) * 9
  adrift(place(buildScrapPiece(i), [17 + Math.cos(a) * r, -37 - rnd(i + 400) * 6, -30 + Math.sin(a) * r], [i * .7, i * .4, i * .9], .7 + rnd(i + 500) * .9), 200 + i * 5, .16)
}
// O fogo da fundição é o único emissivo dela: dá para achá-lo pela cor.
const forgeGlow: MeshStandardMaterial[] = []
foundry.traverse((o) => {
  const material = (o as Mesh).material as MeshStandardMaterial | undefined
  if (material?.emissive && material.emissive.r + material.emissive.g + material.emissive.b > .2) forgeGlow.push(material)
})

// ── Nebulosa: camadas de gás desenhadas atrás de tudo ─────────────────────
const geometries = [] as { dispose(): void }[]
const shaders: ShaderMaterial[] = []
function cloudLayer(y: number, size: number[], warm: number[], cool: number[], speed: number, alpha: number) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { time: { value: 0 }, warm: { value: new Color(warm[0], warm[1], warm[2]) }, cool: { value: new Color(cool[0], cool[1], cool[2]) }, speed: { value: speed }, alpha: { value: alpha } },
    vertexShader: `varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 uvv;uniform float time;uniform vec3 warm;uniform vec3 cool;uniform float speed;uniform float alpha;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float s=0.,a=.55;for(int i=0;i<5;i++){s+=noise(p)*a;p*=2.07;a*=.5;}return s;}
    void main(){vec2 p=uvv*2.-1.;float warp=fbm(p*3.4+vec2(time*speed,time*speed*.4));
    float d=abs(p.y+p.x*.42+(warp-.5)*.36);
    float body=exp(-d*d*11.)*fbm(p*6.+warp*2.6-vec2(time*speed*1.6,0.));
    float filament=exp(-d*d*900.)*(.4+.6*noise(p*19.));
    float edge=pow(max(0.,1.-dot(p,p)*.5),2.);
    vec3 c=mix(warm,cool,warp)*body*1.3+cool*filament*.5;
    float border=smoothstep(0.,.24,1.-abs(p.x))*smoothstep(0.,.24,1.-abs(p.y));
    gl_FragColor=vec4(c,edge*alpha*border);}`,
  })
  const g = new PlaneGeometry(size[0], size[1]); geometries.push(g); shaders.push(m)
  const mesh = new Mesh(g, m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, y, 0); root.add(mesh)
}
cloudLayer(-80, [240, 190], [.6, .21, .08], [.16, .55, .7], .008, .8)
cloudLayer(-98, [320, 250], [.48, .14, .05], [.1, .32, .58], .005, .5)

// ── Poeira e fumaça em sprite, no mesmo padrão da névoa do mapa ───────────
const smokeTexture = new TextureLoader().load('/images/textures/Smoke30Frames.png')
smokeTexture.wrapS = smokeTexture.wrapT = ClampToEdgeWrapping
const framesX = 6, framesY = 5, totalFrames = 30
type Puff = { origin: Vector3; drift: Vector3; spin: number; phase: number; life: number; size: number }
type Field = { mesh: InstancedMesh; puffs: Puff[]; material: MeshBasicMaterial; texture: typeof smokeTexture; frame: number; clock: number; step: number }
const fields: Field[] = []
const puffGeometry = new PlaneGeometry(1, 1)
function smokeField(puffs: Puff[], color: string, opacity: number, step: number) {
  const texture = smokeTexture.clone(); texture.needsUpdate = true
  texture.repeat.set(1 / framesX, 1 / framesY)
  const start = Math.floor(Math.random() * totalFrames)
  texture.offset.set(start % framesX / framesX, 1 - (Math.floor(start / framesX) + 1) / framesY)
  const material = new MeshBasicMaterial({ map: texture, transparent: true, opacity, side: DoubleSide, depthWrite: false, color: new Color(color) })
  const mesh = new InstancedMesh(puffGeometry, material, puffs.length)
  const field: Field = { mesh, puffs, material, texture, frame: start, clock: 0, step }
  fields.push(field); root.add(mesh); return field
}
// Cada chaminé larga sua própria coluna, no espaço já transformado da fundição.
foundry.updateMatrix()
const stackPuffs: Puff[][] = [[], [], []]
for (let i = 0; i < 3; i++) {
  const a = i * 2.09, h = 5.4 + i * 1.5
  const mouth = new Vector3(Math.cos(a) * 4.6, -3 + h, Math.sin(a) * 4.6).applyMatrix4(foundry.matrix)
  for (let k = 0; k < 7; k++) stackPuffs[i]!.push({
    origin: mouth.clone(), drift: new Vector3(.9 + rnd(i * 9 + k) * .7, .35, -.5 - rnd(i + k) * .6),
    spin: (rnd(i * 4 + k) - .5) * .5, phase: k / 7, life: 4.5 + rnd(k) * 2, size: 3.4 + rnd(k + 20) * 2.4,
  })
}
smokeField(stackPuffs.flat(), '#e08a4a', .42, .07)
// Poeira parada da nebulosa, mais fria, envolvendo os marcos.
const hazePuffs: Puff[] = []
for (let i = 0; i < 26; i++) {
  const a = i * 2.399, r = 16 + rnd(i + 60) * 26
  hazePuffs.push({
    origin: new Vector3(10 + Math.cos(a) * r, -44 - rnd(i + 80) * 12, -12 + Math.sin(a) * r),
    drift: new Vector3(.12, 0, .05), spin: (rnd(i) - .5) * .12, phase: rnd(i + 5), life: 26 + rnd(i) * 10, size: 16 + rnd(i + 30) * 14,
  })
}
smokeField(hazePuffs, '#8d5a8f', .2, .1)

const matrix = new Matrix4(), spinM = new Matrix4(), scaleV = new Vector3(), posV = new Vector3()
useLoop().onBeforeRender(({ delta, elapsed }) => {
  if (run.gameState === 'paused') return
  const d = Math.min(delta, .05)
  shaders.forEach(s => { s.uniforms.time!.value += d })
  // Dois eixos ao mesmo tempo: só o guinada mostraria sempre a mesma face
  // superior. Com o rolamento junto, a barriga da doca também entra em vista.
  drydock.rotateY(d * .021)
  drydock.rotateZ(d * .011)
  foundry.rotateY(d * .014)
  drifters.forEach(({ model, home, spin, sway, rate }) => {
    model.rotateX(spin.x * d); model.rotateY(spin.y * d); model.rotateZ(spin.z * d)
    const t = elapsed * rate
    model.position.set(home.x + Math.sin(t) * sway.x, home.y + Math.sin(t * .7 + 1.3) * sway.y, home.z + Math.cos(t * .84) * sway.z)
  })
  const flare = .85 + Math.sin(elapsed * 1.9) * .3 + Math.sin(elapsed * 5.3) * .12
  forgeGlow.forEach(m => { m.emissiveIntensity = flare })
  fields.forEach((field) => {
    field.clock += d
    if (field.clock > field.step) {
      field.clock = 0; field.frame = (field.frame + 1) % totalFrames
      field.texture.offset.set(field.frame % framesX / framesX, 1 - (Math.floor(field.frame / framesX) + 1) / framesY)
    }
    field.puffs.forEach((puff, i) => {
      const t = ((elapsed / puff.life) + puff.phase) % 1
      posV.copy(puff.origin).addScaledVector(puff.drift, t * puff.life)
      // Cresce e esvanece conforme sobe; a escala zerada no fim faz o corte.
      const grow = puff.size * (.35 + t * .85), fade = Math.sin(t * Math.PI)
      matrix.makeRotationX(-Math.PI / 2)
      matrix.multiply(spinM.makeRotationZ(puff.spin * elapsed + i))
      matrix.setPosition(posV)
      matrix.scale(scaleV.set(grow * fade, grow * fade, 1))
      field.mesh.setMatrixAt(i, matrix)
    })
    field.mesh.instanceMatrix.needsUpdate = true
  })
})
onUnmounted(() => {
  root.removeFromParent()
  models.forEach(disposeModel)
  fields.forEach(f => { f.mesh.dispose(); f.material.dispose(); f.texture.dispose() })
  geometries.forEach(g => g.dispose()); shaders.forEach(s => s.dispose())
  puffGeometry.dispose(); smokeTexture.dispose(); root.clear()
})
</script>
<template>
  <primitive :object="root" />
  <TresGroup :position="[-32,-64,-16]"><GameGasGiant /></TresGroup>
</template>
