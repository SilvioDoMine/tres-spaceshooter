import { BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry, ConeGeometry } from 'three'
import { builder } from './spaceModels'

// Acabamentos do estaleiro, na ordem que builder() espera: chapa clara, casco
// escuro, metal polido (recebe metalness alto), latão de sinalização e emissivo.
const FINISH = ['#93a6b4', '#22303f', '#5d8298', '#c08343', '#7fe3ff']
// A fundição é o lado sujo do estaleiro: chapa encardida e o emissivo vira
// fogo, não a sinalização fria que a doca usa.
const FORGE = ['#7f6d5f', '#2b2320', '#6d5c4d', '#c07a35', '#ff7a2a']

type Build = ReturnType<typeof builder>

// Viga treliçada entre dois pontos do eixo X: dois banzos, montantes e diagonais
// alternadas. É o que dá leitura de estrutura em vez de barra maciça.
function truss(b: Build, from: number, to: number, y: number, z: number, depth: number, step: number) {
  const len = to - from, mid = (from + to) / 2
  b.box(len, .22, .22, 1, [mid, y + depth / 2, z])
  b.box(len, .22, .22, 1, [mid, y - depth / 2, z])
  const n = Math.floor(len / step)
  const ang = Math.atan2(depth, step), diag = Math.hypot(depth, step)
  for (let i = 0; i < n; i++) {
    b.box(diag, .1, .1, 2, [from + i * step + step / 2, y, z], [0, 0, i % 2 ? ang : -ang])
    b.box(.12, depth, .12, 2, [from + i * step, y, z])
  }
  b.box(.12, depth, .12, 2, [to, y, z])
}

// Corrimão de passarela: montantes curtos e duas barras horizontais.
function railing(b: Build, from: number, to: number, y: number, z: number) {
  b.box(to - from, .05, .05, 2, [(from + to) / 2, y + .46, z])
  b.box(to - from, .04, .04, 2, [(from + to) / 2, y + .24, z])
  for (let i = 0; i <= Math.floor((to - from) / .8); i++) b.box(.05, .5, .05, 2, [from + i * .8, y + .25, z])
}

// Painel fotovoltaico com moldura, células nas duas faces e nervuras.
function solarPanel(b: Build, pos: number[], w: number, h: number, cols: number, rows: number) {
  const [x, y, z] = pos
  b.box(w, .1, h, 1, [x, y, z])
  b.box(w + .14, .16, h + .14, 0, [x, y - .04, z])
  for (let u = 0; u < cols; u++) for (let v = 0; v < rows; v++) for (const face of [-1, 1])
    b.box(w / cols - .06, .02, h / rows - .06, 2, [x - w / 2 + (u + .5) * (w / cols), y + face * .07, z - h / 2 + (v + .5) * (h / rows)])
  for (let u = 0; u <= cols; u++) b.box(.04, .12, h, 0, [x - w / 2 + u * (w / cols), y, z])
}

export function buildDrydock() {
  const b = builder(FINISH)
  const { add, box } = b

  // ── Quilha: três vigas treliçadas amarradas por travessas ──────────────
  for (const z of [-2.6, 0, 2.6]) truss(b, -12, 12, -6.9, z, 1.25, 1.5)
  for (let i = 0; i <= 16; i++) {
    const x = -12 + i * 1.5
    for (const y of [-6.28, -7.52]) box(.16, .16, 5.4, 2, [x, y, 0])
    if (i % 2 === 0) box(.3, .3, .3, 3, [x, -6.28, 0])
  }
  // Piso da doca, com juntas e rebites de fixação.
  box(24, .2, 5.9, 0, [0, -7.72, 0])
  for (let i = 0; i < 12; i++) box(.1, .24, 5.9, 1, [-11 + i * 2, -7.66, 0])
  for (let i = 0; i < 25; i++) for (const z of [-2.7, 2.7]) box(.16, .1, .16, 3, [-12 + i, -7.84, z])
  // Trilhos por onde os pórticos correm.
  for (const z of [-2.2, 2.2]) { box(24, .16, .3, 2, [0, -6.05, z]); for (let i = 0; i < 32; i++) box(.16, .1, .6, 1, [-11.6 + i * .75, -6.16, z]) }

  // ── Seis pórticos de gantry ────────────────────────────────────────────
  for (let g = 0; g < 6; g++) {
    const x = -9.6 + g * 3.85, r = 6.1, small = g === 0 || g === 5
    const rad = small ? r * .82 : r
    add(new TorusGeometry(rad, .26, 10, 40, Math.PI * 1.06), 0, [x, -6.1, 0], [0, Math.PI / 2, -Math.PI * .03])
    add(new TorusGeometry(rad, .07, 6, 40, Math.PI * 1.06), 2, [x, -6.1, .34], [0, Math.PI / 2, -Math.PI * .03])
    add(new TorusGeometry(rad, .07, 6, 40, Math.PI * 1.06), 2, [x, -6.1, -.34], [0, Math.PI / 2, -Math.PI * .03])
    // Nervuras radiais e luminárias voltadas para dentro do berço.
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI * .03 + i * (Math.PI * 1.06 / 12)
      const y = -6.1 + Math.cos(a) * rad, z = Math.sin(a) * rad
      box(.34, .5, .82, 1, [x, y, z], [a, 0, 0])
      if (i % 2 === 0) box(.2, .26, .2, 4, [x, y - Math.cos(a) * .5, z - Math.sin(a) * .5], [a, 0, 0])
      if (i % 3 === 0) box(.5, .2, .24, 3, [x, y, z], [a, 0, 0])
    }
    // Pernas com pé de apoio sobre o trilho.
    for (const s of [-1, 1]) {
      box(.58, 1.5, .58, 1, [x, -6.7, s * rad * .99])
      box(.9, .26, 1.1, 0, [x, -6.05, s * rad * .99])
      box(.26, .9, .26, 2, [x, -6.6, s * (rad * .99 - .5)], [0, 0, .4])
    }
  }

  // ── Casco em construção, preso no berço ────────────────────────────────
  const hy = -4.4
  // Perfil contínuo com chanfro (como os cascos do capítulo 1), em três níveis.
  b.plate([[0, -9.4], [1.5, -7.6], [2.35, -3], [2.5, 2.6], [2, 6.2], [-2, 6.2], [-2.5, 2.6], [-2.35, -3], [-1.5, -7.6]], 1.9, 1, [0, hy - .95, 0], .18)
  b.plate([[0, -8.4], [1.15, -6.9], [1.8, -2.8], [1.9, 2.4], [1.5, 5.2], [-1.5, 5.2], [-1.9, 2.4], [-1.8, -2.8], [-1.15, -6.9]], .5, 0, [0, hy + .95, 0], .12)
  b.plate([[0, -6.2], [.85, -5], [1.15, -1.4], [1.1, 2.6], [-1.1, 2.6], [-1.15, -1.4], [-.85, -5]], .42, 2, [0, hy + 1.45, 0], .08)
  // Superestrutura: ponte, janelas e mastro.
  box(2.2, .85, 2.9, 0, [0, hy + 2.1, 1.1])
  box(1.5, .5, 1.9, 1, [0, hy + 2.7, 1.1])
  for (let i = 0; i < 5; i++) box(.3, .26, .06, 4, [-.6 + i * .3, hy + 2.7, .12])
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) box(.06, .22, .3, 4, [s * .78, hy + 2.7, .6 + i * .45])
  add(new CylinderGeometry(.05, .08, 2.2, 8), 2, [0, hy + 4, 1.4])
  box(.16, .16, .16, 4, [0, hy + 5.1, 1.4])
  // Blindagem já instalada: chapas com folga entre elas, deixando ver a estrutura.
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) {
    const z = -6.6 + i * 1.5
    box(.34, 1.5, 1.34, 0, [s * 2.28, hy - .9, z])
    box(.1, .5, 1.2, 2, [s * 2.46, hy - .9, z])
    for (let k = 0; k < 3; k++) box(.12, .12, .12, 3, [s * 2.46, hy - 1.4 + k * .5, z])
  }
  // Popa ainda aberta: cavernas expostas e quilha à mostra.
  for (let i = 0; i < 6; i++) {
    const z = 6.4 + i * 1.15, w = 2.25 - i * .17
    add(new TorusGeometry(w, .12, 6, 20, Math.PI), 2, [0, hy - .9, z], [0, 0, Math.PI])
    box(w * 2, .18, .18, 1, [0, hy - 1.9, z])
    box(.3, .34, .34, 1, [0, hy - .9, z])
  }
  box(.4, .5, 7.4, 1, [0, hy - 1.95, 9.4])
  for (let i = 0; i < 5; i++) box(1.4, .2, .2, 2, [0, hy - 1.2, 7 + i * 1.15])
  // Motores com bocal e anel de contenção.
  for (const s of [-1, 0, 1]) {
    const x = s * 1.25
    add(new CylinderGeometry(.62, .8, 1.9, 14), 1, [x, hy - .9, 12.1], [Math.PI / 2, 0, 0])
    add(new TorusGeometry(.66, .1, 8, 18), 2, [x, hy - .9, 13])
    add(new CylinderGeometry(.5, .5, .2, 14), 4, [x, hy - .9, 13.1], [Math.PI / 2, 0, 0])
    for (let i = 0; i < 6; i++) box(.1, .1, .5, 3, [x + Math.cos(i * 1.05) * .7, hy - .9 + Math.sin(i * 1.05) * .7, 12.2])
  }

  // ── Guindastes de pórtico ──────────────────────────────────────────────
  for (const [cx, cz, dir] of [[-7.4, 4.6, 1], [5.2, -4.6, -1]] as number[][]) {
    box(1.5, .5, 1.5, 0, [cx, -5.9, cz])
    add(new CylinderGeometry(.62, .82, 1.5, 12), 1, [cx, -5.1, cz])
    truss(b, -.45, .45, -2.6, cz, 4.4, 1.1)
    for (const s of [-1, 1]) box(.16, 4.6, .16, 2, [cx + s * .45, -2.6, cz + s * .45])
    box(1.6, 1.1, 1.5, 1, [cx, -.2, cz])
    box(1.1, .6, .06, 4, [cx, -.1, cz + dir * .78])
    // Lança treliçada com cabo e gancho.
    const reach = 5.6
    for (const s of [-1, 1]) box(reach, .14, .14, 1, [cx + dir * reach / 2, .35 + s * .32, cz])
    for (let i = 0; i < 7; i++) box(.92, .08, .08, 2, [cx + dir * (.4 + i * .78), .35, cz], [0, 0, i % 2 ? .7 : -.7])
    box(1.5, .7, .9, 1, [cx - dir * 1, .5, cz])
    add(new CylinderGeometry(.02, .02, 2.6, 6), 2, [cx + dir * 5.1, -.95, cz])
    box(.42, .34, .42, 3, [cx + dir * 5.1, -2.4, cz])
    add(new TorusGeometry(.2, .06, 6, 14), 2, [cx + dir * 5.1, -2.75, cz], [Math.PI / 2, 0, 0])
  }

  // ── Módulos de serviço, passarelas e utilidades ────────────────────────
  for (let i = 0; i < 4; i++) {
    const x = -8.2 + i * 5.5
    box(2.3, 1.7, 2.3, 1, [x, -9.4, 0])
    box(2.45, .22, 2.45, 0, [x, -8.6, 0])
    for (const s of [-1, 1]) {
      box(.9, .55, .06, 4, [x, -9.3, s * 1.18])
      add(new TorusGeometry(.32, .07, 6, 16), 3, [x + s * 1.16, -9.7, 0], [0, Math.PI / 2, 0])
    }
    add(new CylinderGeometry(.16, .16, 1.4, 8), 2, [x, -8.1, 0])
    for (let k = 0; k < 4; k++) box(.14, .1, .14, 3, [x - .8 + k * .53, -8.52, 1.1])
  }
  for (const z of [-3.4, 3.4]) { box(22, .14, 1.5, 0, [0, -7.2, z]); railing(b, -11, 11, -7.2, z + (z > 0 ? .7 : -.7)) }
  // Dutos correndo por baixo do piso.
  for (const z of [-1.5, 1.5]) {
    add(new CylinderGeometry(.22, .22, 22, 10), 2, [0, -8.1, z], [0, 0, Math.PI / 2])
    for (let i = 0; i < 11; i++) add(new TorusGeometry(.26, .05, 6, 12), 3, [-10 + i * 2, -8.1, z], [0, Math.PI / 2, 0])
  }
  // Painéis de energia nas laterais.
  solarPanel(b, [3, -7.4, -9.2], 9, 3.6, 8, 3)
  solarPanel(b, [3, -7.4, 9.2], 9, 3.6, 8, 3)
  for (const z of [-6.4, 6.4]) truss(b, 0, 6.2, -7.4, z, .7, 1)
  // Balizas de trabalho ao longo de toda a doca.
  for (let i = 0; i < 16; i++) for (const z of [-3.1, 3.1]) box(.24, .14, .14, 4, [-11.2 + i * 1.5, -6.9, z])

  return b.finish('Doca seca — casco em construção')
}

export function buildFoundry() {
  const b = builder(FORGE)
  const { add, box } = b

  // ── Base octogonal com contrafortes ────────────────────────────────────
  add(new CylinderGeometry(5.2, 6.4, 1.9, 8), 1, [0, -4.6, 0])
  add(new CylinderGeometry(5.3, 5.3, .22, 8), 0, [0, -3.6, 0])
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, x = Math.cos(a) * 5.1, z = Math.sin(a) * 5.1
    box(1.1, 2.3, .5, 0, [x, -4.5, z], [0, -a, .18])
    box(.34, .34, .34, 3, [x, -3.4, z])
  }
  // ── Cuba: nervuras verticais, aro e boca incandescente ─────────────────
  add(new CylinderGeometry(3.3, 4.5, 4, 8), 1, [0, -1.6, 0])
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + .39
    box(.4, 4.1, .34, 0, [Math.cos(a) * 3.95, -1.6, Math.sin(a) * 3.95], [0, -a, .08])
  }
  add(new TorusGeometry(3.32, .24, 8, 32), 2, [0, .38, 0], [Math.PI / 2, 0, 0])
  // Colarinho escuro contendo a massa fundida, que fica afundada na cuba: o
  // brilho precisa vir de dentro, não de um disco chapado na tampa.
  add(new CylinderGeometry(3.15, 2.95, .6, 8), 1, [0, .1, 0])
  add(new CylinderGeometry(2.5, 2.1, .9, 8), 4, [0, -.4, 0])
  // Calhas de vazamento saindo da cuba.
  for (let i = 0; i < 3; i++) {
    const a = i * 2.09 + .6
    box(2.6, .3, .8, 1, [Math.cos(a) * 4.4, -.4, Math.sin(a) * 4.4], [0, -a, .22])
    box(2.2, .12, .5, 4, [Math.cos(a) * 4.4, -.32, Math.sin(a) * 4.4], [0, -a, .22])
  }
  // ── Chaminés com anéis, escada e boca quente ───────────────────────────
  for (let i = 0; i < 3; i++) {
    const a = i * 2.09, x = Math.cos(a) * 4.6, z = Math.sin(a) * 4.6, h = 5.4 + i * 1.5
    add(new CylinderGeometry(.66, .92, h, 12), 1, [x, -3 + h / 2, z])
    for (let k = 0; k < 4; k++) add(new TorusGeometry(.72 + .04 * (3 - k), .08, 6, 16), 2, [x, -2.6 + k * (h / 4.4), z], [Math.PI / 2, 0, 0])
    add(new TorusGeometry(.7, .12, 8, 16), 3, [x, -3 + h - .2, z], [Math.PI / 2, 0, 0])
    add(new CylinderGeometry(.58, .58, .22, 12), 4, [x, -3 + h - .05, z])
    for (let k = 0; k < 9; k++) box(.5, .06, .06, 2, [x + .78, -2.6 + k * (h / 10), z])
    box(.06, h * .9, .06, 2, [x + 1, -3 + h / 2, z])
  }
  // ── Tanques de liga com cintas e válvulas ──────────────────────────────
  for (let i = 0; i < 4; i++) {
    const a = i * 1.57 + .78, x = Math.cos(a) * 6.9, z = Math.sin(a) * 6.9
    add(new CylinderGeometry(1.15, 1.15, 2.6, 14), 0, [x, -3.4, z])
    add(new SphereGeometry(1.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, [x, -2.1, z])
    add(new SphereGeometry(1.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, [x, -4.7, z], [Math.PI, 0, 0])
    for (const y of [-2.8, -4]) add(new TorusGeometry(1.18, .07, 6, 18), 2, [x, y, z], [Math.PI / 2, 0, 0])
    add(new CylinderGeometry(.16, .16, .7, 8), 3, [x, -1.7, z])
    add(new TorusGeometry(.24, .06, 6, 12), 3, [x, -1.4, z], [Math.PI / 2, 0, 0])
    // Duto ligando o tanque à cuba.
    const dx = Math.cos(a) * 5.4, dz = Math.sin(a) * 5.4
    add(new CylinderGeometry(.2, .2, 2.8, 10), 2, [dx, -3.9, dz], [0, -a, Math.PI / 2])
    box(.42, .42, .42, 3, [x - Math.cos(a) * 1.2, -3.9, z - Math.sin(a) * 1.2])
  }
  // ── Passarela anelar com corrimão ──────────────────────────────────────
  add(new TorusGeometry(5.6, .12, 6, 40), 0, [0, -3.3, 0], [Math.PI / 2, 0, 0])
  for (let i = 0; i < 40; i++) {
    const a = i * Math.PI / 20
    box(1, .12, .5, 0, [Math.cos(a) * 5.6, -3.42, Math.sin(a) * 5.6], [0, -a, 0])
    if (i % 2 === 0) box(.06, .56, .06, 2, [Math.cos(a) * 5.85, -3.1, Math.sin(a) * 5.85])
    if (i % 5 === 0) box(.18, .12, .12, 4, [Math.cos(a) * 5.85, -3.05, Math.sin(a) * 5.85], [0, -a, 0])
  }
  add(new TorusGeometry(5.85, .045, 5, 40), 2, [0, -2.85, 0], [Math.PI / 2, 0, 0])
  // ── Braço coletor com garra ────────────────────────────────────────────
  const ax = -4.2, az = 3.2
  add(new CylinderGeometry(.6, .8, 1.4, 10), 1, [ax, -2.6, az])
  box(.9, 1, .9, 0, [ax, -1.8, az])
  for (const s of [-1, 1]) box(5.4, .18, .18, 1, [ax - 2.5, -1.3 + s * .3, az])
  for (let i = 0; i < 5; i++) box(.86, .09, .09, 2, [ax - .6 - i * 1.05, -1.3, az], [0, 0, i % 2 ? .78 : -.78])
  box(3.2, .16, .16, 1, [ax - 6.4, -2.4, az], [0, 0, .62])
  box(.7, .6, .7, 1, [ax - 7.7, -3.4, az])
  for (let i = 0; i < 4; i++) add(new ConeGeometry(.16, 1.1, 5), 3, [ax - 7.7 + Math.cos(i * 1.57) * .34, -4, az + Math.sin(i * 1.57) * .34], [Math.cos(i * 1.57) * .5, 0, Math.sin(i * 1.57) * -.5 + Math.PI])

  return b.finish('Fundição de sucata')
}

// Casco cortado ao meio: o que sobra depois que a garra leva a proa.
export function buildHulk(seed: number) {
  const b = builder(FINISH)
  const { add, box } = b
  const len = 4.4 + (seed % 3) * 1.3
  b.plate([[0, -len], [.95, -len * .7], [1.25, 0], [1.1, len * .55], [-1.1, len * .55], [-1.25, 0], [-.95, -len * .7]], .95, 1, [0, -.45, 0], .1)
  b.plate([[0, -len * .8], [.62, -len * .55], [.8, 0], [.7, len * .4], [-.7, len * .4], [-.8, 0], [-.62, -len * .55]], .3, 0, [0, .5, 0], .06)
  // Corte irregular na popa, com cavernas expostas.
  for (let i = 0; i < 4; i++) {
    const z = len * .6 + i * .62, w = 1.18 - i * .2
    add(new TorusGeometry(w, .08, 5, 14, Math.PI), 2, [0, -.45, z], [0, 0, Math.PI])
    if (i % 2 === 0) box(w * 1.6, .12, .12, 2, [0, -.9, z])
  }
  box(.26, .3, len * .8, 1, [0, -.92, len * .2])
  // Chapas soltas e saliências do casco.
  for (let i = 0; i < 5; i++) {
    const s = i % 2 ? 1 : -1
    box(.22, .7, 1.1, 0, [s * 1.16, -.45, -len * .5 + i * len * .3])
    box(.3, .16, .16, 3, [s * 1.3, -.2, -len * .5 + i * len * .3])
  }
  for (const s of [-1, 1]) {
    add(new CylinderGeometry(.34, .44, .9, 10), 1, [s * .6, -.45, len * .5], [Math.PI / 2, 0, 0])
    add(new TorusGeometry(.36, .06, 6, 12), 2, [s * .6, -.45, len * .92])
  }
  return b.finish('Casco cortado')
}

// Peças soltas: chapas cortadas, vigas em caixa e cilindros amassados.
export function buildScrapPiece(seed: number) {
  const b = builder(FINISH)
  const { add, box } = b
  const kind = seed % 3
  if (kind === 0) {
    b.plate([[-.9, -.6], [.8, -.75], [1, .5], [-.5, .8]], .16, 0, [0, 0, 0], .05)
    for (let i = 0; i < 3; i++) box(.18, .22, .18, 3, [-.5 + i * .55, .05, -.2 + i * .3])
    box(1.6, .1, .1, 2, [0, .16, .1], [0, .3, 0])
  } else if (kind === 1) {
    box(2.2, .34, .34, 1, [0, 0, 0])
    box(.3, .5, .3, 0, [-.9, 0, 0]); box(.3, .5, .3, 0, [.9, 0, 0])
    for (let i = 0; i < 4; i++) box(.12, .4, .12, 2, [-.7 + i * .46, 0, 0])
  } else {
    add(new CylinderGeometry(.42, .5, 1.5, 10), 0, [0, 0, 0], [0, 0, Math.PI / 2])
    for (const s of [-1, 1]) add(new TorusGeometry(.46, .06, 6, 12), 2, [s * .55, 0, 0], [0, Math.PI / 2, 0])
    box(.5, .2, .6, 1, [0, .34, .1], [.3, 0, 0])
  }
  return b.finish('Sucata')
}
