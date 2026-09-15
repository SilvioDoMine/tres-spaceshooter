import { IcosahedronGeometry, CylinderGeometry, ConeGeometry, Matrix4, Quaternion, Vector3, BufferAttribute, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 37.7) * 43758.5453; return x - Math.floor(x) }

// Rocha facetada de casca fechada. O deslocamento depende só da posição do
// vértice, então vértices coincidentes chegam ao mesmo resultado e a malha não
// se abre. Deformar por face, que seria o caminho óbvio para o visual low poly,
// separa triângulos vizinhos e deixa a pedra esburacada.
// O relevo é multiescala e leva crateras de impacto — bacia rebaixada com
// muralha erguida na borda, que é o que faz ler como rocha espacial e não como
// batata. Grava aCavity por vértice: o quanto aquele ponto afundou, usado para
// escurecer fundo de cratera e fenda, dando profundidade sem mapa de oclusão.
export function rockGeometry(seed: number, detail = 2): BufferGeometry {
  const g = new IcosahedronGeometry(1, detail)
  const p = g.getAttribute('position')
  const craters: { at: Vector3; radius: number; depth: number }[] = []
  const pits = 3 + Math.floor(rnd(seed * 5) * 4)
  for (let i = 0; i < pits; i++) {
    craters.push({
      at: new Vector3(rnd(seed + i * 11) - .5, rnd(seed + i * 13) - .5, rnd(seed + i * 17) - .5).normalize(),
      radius: .22 + rnd(seed + i * 19) * .3,
      depth: .06 + rnd(seed + i * 23) * .085,
    })
  }
  // Planos de fratura: é o que separa rocha de batata. Sem eles o deslocamento
  // radial só ondula a esfera e a silhueta continua redonda; cortando, a pedra
  // ganha faces chatas largas e quinas vivas, como fragmento quebrado.
  const cuts: { normal: Vector3; at: number }[] = []
  const breaks = 3 + Math.floor(rnd(seed * 7 + 5) * 3)
  for (let i = 0; i < breaks; i++) {
    cuts.push({
      normal: new Vector3(rnd(seed + i * 29) - .5, rnd(seed + i * 31) - .5, rnd(seed + i * 37) - .5).normalize(),
      at: .56 + rnd(seed + i * 41) * .3,
    })
  }
  // Silhueta anisotrópica, para nenhuma variante nascer esférica.
  const stretch = new Vector3(.82 + rnd(seed * 11) * .4, .7 + rnd(seed * 13) * .45, .88 + rnd(seed * 17) * .35)

  const cavity = new Float32Array(p.count)
  const dir = new Vector3(), point = new Vector3()
  for (let i = 0; i < p.count; i++) {
    dir.set(p.getX(i), p.getY(i), p.getZ(i)).normalize()
    const { x, y, z } = dir
    let swell = 1
      + .26 * Math.sin(x * 2.4 + seed) * Math.sin(y * 2.8 + seed * 1.7) * Math.sin(z * 2.1 + seed * .6)
      + .12 * Math.sin(x * 5.3 + y * 4.7 + z * 4.1 + seed * 2.1)
      + .055 * Math.sin(x * 9.4 + seed) * Math.sin(z * 8.1 + seed * 1.3)
      + .025 * Math.sin(y * 15.2 + x * 13.7 + seed * .9)
    for (const crater of craters) {
      const d = dir.distanceTo(crater.at) / crater.radius
      if (d > 1.7) continue
      swell -= crater.depth * Math.exp(-d * d * 2.1)
      swell += crater.depth * .55 * Math.exp(-Math.pow(d - 1.05, 2) * 15)
    }
    // A cavidade é medida antes do corte: senão a face de fratura inteira
    // entraria como depressão e ficaria sombreada por completo.
    cavity[i] = Math.min(1, Math.max(0, (1 - swell) * 3.4))
    point.set(x * swell * stretch.x, y * swell * stretch.y, z * swell * stretch.z)
    // Tudo que passa do plano é rebatido sobre ele: vértices coincidentes caem
    // no mesmo lugar, então a casca continua fechada.
    for (const cut of cuts) {
      const over = point.dot(cut.normal) - cut.at
      if (over > 0) point.addScaledVector(cut.normal, -over)
    }
    p.setXYZ(i, point.x, point.y, point.z)
  }
  g.setAttribute('aCavity', new BufferAttribute(cavity, 1))
  const flat = g.toNonIndexed(); g.dispose(); flat.computeVertexNormals()
  return flat
}

// Prisma hexagonal terminado em pirâmide: a forma do quartzo. Corpo reto com
// ponta é o que faz o cristal ler como cristal, e não como espinho.
function prism(radius: number, height: number): BufferGeometry {
  const body = new CylinderGeometry(radius * .92, radius, height, 6, 1).toNonIndexed()
  const tip = new ConeGeometry(radius * .92, height * .6, 6).toNonIndexed()
  tip.translate(0, height * .8, 0)
  body.deleteAttribute('uv'); tip.deleteAttribute('uv')
  const merged = mergeGeometries([body, tip])!
  body.dispose(); tip.dispose()
  return merged
}

// Pedra com drusa: cristais curtos e atarracados, bem juntos, brotando de um ou
// dois pontos — proporção de quartzo real (cerca de três vezes mais altos que
// largos), não agulha. Devolve dois grupos: 0 é a rocha, 1 são os cristais.
// O atributo aGlow guarda, por vértice, o quanto aquele ponto da rocha está
// perto de uma drusa; é o que permite acender só o entorno do cristal.
export function crystalRock(seed: number, detail = 1): BufferGeometry {
  const rock = rockGeometry(seed, detail)
  rock.deleteAttribute('uv')
  const shards: BufferGeometry[] = []
  const anchors: Vector3[] = []
  const clusters = 1 + Math.floor(rnd(seed * 3) * 2)
  const up = new Vector3(0, 1, 0)
  // A casca já saiu cortada por planos de fratura, então o raio varia por
  // direção. Assentar num raio fixo deixaria a drusa boiando fora da pedra ou
  // afundada dentro dela — daí procurar o vértice real daquele lado.
  const shell = rock.getAttribute('position')
  const probe = new Vector3()
  const seatOn = (towards: Vector3) => {
    const found = new Vector3(); let best = -Infinity
    for (let i = 0; i < shell.count; i++) {
      probe.set(shell.getX(i), shell.getY(i), shell.getZ(i))
      const facing = probe.dot(towards) / (probe.length() || 1)
      if (facing > best) { best = facing; found.copy(probe) }
    }
    return found
  }
  for (let c = 0; c < clusters; c++) {
    const s = seed * 50 + c * 17
    const anchor = new Vector3(rnd(s) - .5, rnd(s + 1) - .5, rnd(s + 2) - .5).normalize()
    const base = seatOn(anchor)
    const outward = base.clone().normalize()
    anchors.push(base.clone())
    const count = 7 + Math.floor(rnd(s + 3) * 6)
    for (let i = 0; i < count; i++) {
      const t = s + i * 7
      // Leque apertado: as pontas divergem pouco, como numa drusa de verdade.
      const dir = outward.clone()
        .add(new Vector3(rnd(t) - .5, rnd(t + 1) - .5, rnd(t + 2) - .5).multiplyScalar(.42))
        .normalize()
      const height = .14 + rnd(t + 3) * .2
      const radius = height * (.26 + rnd(t + 4) * .12)
      const geo = prism(radius, height)
      // Espalhados rente à casca, com a base enterrada na pedra.
      const spread = .1 + rnd(t + 5) * .16
      const seat = base.clone()
        .addScaledVector(new Vector3(rnd(t + 6) - .5, rnd(t + 7) - .5, rnd(t + 8) - .5).normalize(), spread)
        .addScaledVector(outward, -.06)
        .addScaledVector(dir, height * .18)
      geo.applyMatrix4(new Matrix4().compose(seat, new Quaternion().setFromUnitVectors(up, dir), new Vector3(1, 1, 1)))
      shards.push(geo)
    }
  }
  // Proximidade da drusa, por vértice: cai rápido, então o brilho fica preso
  // à volta do cristal em vez de lavar a pedra inteira.
  const pos = rock.getAttribute('position')
  const glow = new Float32Array(pos.count)
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i))
    let near = 0
    for (const anchor of anchors) near = Math.max(near, Math.exp(-v.distanceToSquared(anchor) * 7.5))
    glow[i] = near
  }
  rock.setAttribute('aGlow', new BufferAttribute(glow, 1))

  const crystals = mergeGeometries(shards)!
  shards.forEach(g => g.dispose())
  const facets = crystals.getAttribute('position').count
  crystals.setAttribute('aGlow', new BufferAttribute(new Float32Array(facets).fill(1), 1))
  crystals.setAttribute('aCavity', new BufferAttribute(new Float32Array(facets), 1))

  const merged = mergeGeometries([rock, crystals], true)!
  rock.dispose(); crystals.dispose()
  return merged
}
