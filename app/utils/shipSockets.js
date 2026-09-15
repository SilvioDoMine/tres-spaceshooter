// Contrato de encaixe da plataforma de naves.
//
// O corpo da nave é o personagem: ele carrega as interfaces mecânicas e nada
// mais. Asas, cockpit, gerador, campo, propulsores e arma são módulos que se
// acoplam nestas âncoras. Um personagem novo só precisa respeitar este contrato
// para funcionar com todo equipamento que já existe — sem ele, cada combinação
// de corpo e peça viraria um ajuste manual.
//
// Espaço do modelo: nariz em -Z, dorso em +Y, X positivo para a direita.
// Cada módulo é modelado em espaço LOCAL, com a origem no próprio encaixe, e o
// lado é aplicado espelhando X. Assim a mesma peça serve aos dois flancos.

export const SHIP_SOCKETS = {
  // A raiz fica na altura do ombro; a asa cresce em +X a partir dela.
  wing: { position: [.25, 0, 0], span: .59 },
  cockpit: { position: [0, .09, -.30] },
  generator: { position: [0, .14, .30] },
  forcefield: { position: [.218, .113, .19] },
  thruster: { position: [.306, .011, .50] },
  weapon: { position: [0, -.145, -1.04] },
}

// Envelope reservado dos canhões diagonais, em espaço local da asa.
//
// As coordenadas de disparo vivem em `weaponMounts` e são compartilhadas pelo
// combate: mudá-las por asa faria o projétil nascer fora da boca do canhão. Por
// isso o envelope é fixo e o guia exige que toda asa preserve o espaço dos
// canhões diagonais — a silhueta pode mudar à vontade, desde que exista
// superfície sustentando estes dois pontos.
export const WING_HARDPOINTS = {
  diagonal: { x: .45, y: .065, z: .12 },
  lateral: { x: .45, y: .065, z: .36 },
}

// Largura máxima que uma asa pode ocupar antes de invadir a chama dos motores
// ou sair do enquadramento de partida.
export const WING_ENVELOPE = { maxSpan: .66, minSpan: .34, maxChordBack: .46, maxChordFront: -.30 }
