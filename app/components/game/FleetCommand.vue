<script setup lang="ts">
import { Group, Mesh, MeshStandardMaterial, InstancedMesh, Object3D, Color, PlaneGeometry, ShaderMaterial, AdditiveBlending, MeshBasicMaterial, Matrix4, Vector3, TextureLoader, ClampToEdgeWrapping, DoubleSide, type BufferGeometry } from 'three'
import { buildDreadnought, buildEscort, buildFrigate } from '~/utils/fleetModels'
import { crystalRock } from '~/utils/sceneryRock'
import { disposeModel } from '~/utils/spaceModels'
import GameIceGiant from './IceGiant.vue'

// Comando da frota: a nau capitânia e sua escolta cruzam a orla de um campo de
// asteroides, com o gigante gelado ao fundo. A composição deixa o miolo da
// arena vazio — tudo que é grande fica nas bordas, como moldura.
const run = useCurrentRunStore()
const root = new Group()
const prototypes: Group[] = []
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 37.7) * 43758.5453; return x - Math.floor(x) }

// ── Frota ────────────────────────────────────────────────────────────────
// Um pivô distante: girar o grupo inteiro faz a formação descrever um arco
// largo e constante, sem nunca sair de cena nem precisar de teleporte.
// Canto superior direito (z negativo na tela), que antes ficava vazio. A
// esquadra entra em diagonal, mostrando o flanco em vez do dorso.
const armada = new Group(); armada.position.set(0, -42, 0); root.add(armada)
const formation = new Group(); formation.position.set(34, 0, -30); formation.rotation.y = -.9; armada.add(formation)

const flagship = buildDreadnought()
flagship.position.set(0, 0, 0); flagship.rotation.set(.16, -.34, .1); flagship.scale.setScalar(.95)
formation.add(flagship); prototypes.push(flagship)

// Escoltas e fragatas são clonadas dos protótipos: o clone reaproveita
// geometria e material, então a esquadra inteira não multiplica o custo.
const escortKinds = [buildEscort(0), buildEscort(1), buildEscort(2)]
const frigateKinds = [buildFrigate(0), buildFrigate(1)]
prototypes.push(...escortKinds, ...frigateKinds)
type Wing = { ship: Group; home: Vector3; bob: number; rate: number }
const wings: Wing[] = []
// Formação compacta: espalhada demais, a escolta encosta no miolo da arena.
const wingPlan = [
  [-7, 1.2, -5], [-9.5, .4, .5], [-6, -1.6, 5.5], [-11.5, 2.1, -4.5], [-13.5, -.8, 2],
  [7, 1.6, -6.5], [9.5, .6, -1.5], [7.5, -1.2, 4.5], [12.5, 1.9, 1.5], [14.5, -.6, -3.5],
]
wingPlan.forEach((slot, i) => {
  const [x, y, z] = slot as number[]
  const ship = escortKinds[i % escortKinds.length]!.clone()
  ship.position.set(x!, y!, z!)
  ship.rotation.set(.12 + rnd(i) * .08, -.34 + (rnd(i + 5) - .5) * .14, .08 + (rnd(i + 9) - .5) * .12)
  ship.scale.setScalar(.85 + rnd(i + 3) * .35)
  formation.add(ship)
  wings.push({ ship, home: ship.position.clone(), bob: .35 + rnd(i + 7) * .5, rate: .18 + rnd(i + 11) * .22 })
})
const frigatePlan = [[-17, -2.4, -9], [18, 2.8, 7], [-19, 1.4, 6]]
frigatePlan.forEach((slot, i) => {
  const [x, y, z] = slot as number[]
  const ship = frigateKinds[i % frigateKinds.length]!.clone()
  ship.position.set(x!, y!, z!)
  ship.rotation.set(.14, -.34 + (rnd(i + 2) - .5) * .2, .1 + (rnd(i + 6) - .5) * .14)
  ship.scale.setScalar(1.1 + rnd(i) * .25)
  formation.add(ship)
  wings.push({ ship, home: ship.position.clone(), bob: .5 + rnd(i) * .5, rate: .12 + rnd(i + 4) * .14 })
})

// As fendas são o único emissivo da frota; os clones compartilham o material
// dos protótipos, então pulsar aqui acende a esquadra inteira.
const fleetGlow: MeshStandardMaterial[] = []
prototypes.forEach(proto => proto.traverse((o) => {
  const material = (o as Mesh).material as MeshStandardMaterial | undefined
  if (material?.emissive && material.emissive.r + material.emissive.g + material.emissive.b > .2 && !fleetGlow.includes(material)) fleetGlow.push(material)
}))

// ── Campo de asteroides ──────────────────────────────────────────────────
// Encostado nas bordas: blocos grandes perto do spawn brigariam com a leitura
// dos projéteis, que é o erro que já custou caro no capítulo 2.
const rockGeos: BufferGeometry[] = [crystalRock(3), crystalRock(11), crystalRock(27), crystalRock(41)]
// Cada minério tem sua cor. Como o brilho vem do material, a variedade sai de
// um punhado de materiais em vez de um por pedra.
const oreColors = ['#4fd8ff', '#b06bff', '#ffb03a', '#4dffa6', '#ff5f8f']
// Cristal aceso, mas comedido: emissivo alto demais estoura em branco e vira
// lanterna. Aqui ele só se destaca da pedra e marca um ponto de cor.
function oreCrystal(color: string) {
  const m = new MeshStandardMaterial({
    color: '#1b2030', emissive: color, emissiveIntensity: .85, roughness: .07, metalness: .12, flatShading: true,
  })
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vShard;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vShard = position;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vShard;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        // Aspecto de vidro sem trocar por material transparente: a quina acende
        // por Fresnel, o corpo conduz a luz de dentro e a ponta sai mais clara,
        // como quartzo iluminado pela base.
        vec3 look = normalize(vViewPosition);
        float fres = pow(1. - clamp(dot(normal, look), 0., 1.), 2.4);
        float tip = smoothstep(.86, 1.3, length(vShard));
        totalEmissiveRadiance *= .5 + tip * .95;
        totalEmissiveRadiance += emissive * fres * 1.35;
        // Fio branco só no gume, que é o que lê como talhe de vidro.
        totalEmissiveRadiance += vec3(1.) * pow(fres, 4.) * .55;`)
  }
  return m
}
const crystalMats = oreColors.map(oreCrystal)
const rockMats = oreColors.map(oreRock)
// Pedra bem mais clara que antes: com as duas direcionais da cena, o tom
// anterior fechava em breu e o rochedo sumia contra a nebulosa.
// Um material de rocha por minério, porque cada um leva a cor da sua jazida no
// halo. O emissivo aqui é fraco e some rápido: quem acende é o cristal, e só o
// pedaço de pedra ao redor dele — nunca as rochas vizinhas.
function oreRock(color: string) {
  // Mais escura que antes: é o contraste da pedra que faz a luz do cristal
  // aparecer. Pedra clara demais e o brilho se dilui no cinza.
  const m = new MeshStandardMaterial({ color: '#414a6b', roughness: .88, metalness: .12, flatShading: true })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.oreTint = { value: new Color(color) }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aGlow;
        attribute float aCavity;
        varying float vGlow;
        varying float vCavity;
        varying vec3 vRock;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vGlow = aGlow;
        vCavity = aCavity;
        vRock = position;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 oreTint;
        varying float vGlow;
        varying float vCavity;
        varying vec3 vRock;
        float rh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float rn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
         return mix(mix(mix(rh(i),rh(i+vec3(1,0,0)),f.x),mix(rh(i+vec3(0,1,0)),rh(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(rh(i+vec3(0,0,1)),rh(i+vec3(1,0,1)),f.x),mix(rh(i+vec3(0,1,1)),rh(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        // Regolito: manchas largas de poeira clara sobre basalto, mais grão
        // fino por cima. Sem isso a face facetada fica de cor chapada.
        float dust = rn(vRock*3.1)*.6 + rn(vRock*7.4)*.3 + rn(vRock*17.)*.1;
        diffuseColor.rgb *= .74 + .52*dust;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42,.4,.46), smoothstep(.55,.9,dust)*.35);
        // Fundo de cratera e fenda ficam no escuro.
        diffuseColor.rgb *= 1. - vCavity*.45;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += oreTint * vGlow * .42;`)
  }
  return m
}
const dummy = new Object3D(), tint = new Color()
// Cada pedra tomba no próprio eixo e o aglomerado inteiro roda devagar em
// torno do seu centro: sem isso o campo lê como cenário pintado no fundo.
type Boulder = { home: Vector3; reach: number; axis: Vector3; spin: number; scale: Vector3; phase: number; sway: number }
type Belt = { mesh: InstancedMesh; rocks: Boulder[] }
const belts: Belt[] = []
// Os pivôs giram separados dos lotes: vários lotes dividem o mesmo pivô, e
// girá-lo dentro do laço de lotes multiplicaria a velocidade do aglomerado.
const swarms: { pivot: Group; drift: number }[] = []
// [centro x, centro z, raio, contagem, escala base]
const fields = [
  [-38, 24, 19, 80, 1.5], [-22, 44, 17, 60, 1.2], [32, 42, 16, 55, 1.1], [-44, -12, 15, 50, 1],
]
fields.forEach((field, fi) => {
  const [cx, cz, spread, count, scale] = field as number[]
  const pivot = new Group(); pivot.position.set(cx!, -40, cz!); root.add(pivot)
  const rocks: Boulder[] = []
  // Amostragem por rejeição: cada candidata só entra se couber sem encostar nas
  // que já estão lá. Sorteando a posição direto, as pedras nascem enfiadas umas
  // nas outras — e a rotação de cada uma deixa isso óbvio em movimento.
  for (let i = 0; i < count!; i++) {
    const size = scale! * (.5 + Math.pow(rnd(fi * 900 + i), 2) * 2.4)
    const sway = .25 + rnd(fi * 900 + i + 15) * .5
    const reach = size * 1.25 + sway
    let home: Vector3 | null = null
    for (let attempt = 0; attempt < 28 && !home; attempt++) {
      const s = fi * 7000 + i * 31 + attempt * 3
      const a = rnd(s) * Math.PI * 2, r = Math.sqrt(rnd(s + 1)) * spread!
      const candidate = new Vector3(Math.cos(a) * r, 7 - rnd(s + 2) * 18, Math.sin(a) * r)
      if (rocks.every(other => candidate.distanceTo(other.home) > other.reach + reach)) home = candidate
    }
    if (!home) continue
    const s = fi * 500 + i
    rocks.push({
      home, reach,
      axis: new Vector3(rnd(s + 3) - .5, rnd(s + 4) - .5, rnd(s + 5) - .5).normalize(),
      // Giro bem lento: rápido demais, os cristais parecem saltar de posição na
      // pedra em vez de estarem cravados nela.
      spin: (.008 + rnd(s + 12) * .022) * (rnd(s + 13) > .5 ? 1 : -1),
      scale: new Vector3(size, size * (.7 + rnd(s + 7) * .35), size * (.8 + rnd(s + 8) * .4)),
      phase: rnd(s + 14) * 6.28,
      sway,
    })
  }
  // Um mesh por minério: a geometria traz dois grupos (rocha e cristais), então
  // cada lote leva [rocha, cristal daquela cor] e o campo fica com jazidas
  // diferentes convivendo.
  swarms.push({ pivot, drift: (.008 + rnd(fi + 40) * .012) * (fi % 2 ? 1 : -1) })
  const lots = 3
  for (let lot = 0; lot < lots; lot++) {
    const slice = rocks.filter((_, i) => i % lots === lot)
    if (!slice.length) continue
    const vein = (fi + lot) % oreColors.length
    const mesh = new InstancedMesh(rockGeos[(fi + lot) % rockGeos.length]!, [rockMats[vein]!, crystalMats[vein]!], slice.length)
    slice.forEach((_, i) => {
      // instanceColor multiplica o material, então aqui é só variação de pedra
      // para pedra — algumas mais frias, outras puxando para o violeta.
      tint.setHSL(.62 + rnd(fi * 500 + lot * 90 + i + 9) * .12, .16 + rnd(fi * 500 + i + 10) * .26, .62 + rnd(fi * 500 + i + 11) * .42)
      mesh.setColorAt(i, tint)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    pivot.add(mesh)
    belts.push({ mesh, rocks: slice })
  }
})

// ── Nebulosa ─────────────────────────────────────────────────────────────
const planes: PlaneGeometry[] = []
const shaders: ShaderMaterial[] = []
function cloudLayer(y: number, size: number[], warm: number[], cool: number[], speed: number, alpha: number, lean: number) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { time: { value: 0 }, warm: { value: new Color(warm[0], warm[1], warm[2]) }, cool: { value: new Color(cool[0], cool[1], cool[2]) }, speed: { value: speed }, alpha: { value: alpha }, lean: { value: lean } },
    vertexShader: `varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 uvv;uniform float time;uniform vec3 warm;uniform vec3 cool;uniform float speed;uniform float alpha;uniform float lean;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float s=0.,a=.55;for(int i=0;i<5;i++){s+=noise(p)*a;p*=2.07;a*=.5;}return s;}
    void main(){vec2 p=uvv*2.-1.;
    float phase=mod(time*speed,6.28318530718);
    float warp=fbm(p*3.2+vec2(sin(phase)*.4,cos(phase)*.3));
    // Faixa diagonal, como a via de gás que atravessa a referência.
    float d=abs(p.y+p.x*lean+(warp-.5)*.42);
    float body=exp(-d*d*8.)*fbm(p*5.5+warp*2.4);
    float filament=exp(-d*d*620.)*(.4+.6*noise(p*17.));
    float edge=pow(max(0.,1.-dot(p,p)*.48),2.);
    vec3 c=mix(cool,warm,smoothstep(.15,.85,p.x*.5+.5+ (warp-.5)*.5))*body*1.35+cool*filament*.45;
    float border=smoothstep(0.,.26,1.-abs(p.x))*smoothstep(0.,.26,1.-abs(p.y));
    gl_FragColor=vec4(c,edge*alpha*border);}`,
  })
  const g = new PlaneGeometry(size[0]!, size[1]!); planes.push(g); shaders.push(m)
  const mesh = new Mesh(g, m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, y, 0); root.add(mesh)
}
cloudLayer(-84, [260, 210], [.72, .24, .52], [.12, .5, .68], .012, .85, .42)
cloudLayer(-104, [340, 270], [.5, .16, .42], [.08, .3, .58], .008, .55, .28)

// ── Poeira em sprite, no mesmo padrão da névoa do mapa ────────────────────
const smokeTexture = new TextureLoader().load('/images/textures/Smoke30Frames.png')
smokeTexture.wrapS = smokeTexture.wrapT = ClampToEdgeWrapping
const framesX = 6, framesY = 5, totalFrames = 30
type Puff = { origin: Vector3; spin: number; phase: number; life: number; size: number }
const puffs: Puff[] = []
for (let i = 0; i < 24; i++) {
  const a = i * 2.399, r = 22 + rnd(i + 60) * 30
  puffs.push({
    origin: new Vector3(Math.cos(a) * r, -50 - rnd(i + 80) * 14, Math.sin(a) * r),
    spin: (rnd(i) - .5) * .1, phase: rnd(i + 5), life: 30 + rnd(i) * 12, size: 18 + rnd(i + 30) * 16,
  })
}
const puffGeometry = new PlaneGeometry(1, 1)
const puffTexture = smokeTexture.clone(); puffTexture.needsUpdate = true
puffTexture.repeat.set(1 / framesX, 1 / framesY)
const puffMaterial = new MeshBasicMaterial({ map: puffTexture, transparent: true, opacity: .17, side: DoubleSide, depthWrite: false, color: new Color('#6f7cc4') })
const puffMesh = new InstancedMesh(puffGeometry, puffMaterial, puffs.length)
root.add(puffMesh)
let frame = 0, frameClock = 0

const TAU = Math.PI * 2
const CYCLE = TAU / .012
const matrix = new Matrix4(), spinM = new Matrix4(), scaleV = new Vector3(), posV = new Vector3()
useLoop().onBeforeRender(({ delta, elapsed }) => {
  if (run.gameState === 'paused') return
  const d = Math.min(delta, .05)
  shaders.forEach((s) => { s.uniforms.time!.value = (s.uniforms.time!.value + d) % CYCLE })
  // A esquadra percorre o arco; cada nave ainda flutua um pouco na formação.
  armada.rotation.y = (armada.rotation.y + d * .006) % TAU
  wings.forEach(({ ship, home, bob, rate }, i) => {
    ship.position.y = home.y + Math.sin(elapsed * rate + i) * bob
    ship.position.x = home.x + Math.sin(elapsed * rate * .6 + i * 1.7) * bob * .6
  })
  // Pulso lento nas fendas da frota, como se a esquadra respirasse.
  const glow = 1.15 + Math.sin(elapsed * .55) * .3
  fleetGlow.forEach((m) => { m.emissiveIntensity = glow })
  swarms.forEach((swarm) => { swarm.pivot.rotation.y = (swarm.pivot.rotation.y + d * swarm.drift) % TAU })
  belts.forEach(({ mesh, rocks }) => {
    rocks.forEach((rock, i) => {
      dummy.position.copy(rock.home)
      dummy.position.y += Math.sin(elapsed * .12 + rock.phase) * rock.sway
      dummy.quaternion.setFromAxisAngle(rock.axis, elapsed * rock.spin + rock.phase)
      dummy.scale.copy(rock.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  frameClock += d
  if (frameClock > .07) {
    frameClock = 0; frame = (frame + 1) % totalFrames
    puffTexture.offset.set(frame % framesX / framesX, 1 - (Math.floor(frame / framesX) + 1) / framesY)
  }
  puffs.forEach((puff, i) => {
    const t = ((elapsed / puff.life) + puff.phase) % 1
    posV.copy(puff.origin)
    const grow = puff.size * (.5 + t * .6), fade = Math.sin(t * Math.PI)
    matrix.makeRotationX(-Math.PI / 2)
    matrix.multiply(spinM.makeRotationZ(puff.spin * elapsed + i))
    matrix.setPosition(posV)
    matrix.scale(scaleV.set(grow * fade, grow * fade, 1))
    puffMesh.setMatrixAt(i, matrix)
  })
  puffMesh.instanceMatrix.needsUpdate = true
})
onUnmounted(() => {
  root.removeFromParent()
  prototypes.forEach(disposeModel)
  belts.forEach(b => b.mesh.dispose()); rockGeos.forEach(g => g.dispose())
  rockMats.forEach(m => m.dispose()); crystalMats.forEach(m => m.dispose())
  planes.forEach(g => g.dispose()); shaders.forEach(s => s.dispose())
  puffMesh.dispose(); puffGeometry.dispose(); puffMaterial.dispose(); puffTexture.dispose(); smokeTexture.dispose()
  root.clear()
})
</script>
<template>
  <primitive :object="root" />
  <TresGroup :position="[-36,-64,-20]"><GameIceGiant :radius="14" :seed="4" :tilt="1.3" /></TresGroup>
  <TresGroup :position="[42,-70,34]"><GameIceGiant :radius="11" :seed="17" :tilt="1.05" /></TresGroup>
</template>
