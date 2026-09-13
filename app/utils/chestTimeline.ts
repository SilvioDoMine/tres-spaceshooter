// Linha do tempo da abertura de um baú (em segundos), sem Vue/Three para dar para testar.
// Cada chamada devolve o estado dos elementos naquele instante; a cena só aplica os valores.

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Progresso 0..1 de `t` dentro de [start, end] */
export const span = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));

export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
export const easeInCubic = (x: number) => x ** 3;
export function easeOutBack(x: number, overshoot = 1.70158) {
  const c3 = overshoot + 1;
  return 1 + c3 * (x - 1) ** 3 + overshoot * (x - 1) ** 2;
}
export function easeOutBounce(x: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

export interface ChestFrame {
  /** Altura do baú (cai de cima) */
  y: number;
  /** Escala vertical (achata ao bater no chão) */
  squash: number;
  /** Inclinação da tremida, em radianos */
  tilt: number;
  /** Tampa: 0 fechada, 1 aberta */
  lid: number;
  /** Brilho da gema do fecho */
  gem: number;
  /** Clarão da abertura (pico e some) */
  flash: number;
  /** Onda de choque: 0..1 enquanto expande, 0 antes */
  ring: number;
  /** Intensidade dos raios de luz */
  rays: number;
  /** Item saindo: 0 dentro do baú, 1 parado no alto */
  item: number;
  /** Quantas partículas soltar (0..1 da taxa máxima) */
  particles: number;
  done: boolean;
}

export interface ChestTimeline {
  land: number;
  shakeEnd: number;
  openEnd: number;
  itemEnd: number;
  end: number;
}

/** Raridade alta (a garantida do baú) segura mais a tremida antes de abrir */
export function chestTimeline(high: boolean): ChestTimeline {
  const shakeEnd = high ? 1.25 : 0.9;
  return { land: 0.35, shakeEnd, openEnd: shakeEnd + 0.3, itemEnd: shakeEnd + 0.75, end: shakeEnd + 0.8 };
}

export function chestFrame(t: number, high: boolean): ChestFrame {
  const tl = chestTimeline(high);

  const fall = span(t, 0, tl.land);
  const y = (1 - easeOutBounce(fall)) * 3.2;

  // Achata ao tocar o chão e volta com um pequeno repique
  const impact = span(t, tl.land, tl.land + 0.25);
  const squash = t < tl.land ? 1.06 : 1 - Math.sin(impact * Math.PI) * 0.16 * (1 - impact);

  // Tremida cresce até abrir
  const shake = span(t, tl.land + 0.15, tl.shakeEnd);
  const shaking = t > tl.land + 0.15 && t < tl.shakeEnd;
  const tilt = shaking ? Math.sin(t * (high ? 70 : 55)) * 0.05 * (0.3 + shake) * (high ? 1.5 : 1) : 0;

  const lid = easeOutBack(span(t, tl.shakeEnd, tl.openEnd), 2.2);
  const gem = 0.3 + 0.7 * span(t, tl.land, tl.shakeEnd);

  const flashIn = span(t, tl.shakeEnd, tl.shakeEnd + 0.06);
  const flashOut = span(t, tl.shakeEnd + 0.06, tl.shakeEnd + 0.45);
  const flash = t < tl.shakeEnd ? 0 : flashIn * (1 - easeOutCubic(flashOut));

  const ring = t < tl.shakeEnd ? 0 : span(t, tl.shakeEnd, tl.shakeEnd + 0.6);
  const rays = easeOutCubic(span(t, tl.shakeEnd, tl.shakeEnd + 0.4));
  const item = easeOutBack(span(t, tl.shakeEnd + 0.15, tl.itemEnd), 1.4);
  const particles = t < tl.shakeEnd ? 0 : t < tl.itemEnd ? 1 : 0.35;

  return { y, squash, tilt, lid, gem, flash, ring, rays, item, particles, done: t >= tl.end };
}
