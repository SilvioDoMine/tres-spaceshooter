import { BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry, ConeGeometry } from 'three'
import { builder } from './spaceModels'

// Acabamentos da frota, na ordem que builder() espera: casco claro, casco
// escuro, metal polido, acento quente e as fendas emissivas.
const FLEET = ['#aab6c2', '#26303c', '#7c8fa3', '#c2553a', '#ff4d4d']

type Build = ReturnType<typeof builder>

// Fileira de fendas acesas ao longo do casco — é o que dá escala à nave: o olho
// lê o tamanho pela quantidade de janelas, não pelo volume.
function ports(b: Build, from: number, to: number, y: number, x: number, count: number, w = .12) {
  for (let i = 0; i < count; i++) b.box(w, .16, (to - from) / count * .55, 4, [x, y, from + (i + .5) * ((to - from) / count)])
}

// Torre de bateria: base giratória, tronco e canos gêmeos.
function turret(b: Build, pos: number[], scale = 1, facing = 0) {
  const [x, y, z] = pos, s = scale
  b.add(new CylinderGeometry(.42 * s, .55 * s, .3 * s, 10), 1, [x, y, z])
  b.box(.7 * s, .42 * s, .8 * s, 0, [x, y + .3 * s, z], [0, facing, 0])
  for (const side of [-1, 1]) {
    b.add(new CylinderGeometry(.07 * s, .07 * s, 1.5 * s, 8), 2,
      [x + Math.cos(facing) * side * .18 * s, y + .36 * s, z + .75 * s], [Math.PI / 2, 0, 0])
  }
}

export function buildDreadnought() {
  const b = builder(FLEET)
  const { add, box, plate } = b

  // ── Casco: perfil contínuo em cunha, três níveis escalonados ───────────
  plate([[0, -17], [1.7, -13.5], [3, -8], [3.9, -2], [4.5, 4], [4.2, 10.5], [3.3, 14.5], [-3.3, 14.5], [-4.2, 10.5], [-4.5, 4], [-3.9, -2], [-3, -8], [-1.7, -13.5]], 2.4, 1, [0, -1.2, 0], .26)
  plate([[0, -15.5], [1.25, -12], [2.3, -7], [3, -1.5], [3.4, 4], [3.1, 9.5], [2.4, 13], [-2.4, 13], [-3.1, 9.5], [-3.4, 4], [-3, -1.5], [-2.3, -7], [-1.25, -12]], .7, 0, [0, 1.2, 0], .16)
  plate([[0, -12], [.85, -9], [1.6, -4], [1.9, 2], [1.7, 7.5], [1.2, 11], [-1.2, 11], [-1.7, 7.5], [-1.9, 2], [-1.6, -4], [-.85, -9]], .55, 2, [0, 1.9, 0], .1)
  // Quilha reforçada por baixo, com nervuras transversais.
  box(1.6, .9, 26, 1, [0, -2.5, 0])
  for (let i = 0; i < 13; i++) box(5.4 - Math.abs(i - 6) * .35, .45, .4, 2, [0, -2.4, -12 + i * 2])

  // ── Superestrutura: terraços recuando até as torres ────────────────────
  const decks = [[5.2, 2.4, 7.5, 2.45], [4, 1.9, 8.8, 3.3], [2.9, 1.5, 9.8, 4.1]]
  decks.forEach((deck, i) => {
    const [w, h, z, y] = deck as number[]
    box(w!, h!, 5.2 - i * 1.1, 0, [0, y!, z!])
    box(w! + .3, .25, 5.4 - i * 1.1, 2, [0, y! - h! / 2, z!])
    for (const side of [-1, 1]) ports(b, z! - 2.2 + i * .5, z! + 2.2 - i * .5, y!, side * (w! / 2 + .02), 5 - i)
  })
  // Ponte avançada, debruçada sobre a proa.
  box(3.4, 1.3, 3.6, 0, [0, 2.5, -3.5])
  box(2.6, .5, 2.4, 2, [0, 3.3, -3.9])
  for (const side of [-1, 1]) box(.06, .5, 2.2, 4, [side * 1.72, 2.6, -3.8])
  box(2.2, .16, .1, 4, [0, 2.6, -5.3])

  // ── Torres: a silhueta que identifica a nave de comando ────────────────
  const spires = [[0, 12.5, 6.4], [-1.9, 11.2, 4.9], [1.9, 11.2, 4.9], [-3.1, 13.6, 3.6], [3.1, 13.6, 3.6]]
  spires.forEach((spire, i) => {
    const [x, z, h] = spire as number[]
    const base = 4.6
    add(new CylinderGeometry(.34, .62, h!, 6), 0, [x!, base + h! / 2, z!])
    add(new ConeGeometry(.36, h! * .5, 6), 0, [x!, base + h! + h! * .22, z!])
    for (let k = 0; k < 3; k++) add(new TorusGeometry(.42 - k * .06, .07, 5, 12), 2, [x!, base + h! * (.28 + k * .26), z!], [Math.PI / 2, 0, 0])
    box(.14, h! * .62, .14, 4, [x! + (i % 2 ? .44 : -.44), base + h! * .5, z!])
    box(.2, .2, .2, 4, [x!, base + h! * 1.48, z!])
  })
  // Contrafortes ligando as torres ao convés.
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) box(.22, 1.9, .22, 2, [side * (1.4 + i * .6), 5.4, 5.2 + i * .9], [0, 0, side * .22])

  // ── Flancos: hangares, baterias e fendas ───────────────────────────────
  for (const side of [-1, 1]) {
    // Bocas de hangar, recuadas e acesas por dentro.
    for (let i = 0; i < 3; i++) {
      const z = -5 + i * 5.4
      box(.5, 1.5, 3, 1, [side * 4.1, -1.2, z])
      box(.16, 1.1, 2.5, 4, [side * 4.36, -1.2, z])
      box(.7, .3, 3.4, 0, [side * 4.05, -.35, z])
      box(.7, .3, 3.4, 0, [side * 4.05, -2.05, z])
    }
    ports(b, -14, 12, -1.1, side * 4.53, 26, .1)
    ports(b, -11, 10, .3, side * 3.6, 14, .1)
    // Baterias principais no convés e secundárias na borda.
    turret(b, [side * 2.2, 2.2, -8.5], 1.15, side > 0 ? .3 : -.3)
    turret(b, [side * 2.6, 2.2, -1], 1.15, side > 0 ? .5 : -.5)
    turret(b, [side * 2.3, 2.9, 6.5], .9, Math.PI + (side > 0 ? -.4 : .4))
    for (let i = 0; i < 4; i++) turret(b, [side * 3.5, .3, -10 + i * 6], .5, side > 0 ? 1 : -1)
    // Aletas e antenas.
    box(.3, .12, 4.5, 0, [side * 4.3, .9, 8.5], [0, 0, side * .5])
    add(new CylinderGeometry(.04, .04, 3.2, 6), 2, [side * 3.2, 3.6, -6], [0, 0, side * .34])
    box(.5, .5, .5, 3, [side * 3.2, 5.2, -6])
    // Flanco trabalhado: em diagonal é esta face que o jogador vê, e casco liso
    // a essa distância lê como bloco chapado.
    for (let i = 0; i < 9; i++) {
      const z = -13 + i * 3.2
      box(.34, 1.9, .5, 0, [side * 4.2, -1.2, z])
      box(.2, .5, 1.5, 2, [side * 4.34, -2.1, z + .8])
    }
    for (let i = 0; i < 5; i++) {
      const z = -11 + i * 5.5
      add(new SphereGeometry(.62, 12, 8), 1, [side * 4.05, -2.3, z])
      add(new CylinderGeometry(.24, .3, .7, 8), 2, [side * 4.5, -2.3, z], [0, 0, Math.PI / 2])
      box(.16, .16, .16, 4, [side * 4.85, -2.3, z])
    }
    // Cintas estruturais contornando o casco.
    for (let i = 0; i < 4; i++) box(.5, 3.1, .34, 2, [side * 4.16, -.6, -9 + i * 6.5])
    // Escotilhas e linhas de serviço ao longo da cintura.
    for (let i = 0; i < 12; i++) box(.12, .34, .34, 3, [side * 4.6, .4, -12 + i * 2.2])
  }

  // ── Popa: motores com bocal, aro e núcleo aceso ────────────────────────
  for (const [x, size] of [[0, 1.35], [-2.5, 1.05], [2.5, 1.05], [-4.3, .75], [4.3, .75]] as number[][]) {
    add(new CylinderGeometry(size! * .8, size!, 3.4, 14), 1, [x!, -1, 15.4], [Math.PI / 2, 0, 0])
    add(new TorusGeometry(size! * .86, size! * .16, 8, 18), 2, [x!, -1, 17])
    add(new CylinderGeometry(size! * .66, size! * .66, .28, 14), 4, [x!, -1, 17.1], [Math.PI / 2, 0, 0])
    for (let i = 0; i < 6; i++) box(.16, .16, .9, 3, [x! + Math.cos(i * 1.05) * size!, -1 + Math.sin(i * 1.05) * size!, 15.6])
  }
  box(9.5, 1.8, .6, 0, [0, -1, 13.8])
  ports(b, 13.2, 14.2, .9, 0, 1, 7)

  return b.finish('Nau capitânia — comando da frota')
}

// Escolta: casco em seta com nacelles, para ler bem mesmo pequena na tela.
export function buildEscort(seed: number) {
  const b = builder(FLEET)
  const { add, box, plate } = b
  const wide = .9 + (seed % 3) * .12
  plate([[0, -3.2], [.62, -1.9], [wide, .6], [.8, 2.1], [-.8, 2.1], [-wide, .6], [-.62, -1.9]], .52, 1, [0, -.26, 0], .07)
  plate([[0, -2.4], [.34, -1.4], [.52, .4], [.42, 1.5], [-.42, 1.5], [-.52, .4], [-.34, -1.4]], .22, 0, [0, .26, 0], .04)
  box(.42, .28, .9, 0, [0, .5, .3])
  box(.3, .1, .06, 4, [0, .52, -.18])
  for (const side of [-1, 1]) {
    add(new CylinderGeometry(.17, .21, 1.5, 10), 1, [side * (wide - .16), -.2, 1.5], [Math.PI / 2, 0, 0])
    add(new TorusGeometry(.18, .04, 6, 12), 2, [side * (wide - .16), -.2, 2.2])
    add(new CylinderGeometry(.13, .13, .12, 10), 4, [side * (wide - .16), -.2, 2.26], [Math.PI / 2, 0, 0])
    box(.1, .06, 1.2, 3, [side * (wide - .5), -.05, -.4])
    box(.06, .12, .5, 4, [side * (wide - .05), -.24, .3])
  }
  add(new ConeGeometry(.16, .8, 8), 2, [0, -.26, -3.4], [-Math.PI / 2, 0, 0])
  return b.finish('Escolta')
}

// Fragata de flanco: maior que a escolta, serve de escala intermediária.
export function buildFrigate(seed: number) {
  const b = builder(FLEET)
  const { add, box, plate } = b
  plate([[0, -6.2], [.85, -4.4], [1.5, -.4], [1.7, 3], [1.3, 4.8], [-1.3, 4.8], [-1.7, 3], [-1.5, -.4], [-.85, -4.4]], .95, 1, [0, -.45, 0], .11)
  plate([[0, -4.8], [.5, -3.2], [.95, .2], [1, 3.4], [-1, 3.4], [-.95, .2], [-.5, -3.2]], .4, 0, [0, .45, 0], .07)
  box(1.1, .6, 2.2, 0, [0, .9, 1.4])
  box(.8, .22, 1.4, 2, [0, 1.3, 1.2])
  for (const side of [-1, 1]) {
    box(.06, .3, 1.1, 4, [side * .56, .92, 1.2])
    for (let i = 0; i < 6; i++) box(.08, .12, .22, 4, [side * 1.52, -.42, -3.4 + i * 1.3])
    add(new CylinderGeometry(.26, .33, 1.9, 12), 1, [side * .95, -.45, 4.6], [Math.PI / 2, 0, 0])
    add(new CylinderGeometry(.2, .2, .16, 12), 4, [side * .95, -.45, 5.6], [Math.PI / 2, 0, 0])
    box(.24, .1, 2.4, 0, [side * 1.62, .1, 2.6], [0, 0, side * .45])
  }
  turret(b, [0, .5, -2.6], .7, 0)
  turret(b, [0, .5, 2.9], .6, Math.PI)
  add(new CylinderGeometry(.04, .04, 2.2, 6), 2, [0, 1.9, .4])
  box(.16, .16, .16, 4, [0, 3.05, .4])
  return b.finish('Fragata' + (seed % 2 ? ' pesada' : ''))
}
