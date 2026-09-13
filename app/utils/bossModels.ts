import { Group, Mesh, ConeGeometry, CylinderGeometry, TorusGeometry, IcosahedronGeometry, SphereGeometry, MeshBasicMaterial, AdditiveBlending } from 'three'
import { builder } from '~/utils/spaceModels'

// Bosses dos capítulos 2 e 3. Mesmo estilo do raider: frente em -Z, raio ~1 (o size do inimigo escala),
// geometria fundida por acabamento. Cada peça animada é um builder próprio dentro de um Group (pivô).

export type BossModel = 'hive' | 'harpy' | 'bastion' | 'colossus'
export interface BossParts { [name: string]: any }
export interface BossBuild { root: Group; parts: BossParts }

type Builder = ReturnType<typeof builder>

const polygon = (sides: number, radius: number, offset = 0) =>
  Array.from({ length: sides }, (_, i) => {
    const a = offset + i * Math.PI * 2 / sides
    return [Math.cos(a) * radius, Math.sin(a) * radius]
  })

// Rotação em Y que alinha o eixo local Z com a direção (cos a, sin a) do plano XZ
const facing = (a: number) => [0, Math.PI / 2 - a, 0]

function piece(parent: Group, colors: string[], name: string, draw: (b: Builder) => void, position = [0, 0, 0]) {
  const b = builder(colors)
  draw(b)
  const pivot = new Group()
  pivot.name = name
  pivot.position.set(position[0]!, position[1]!, position[2]!)
  pivot.add(b.finish(name))
  parent.add(pivot)
  return pivot
}

function flame(parent: Group, color: string, radius: number, length: number, position: number[]) {
  const mesh = new Mesh(
    new ConeGeometry(radius, length, 10),
    new MeshBasicMaterial({ color, transparent: true, opacity: .75, depthWrite: false, blending: AdditiveBlending }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(position[0]!, position[1]!, position[2]! + length / 2)
  parent.add(mesh)
  return mesh
}

/** COLMEIA: nave-mãe hexagonal, 4 hangares com portas deslizantes e núcleo que sobe quando abrem. */
export function buildHive(): BossBuild {
  const colors = ['#7a7040', '#1a2126', '#8e9aa2', '#d8952a', '#ffb13b']
  const root = new Group(); root.name = 'Colmeia'
  const hangarAngles = [Math.PI / 6, Math.PI * 5 / 6, Math.PI * 7 / 6, Math.PI * 11 / 6]

  piece(root, colors, 'Colmeia — casco', (b) => {
    b.plate(polygon(6, 1, Math.PI / 6), .24, 0, [0, -.12, 0])
    b.plate(polygon(6, .8, Math.PI / 6), .08, 2, [0, .14, 0], .02)
    b.plate(polygon(6, .44, Math.PI / 6), .05, 1, [0, .23, 0], .015)
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + Math.PI / 6
      b.box(.07, .06, .5, 1, [Math.cos(a) * .66, .26, Math.sin(a) * .66], facing(a))
      b.box(.05, .03, .12, 3, [Math.cos(a) * .93, .14, Math.sin(a) * .93], facing(a))
    }
    // Baias dos hangares nas quatro faces diagonais
    for (const a of hangarAngles) {
      b.box(.46, .16, .26, 1, [Math.cos(a) * .76, .06, Math.sin(a) * .76], facing(a))
      b.box(.34, .04, .1, 4, [Math.cos(a) * .72, .02, Math.sin(a) * .72], facing(a))
      for (const side of [-1, 1]) b.box(.04, .2, .3, 3, [Math.cos(a) * .76 - Math.sin(a) * side * .25, .08, Math.sin(a) * .76 + Math.cos(a) * side * .25], facing(a))
    }
    // Proa com sensores e dois canhões curtos
    b.plate([[-.2, -.86], [.2, -.86], [.12, -1.12], [-.12, -1.12]], .12, 1, [0, -.02, 0], .015)
    for (const side of [-1, 1]) {
      b.add(new CylinderGeometry(.05, .06, .38, 10), 2, [side * .32, .1, -.95], [Math.PI / 2, 0, 0])
      b.add(new TorusGeometry(.055, .015, 5, 10), 3, [side * .32, .1, -1.14])
    }
    // Popa: motores
    for (const side of [-1, 1]) {
      b.add(new CylinderGeometry(.13, .16, .34, 12), 1, [side * .34, 0, .98], [Math.PI / 2, 0, 0])
      b.add(new CylinderGeometry(.11, .11, .03, 12), 4, [side * .34, 0, 1.16], [Math.PI / 2, 0, 0])
    }
    // Poço do núcleo
    b.add(new TorusGeometry(.3, .035, 6, 24), 2, [0, .29, 0], [Math.PI / 2, 0, 0])
  })

  const doors = hangarAngles.flatMap((a) => [-1, 1].map((sign) => {
    const pivot = piece(root, colors, 'Colmeia — porta', (b) => {
      b.box(.23, .04, .28, 0, [sign * .115, 0, 0])
      b.box(.02, .045, .26, 3, [sign * .02, .004, 0])
    }, [Math.cos(a) * .76, .16, Math.sin(a) * .76])
    pivot.rotation.set(0, Math.PI / 2 - a, 0)
    return { slide: pivot.children[0] as Group, sign }
  }))

  const core = piece(root, ['#3c4a2a', '#1a2126', '#8e9aa2', '#d8952a', '#a8ff5a'], 'Colmeia — núcleo', (b) => {
    b.add(new IcosahedronGeometry(.2, 1), 4)
    b.add(new TorusGeometry(.24, .02, 5, 20), 2, [0, 0, 0], [Math.PI / 2, 0, 0])
    b.add(new TorusGeometry(.24, .02, 5, 20), 2)
  }, [0, .26, 0])

  const antennas = [-1, 1].map(side => piece(root, colors, 'Colmeia — antena', (b) => {
    b.add(new CylinderGeometry(.012, .02, .5, 6), 2, [0, .25, 0])
    b.add(new SphereGeometry(.035, 8, 6), 4, [0, .52, 0])
  }, [side * .5, .2, .45]))

  const engines = new Group(); root.add(engines)
  for (const side of [-1, 1]) flame(engines, '#ffa24a', .09, .45, [side * .34, 0, 1.17])

  return { root, parts: { doors, core, antennas, engines } }
}

/** HARPIA: interceptador com asas de ave de rapina, canhões nas pontas e três motores. */
export function buildHarpy(): BossBuild {
  const colors = ['#86285a', '#17161f', '#a4a9ba', '#d9a441', '#ff4f9e']
  const root = new Group(); root.name = 'Harpia'
  const body = new Group(); root.add(body)

  piece(body, colors, 'Harpia — casco', (b) => {
    b.plate([[0, -1.2], [.12, -.85], [.2, -.35], [.25, .3], [.19, .72], [-.19, .72], [-.25, .3], [-.2, -.35], [-.12, -.85]], .2, 0, [0, -.1, 0])
    b.plate([[0, -.95], [.08, -.7], [.12, -.2], [.12, .55], [-.12, .55], [-.12, -.2], [-.08, -.7]], .07, 2, [0, .12, 0], .015)
    b.plate([[0, -.88], [.06, -.7], [.07, -.48], [-.07, -.48], [-.06, -.7]], .03, 4, [0, .2, 0], .01)
    b.plate([[-.03, .05], [.03, .05], [.05, .62], [-.05, .62]], .16, 1, [0, .17, 0], .01)
    for (let j = 0; j < 6; j++) b.box(.2, .02, .03, 1, [0, .21, -.3 + j * .12])
    for (const s of [-1, 1]) {
      // Asa principal em flecha
      b.plate([[s * .2, -.4], [s * 1.18, .18], [s * 1.26, .46], [s * .95, .42], [s * .24, .36]], .07, 0, [0, -.04, 0], .02)
      b.plate([[s * .3, -.22], [s * 1.06, .22], [s * 1.1, .36], [s * .32, .24]], .025, 2, [0, .045, 0], .01)
      // Penas: placas em camadas no bordo de fuga
      for (let k = 0; k < 4; k++) {
        const x = .32 + k * .21
        b.plate([[s * x, .26 + k * .05], [s * (x + .21), .3 + k * .05], [s * (x + .16), .66 + k * .07], [s * (x - .02), .56 + k * .05]], .035, k % 2 ? 1 : 0, [0, -.02 - k * .012, 0], .01)
        b.box(.03, .02, .22, 3, [s * (x + .09), .03, .42 + k * .06], [0, s * -.2, 0])
      }
      // Garras junto ao nariz
      b.plate([[s * .12, -.78], [s * .4, -.6], [s * .34, -.36], [s * .18, -.42]], .06, 3, [0, -.02, 0], .012)
      b.add(new CylinderGeometry(.1, .12, .36, 12), 1, [s * .19, 0, .62], [Math.PI / 2, 0, 0])
    }
    for (const x of [-.19, 0, .19]) {
      b.add(new TorusGeometry(.085, .02, 6, 14), 2, [x, x ? 0 : .06, .82])
      b.add(new CylinderGeometry(.07, .07, .03, 12), 4, [x, x ? 0 : .06, .83], [Math.PI / 2, 0, 0])
    }
    b.add(new CylinderGeometry(.08, .1, .34, 12), 1, [0, .06, .66], [Math.PI / 2, 0, 0])
  })

  const wingGuns = [-1, 1].map(side => {
    const gun = piece(body, colors, 'Harpia — canhão', (b) => {
      b.add(new CylinderGeometry(.07, .08, .46, 10), 1, [0, 0, -.05], [Math.PI / 2, 0, 0])
      b.add(new CylinderGeometry(.028, .034, .36, 8), 2, [0, 0, -.44], [Math.PI / 2, 0, 0])
      b.add(new TorusGeometry(.045, .016, 5, 10), 4, [0, 0, -.63])
      b.box(.12, .03, .2, 3, [0, .07, .02])
    }, [side * 1.12, .06, .22])
    gun.userData.side = side
    return gun
  })

  const engines = new Group(); body.add(engines)
  for (const x of [-.19, 0, .19]) flame(engines, '#ff6fb8', .07, .5, [x, x ? 0 : .06, .84])

  return { root, parts: { body, wingGuns, engines } }
}

/** BASTIÃO: plataforma octogonal, núcleo flutuante e anel de 4 escudos girando. */
export function buildBastion(): BossBuild {
  const colors = ['#3d5d7c', '#121b27', '#9db2c4', '#c7a054', '#62f2ff']
  const root = new Group(); root.name = 'Bastião'

  piece(root, colors, 'Bastião — base', (b) => {
    b.plate(polygon(8, .78, Math.PI / 8), .22, 0, [0, -.14, 0])
    b.plate(polygon(8, .56, Math.PI / 8), .1, 2, [0, .1, 0], .02)
    b.plate(polygon(8, .3, Math.PI / 8), .06, 1, [0, .2, 0], .015)
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + Math.PI / 8
      b.box(.3, .06, .05, 1, [Math.cos(a) * .66, .1, Math.sin(a) * .66], facing(a + Math.PI / 2))
    }
    // Quatro emissores nas diagonais
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4
      const at = (r: number, y: number) => [Math.cos(a) * r, y, Math.sin(a) * r]
      b.add(new CylinderGeometry(.06, .09, .34, 8), 1, at(.52, .3))
      b.add(new TorusGeometry(.07, .018, 5, 12), 3, at(.52, .36), [Math.PI / 2, 0, 0])
      b.add(new SphereGeometry(.05, 8, 6), 4, at(.52, .5))
    }
    b.add(new CylinderGeometry(.12, .2, .22, 12), 1, [0, .34, 0])
  })

  const core = piece(root, colors, 'Bastião — núcleo', (b) => {
    b.add(new IcosahedronGeometry(.24, 1), 4)
    b.add(new TorusGeometry(.32, .025, 6, 28), 2, [0, 0, 0], [Math.PI / 2, 0, 0])
    b.add(new TorusGeometry(.32, .02, 6, 28), 3, [0, 0, 0], [0, 0, Math.PI / 2])
  }, [0, .62, 0])

  const shieldRing = piece(root, colors, 'Bastião — anel de escudos', (b) => {
    b.add(new TorusGeometry(.93, .025, 6, 64), 1, [0, 0, 0], [Math.PI / 2, 0, 0])
    for (let i = 0; i < 4; i++) {
      const mid = i * Math.PI / 2
      const arc = (r: number) => Array.from({ length: 7 }, (_, k) => {
        const a = mid - .42 + k * .14
        return [Math.cos(a) * r, Math.sin(a) * r]
      })
      b.plate([...arc(.86), ...arc(1.04).reverse()], .26, 0, [0, -.12, 0], .02)
      b.plate([...arc(.9), ...arc(1).reverse()], .03, 4, [0, .16, 0], .008)
      b.box(.12, .1, .12, 2, [Math.cos(mid) * .8, 0, Math.sin(mid) * .8], facing(mid))
    }
  }, [0, .12, 0])

  return { root, parts: { core, shieldRing } }
}

/** COLOSSO: couraçado com torre de comando, 4 baterias giratórias e reator com escotilha. */
export function buildColossus(): BossBuild {
  const colors = ['#6c5a2f', '#1b191e', '#a59c8a', '#a3302a', '#ff5a26']
  const root = new Group(); root.name = 'Colosso'
  const turretSpots = [[-.3, -.72], [.3, -.72], [-.34, .18], [.34, .18]]

  piece(root, colors, 'Colosso — casco', (b) => {
    const hull = [[0, -1.28], [.28, -.9], [.48, -.25], [.54, .55], [.44, 1.08], [-.44, 1.08], [-.54, .55], [-.48, -.25], [-.28, -.9]]
    b.plate(hull, .24, 0, [0, -.18, 0])
    b.plate(hull.map(([x, z]) => [x! * .8, z! * .86 + .04]), .08, 2, [0, .08, 0], .02)
    b.plate([[0, -1.36], [.1, -1.1], [-.1, -1.1]], .12, 1, [0, -.12, 0], .015)
    // Faixas vermelhas e blindagem lateral
    for (const s of [-1, 1]) {
      b.box(.05, .12, 1.1, 3, [s * .52, -.02, .12], [0, s * .04, 0])
      for (let j = 0; j < 6; j++) b.box(.16, .1, .14, 1, [s * .5, .02, -.35 + j * .2])
      b.plate([[s * .5, .5], [s * .7, .62], [s * .68, .95], [s * .46, .98]], .12, 0, [0, -.1, 0], .015)
    }
    // Poço do reator
    b.box(.36, .06, .34, 1, [0, .15, -.27])
    b.add(new TorusGeometry(.19, .025, 6, 20), 3, [0, .18, -.27], [Math.PI / 2, 0, 0])
    // Torre de comando
    b.box(.34, .3, .38, 0, [0, .3, .62])
    b.box(.42, .08, .22, 1, [0, .48, .52])
    for (let j = 0; j < 5; j++) b.box(.05, .03, .02, 4, [-.12 + j * .06, .49, .405])
    b.add(new CylinderGeometry(.012, .02, .42, 6), 2, [0, .72, .7])
    b.box(.3, .015, .02, 2, [0, .8, .7])
    // Bases das baterias
    for (const [x, z] of turretSpots) b.add(new CylinderGeometry(.14, .16, .06, 14), 2, [x!, .15, z!])
    // Motores
    for (const x of [-.34, -.12, .12, .34]) {
      b.add(new CylinderGeometry(.1, .12, .3, 12), 1, [x, -.02, 1.12], [Math.PI / 2, 0, 0])
      b.add(new CylinderGeometry(.085, .085, .03, 12), 4, [x, -.02, 1.28], [Math.PI / 2, 0, 0])
    }
  })

  const reactor = piece(root, colors, 'Colosso — reator', (b) => {
    b.add(new SphereGeometry(.14, 16, 12), 4)
  }, [0, .16, -.27])

  const reactorHatch = [-1, 1].map(sign => {
    const hatch = piece(root, colors, 'Colosso — escotilha', (b) => {
      b.box(.18, .04, .34, 0, [sign * .09, 0, 0])
      for (let j = 0; j < 3; j++) b.box(.16, .012, .025, 1, [sign * .09, .022, -.1 + j * .1])
    }, [0, .22, -.27])
    hatch.userData.sign = sign
    return hatch
  })

  const turrets = turretSpots.map(([x, z], i) => {
    const turret = piece(root, colors, 'Colosso — bateria', (b) => {
      b.box(.2, .1, .22, 0, [0, .05, .01])
      b.box(.14, .03, .12, 3, [0, .11, .04])
      for (const side of [-1, 1]) b.add(new CylinderGeometry(.02, .026, .32, 8), 1, [side * .05, .06, -.24], [Math.PI / 2, 0, 0])
    }, [x!, .18, z!])
    turret.userData.index = i
    return turret
  })

  const engines = new Group(); root.add(engines)
  for (const x of [-.34, -.12, .12, .34]) flame(engines, '#ff7a3a', .075, .5, [x, -.02, 1.29])

  return { root, parts: { reactor, reactorHatch, turrets, engines } }
}

export const BOSS_BUILDERS: Record<BossModel, () => BossBuild> = {
  hive: buildHive,
  harpy: buildHarpy,
  bastion: buildBastion,
  colossus: buildColossus,
}
