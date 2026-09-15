/**
 * Pilotagem da nave: faz a troca de direção virar curva em vez de arrasto lateral.
 *
 * O problema original: as teclas entregam 8 direções fixas e o rumo trocava de uma vez.
 * Apertar W e depois D girava o vetor de velocidade 45 graus num único quadro, enquanto o casco
 * levava ~8 quadros para se alinhar — a nave andava de lado durante a virada. Aqui o rumo real
 * persegue o rumo das teclas, então a velocidade descreve um arco e o casco fica sempre apontado
 * para onde ela de fato vai.
 *
 * O que NÃO muda (para não afetar a jogabilidade): a velocidade é a mesma (o módulo do input é
 * preservado), largar as teclas para a nave no mesmo quadro (o "pare para atirar" continua igual),
 * arranque é imediato e inverter o sentido é imediato.
 *
 * COMO DESFAZER
 * 1) Jeito rápido e completo: `enabled: false` abaixo. Devolve o comportamento original exato —
 *    o rumo volta a trocar de uma vez e a rotação volta à fórmula antiga (`diff * 8 * delta`).
 * 2) Remoção total: apague este arquivo e desfaça os pontos que citam este módulo.
 *    Em app/composables/usePlayerControls.ts:
 *    - o import no topo;
 *    - em `update`, volte a passar `movement` (no lugar de `steer`) para `dilation.update` e para
 *      o `Math.atan2` do alvo de rotação;
 *    - na rotação, deixe só `rotation.y += diff * rotationSpeed * delta` com rotationSpeed = 8;
 *    - no watch de pausa, tire a chamada `resetHeading()`.
 *    Em app/components/game/PlayerCharacter.vue:
 *    - o import no topo;
 *    - na antecipação da câmera, volte a `const move = currentRun.getMoveVector()`;
 *    - na rotação do modelo, volte a `playerMeshRef.value.rotation.set(rotation.x, visualYaw,
 *      rotation.z)` e tire as chamadas `bankForTurn`/`resetBank`.
 */
export const SHIP_HANDLING = {
  enabled: true,
  /** Rapidez com que o rumo real persegue o rumo das teclas. Maior = curva mais curta. */
  turnRate: 12,
  /**
   * Rapidez com que o casco se alinha ao rumo real (8 era o valor antigo, em fórmula linear).
   * Fica acima de turnRate de propósito: assim o nariz entra na curva à frente da velocidade,
   * em vez de correr atrás dela — era isso que dava a sensação de arrasto lateral.
   */
  rotationRate: 14,
  /** Cosseno a partir do qual a virada conta como inversão de sentido e troca na hora. */
  reverseSnap: -0.85,
  /**
   * Teto do quanto a curva acelera junto com a velocidade. Em velocidade normal a curva leva o
   * tempo de sempre; no corrido do portal (3x) ela fecha na mesma distância, senão a nave
   * atravessaria meia sala de lado antes de apontar para onde vai.
   */
  speedTurnBoost: 3,
  /** Inclinação do casco na curva (só visual): radianos de rolagem por rad/s de guinada. */
  bankPerRate: 0.06,
  /** Teto da inclinação, em radianos (0.45 ≈ 26 graus). */
  bankMax: 0.45,
  /** Rapidez com que a inclinação entra e sai. */
  bankSmooth: 10,
};

const heading = { x: 0, z: 0 };
let bank = 0;

/** Quanto a curva acelera na velocidade atual (1 = velocidade normal). */
export function turnScale(speedRatio: number) {
  return Math.min(SHIP_HANDLING.speedTurnBoost, Math.max(1, speedRatio || 1));
}

/** Zera o rumo guardado (pausa, morte, troca de sala). */
export function resetHeading() {
  heading.x = 0;
  heading.z = 0;
}

/**
 * Inclinação do casco para a curva, em radianos, a partir da guinada por segundo. Não toca em
 * física nem em colisão: é só a rolagem do modelo, o sinal visual de que a nave está virando (sem
 * ele, em alta velocidade, o casco reto parece deslizar de lado). Desligado, devolve 0.
 */
export function bankForTurn(yawRate: number, delta: number) {
  if (!SHIP_HANDLING.enabled) {
    bank = 0;
    return 0;
  }
  // Sinal: o casco olha para -Z e o roll é no eixo local Z. Curva à direita dá guinada negativa e
  // precisa baixar a asa direita, que é rotation.z negativo — daí o sinal acompanhar a guinada.
  const target = Math.max(-SHIP_HANDLING.bankMax, Math.min(SHIP_HANDLING.bankMax, yawRate * SHIP_HANDLING.bankPerRate));
  bank += (target - bank) * (1 - Math.exp(-SHIP_HANDLING.bankSmooth * delta));
  return bank;
}

/** Zera a inclinação guardada (pausa, morte, troca de sala). */
export function resetBank() {
  bank = 0;
}

/**
 * Rumo em uso neste instante, para quem precisa seguir o movimento real em vez do comando cru —
 * hoje, a antecipação da câmera. Desligado, devolve o próprio vetor das teclas.
 */
export function currentHeading(input: { x: number, z: number }) {
  if (!SHIP_HANDLING.enabled) return input;
  return Math.hypot(heading.x, heading.z) > 1e-3 ? heading : input;
}

/**
 * Rumo suavizado a partir do rumo das teclas. Mantém o módulo do input, então a velocidade
 * não muda — só o caminho até a nova direção.
 */
export function steerHeading(input: { x: number, z: number }, delta: number, speedRatio = 1) {
  if (!SHIP_HANDLING.enabled) return input;

  const magnitude = Math.hypot(input.x, input.z);
  // Sem input a nave para no mesmo quadro, como antes
  if (magnitude < 1e-3) {
    resetHeading();
    return input;
  }

  const current = Math.hypot(heading.x, heading.z);
  // Arranque parado: sai já na direção pedida
  if (current < 1e-3) {
    heading.x = input.x;
    heading.z = input.z;
    return heading;
  }

  // Meia-volta: troca na hora, senão o rumo passaria pelo zero e a nave perderia resposta
  const alignment = (heading.x * input.x + heading.z * input.z) / (current * magnitude);
  if (alignment < SHIP_HANDLING.reverseSnap) {
    heading.x = input.x;
    heading.z = input.z;
    return heading;
  }

  // Perseguição exponencial: independe da taxa de quadros. Quanto mais rápida a nave, mais curto
  // o tempo da curva — assim o raio da curva fica parecido em vez de crescer com a velocidade.
  const rate = 1 - Math.exp(-SHIP_HANDLING.turnRate * turnScale(speedRatio) * delta);
  heading.x += (input.x - heading.x) * rate;
  heading.z += (input.z - heading.z) * rate;

  // Devolve ao módulo do input: a curva muda a direção, nunca a velocidade
  const length = Math.hypot(heading.x, heading.z) || 1;
  heading.x = heading.x / length * magnitude;
  heading.z = heading.z / length * magnitude;
  return heading;
}
