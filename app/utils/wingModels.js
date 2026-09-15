import { Group, Mesh, BoxGeometry, CylinderGeometry, TorusGeometry, Matrix4, Quaternion, Euler, Vector3, Shape, ExtrudeGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { hullPlate } from './kestrelModel'
import { buildWingArmor } from './wingArmor'
import { SHIP_SOCKETS, WING_HARDPOINTS } from './shipSockets'

// Asas como módulo trocável. Cada variante é um modelo inteiro e independente:
// equipar não sobrepõe painel na asa anterior, substitui a peça toda.
//
// Modeladas em espaço local com a raiz na origem e o X crescendo para fora; o
// lado é aplicado espelhando X, como o casco faz. O envelope dos canhões
// diagonais é respeitado por todas, porque o combate usa coordenadas fixas.

function wingBuilder(materials, side) {
  const buckets = new Map()
  const add = (kind, geometry, position = [0, 0, 0], rotation = [0, 0, 0]) => {
    const q = new Quaternion().setFromEuler(new Euler(...rotation))
    geometry.applyMatrix4(new Matrix4().compose(new Vector3(...position), q, new Vector3(1, 1, 1)))
    if (geometry.index) { const flat = geometry.toNonIndexed(); geometry.dispose(); geometry = flat }
    geometry.deleteAttribute('uv')
    if (!buckets.has(kind)) buckets.set(kind, [])
    buckets.get(kind).push(geometry)
  }
  const mirror = points => points.map(([x, z]) => [side * x, z])
  return {
    plate: (kind, outline, bottom, top, bevel = .008) => {
      // Earcut triangulation also supports the concave Nebula blades. A fan
      // triangulation would fill their notches and produce overlapping faces.
      const points=mirror(outline), shape=new Shape()
      shape.moveTo(...points[0]); for(const p of points.slice(1)) shape.lineTo(...p)
      shape.closePath()
      const h=Math.min(bevel,(top-bottom)*.24)
      const geometry=new ExtrudeGeometry(shape,{depth:top-bottom-2*h,steps:1,bevelEnabled:true,bevelSize:h,bevelThickness:h,bevelSegments:1,curveSegments:1})
      geometry.rotateX(Math.PI/2); geometry.translate(0,top-h,0)
      add(kind,geometry)
    },
    box: (kind, [x, y, z], s) => add(kind, new BoxGeometry(...s), [side * x, y, z]),
    stud: (kind, [x, y, z], r = .003, h = .004) => add(kind, new CylinderGeometry(r, r, h, 6), [side * x, y, z]),
    ring: (kind, [x, y, z], r, tube = .006) => add(kind, new TorusGeometry(r, tube, 5, 16), [side * x, y, z]),
    tube: (kind, [x, y, z], r, length, rotation = [Math.PI / 2, 0, 0]) => add(kind, new CylinderGeometry(r, r, length, 10), [side * x, y, z], rotation),
    topRing: (kind, [x,y,z], r, tube = .004) => add(kind, new TorusGeometry(r,tube,6,24), [side*x,y,z], [Math.PI/2,0,0]),
    rail: (kind, points, radius = .003) => {
      for(let i=1;i<points.length;i++) {
        const a=new Vector3(side*points[i-1][0],points[i-1][1],points[i-1][2])
        const c=new Vector3(side*points[i][0],points[i][1],points[i][2])
        const geo=new CylinderGeometry(radius,radius,a.distanceTo(c),6)
        geo.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),c.clone().sub(a).normalize()))
        add(kind,geo,a.add(c).multiplyScalar(.5).toArray())
      }
    },
    fin: (kind, outline, bottom, top, x, bevel = .004) => add(kind, hullPlate(outline, bottom, top, bevel), [side * x, 0, 0], [0, 0, Math.PI / 2]),
    finish(name) {
      const root = new Group(); root.name = name
      for (const [kind, parts] of buckets) {
        const geometry = mergeGeometries(parts); parts.forEach(p => p.dispose())
        geometry.computeBoundingSphere()
        root.add(new Mesh(geometry, materials[kind]))
      }
      return root
    },
  }
}

// Interface universal de encaixe, conforme a prancha do sistema modular: bloco
// de 80×60×48 com travamento mecânico nas laterais, conduíte de energia ciano
// ao centro e conduíte de dados âmbar logo abaixo. É a peça que permite a mesma
// asa servir a qualquer chassi, então ela aparece igual nas duas variantes.
function mountInterface(b) {
  const w = .080, h = .060, d = .048
  b.box('structure', [.030, .004, .04], [w, h, d * 4.4])
  b.box('trim', [.030, .004 + h * .5, .04], [w * .78, .006, d * 4.2])
  // Corpo do bloco, com a face externa clara.
  b.box('armor', [.072, .004, .04], [.016, h * .82, d * 3.6])
  // Travamento mecânico: dois cilindros âmbar recuados na carcaça.
  for (const z of [-.055, .135]) {
    b.tube('structure', [.030, .004, z], .019, w * 1.04, [0, 0, Math.PI / 2])
    b.tube('amber', [.030, .004, z], .011, w * 1.12, [0, 0, Math.PI / 2])
  }
  // Conduíte de energia ao centro; o de dados corre logo abaixo dele.
  b.box('light', [.030, .026, .04], [.014, .008, .120])
  b.box('amber', [.030, -.016, .04], [.010, .006, .100])
  for (const z of [-.02, .10]) { b.stud('copper', [.004, .034, z], .005, .006) }
}

// Canhoneira diagonal: a base que sustenta os hardpoints reservados. Toda asa
// precisa dela na mesma posição, senão o tiro nasce solto no ar.
function gunSaddle(b, materials) {
  const { diagonal, lateral } = WING_HARDPOINTS
  // Trilho ancorado na parte interna da asa, que toda variante conserva. Sem
  // ele as bases boiam no vão das silhuetas recortadas — uma asa de penas ou de
  // lâminas soltas não tem superfície contínua onde apoiar a canhoneira.
  // Viga estreita ao longo dos dois pontos, mais um braço até a raiz: uma placa
  // larga aqui cobriria o desenho da asa em vez de apenas sustentar as armas.
  b.plate('structure', [[.10,.13],[.48,.29],[.48,.39],[.39,.37],[.10,.20]], -.030,.014,.004)
  b.box('structure', [diagonal.x, .014, .24], [.055, .018, .32])
  b.rail('copper',[[.12,-.036,.18],[.33,-.036,.29],[.45,-.036,.34]],.003)
  for (const [x, z, w] of [[diagonal.x, diagonal.z, .085], [lateral.x, lateral.z, .072]]) {
    const pad=[[x-w*.5,z-w*.3],[x-w*.28,z-w*.5],[x+w*.3,z-w*.5],[x+w*.5,z-w*.27],[x+w*.5,z+w*.3],[x+w*.28,z+w*.5],[x-w*.3,z+w*.5],[x-w*.5,z+w*.27]]
    b.plate('structure',pad,.015,diagonal.y-.003,.005)
    b.plate('trim',pad.map(([px,pz])=>[x+(px-x)*.76,z+(pz-z)*.76]),diagonal.y-.003,diagonal.y+.004,.002)
    b.stud('copper', [x - w * .35, diagonal.y + .006, z], .004, .005)
    b.stud('copper', [x + w * .35, diagonal.y + .006, z], .004, .005)
  }
  if (materials.light) b.box('light', [diagonal.x, diagonal.y + .004, diagonal.z - .05], [.030, .004, .012])
}

// Asa padrão: pertence ao corpo, é o que aparece com o slot vazio. Silhueta
// varrida do Kestrel, herdada do casco original.
function standardWing(b, materials) {
  mountInterface(b)
  b.plate('structure', [[0, -.26], [.587, .12], [.573, .29], [.12, .43], [0, .30]], -.040, .015, .010)
  b.plate('armor', [[.03, -.225], [.562, .131], [.547, .267], [.137, .397], [.03, .28]], .009, .041, .007)
  b.plate('paint', [[.14, -.111], [.508, .142], [.493, .239], [.166, .343]], .040, .045, .0015)
  b.plate('trim', [[.185, .350], [.526, .246], [.532, .260], [.181, .377]], .040, .047, .002)
  b.plate('armor', [[.295, .31], [.389, .29], [.415, .354], [.314, .385]], .019, .038, .005)
  b.plate('armor', [[.04, -.19], [.533, .136], [.527, .204], [.16, .264]], -.047, -.040, .002)
  b.plate('paint', [[.19, -.04], [.465, .15], [.435, .182], [.206, .22]], -.050, -.047, .001)
  b.box('structure', [.535, .049, .168], [.040, .033, .12])
  for (const z of [.126, .206]) b.box('copper', [.535, .067, z], [.029, .009, .013])
  b.fin('structure', [[.05, -.07], [.26, .22], [.275, .38], [.046, .28]], -.016, .016, .165)
  b.fin('paint', [[.064, -.041], [.251, .228], [.263, .359], [.060, .274]], -.018, .018, .165, .003)
  for (const x of [.20, .40, .54]) for (const z of [.17, .205]) b.stud('copper', [x, .050, z])
  gunSaddle(b, materials)
  return b.finish('WingStandard')
}

// Equipment wings replace the complete shell; combat alone creates weapons.
function falconWing(b, materials) {
  mountInterface(b)
  buildWingArmor(b, false)
  gunSaddle(b, materials)
  return b.finish('WingFalcon')
}
function nebulaWing(b, materials) {
  mountInterface(b)
  buildWingArmor(b, true)
  gunSaddle(b, materials)
  return b.finish('WingNebula')
}

const VARIANTS = { 'asas-falcao': falconWing, 'asas-nebula': nebulaWing }

// `variant` vazio devolve a asa que pertence ao corpo. Equipar troca o modelo
// inteiro — nunca acrescenta uma camada por cima da asa anterior.
export function buildWing(variant, side, materials) {
  const build = VARIANTS[variant] || standardWing
  const wing = build(wingBuilder(materials, side), materials)
  const [x, y, z] = SHIP_SOCKETS.wing.position
  wing.position.set(side * x, y, z)
  return wing
}

export function disposeWing(wing) {
  wing.children.forEach(mesh => mesh.geometry.dispose())
  wing.clear()
}
