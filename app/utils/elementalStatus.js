// Efeitos elementais (fogo, gelo e raio) compartilhados por jogador, inimigos e armas.
// Um "payload" descreve o que um golpe carrega; o "estado" fica no alvo atingido.
//   payload: { fire: { burn, duration }, ice: { damage, shatter, duration }, lightning: { bonus, chains, range } }
//   burn/damage/shatter/bonus são frações do dano do golpe que aplicou o efeito.

export const ELEMENT_RULES = Object.freeze({
  fire: { tick: .5 },
  // Depois de descongelar o alvo fica imune por um tempo (evita travar para sempre)
  ice: { immunity: 3, bossDurationFactor: .35 },
  // Duração do raio visível passando pela nave
  lightning: { shockTime: .35 },
});

export const ELEMENT_COLORS = Object.freeze({ fire: '#ff5a1f', ice: '#9fe9ff', lightning: '#b996ff' });

// Presets para inimigos e armas elementais: basta `element: 'fire'` na ficha do inimigo
export const ENEMY_ELEMENT_PAYLOADS = Object.freeze({
  fire: { fire: { burn: .12, duration: 2.5 } },
  ice: { ice: { damage: .25, shatter: .25, duration: 1 } },
  lightning: { lightning: { bonus: .25, chains: 0, range: 0 } },
});

export function createElementState() {
  return { burn: null, freeze: null, immunity: 0, shock: 0 };
}

export function resetElementState(state) {
  if (!state) return state;
  state.burn = null; state.freeze = null; state.immunity = 0; state.shock = 0;
  return state;
}

export function elementStateOf(target) {
  return target.elementState ??= createElementState();
}

export function isElementFrozen(target) {
  return Boolean(target?.elementState?.freeze);
}

/** Queimadura: reaplicar renova a duração e mantém a queimadura mais forte. */
export function applyBurn(state, hitDamage, fraction, duration) {
  const dps = Math.max(0, hitDamage) * Math.max(0, fraction);
  if (!(dps > 0) || !(duration > 0)) return false;
  if (state.burn) {
    state.burn.dps = Math.max(state.burn.dps, dps);
    state.burn.remaining = Math.max(state.burn.remaining, duration);
  } else {
    state.burn = { dps, remaining: duration, clock: 0 };
  }
  return true;
}

/** Congela se o alvo não estiver congelado nem imune. A quebra guarda o próprio dano. */
export function applyFreeze(state, hitDamage, duration, shatterFraction) {
  if (state.freeze || state.immunity > 0 || !(duration > 0)) return false;
  state.freeze = { remaining: duration, duration, shatter: Math.max(0, hitDamage) * Math.max(0, shatterFraction) };
  return true;
}

/** Descongela e devolve o dano bruto da quebra (0 se não estava congelado). */
export function thawElementState(state) {
  if (!state?.freeze) return 0;
  const shatter = state.freeze.shatter;
  state.freeze = null;
  state.immunity = ELEMENT_RULES.ice.immunity;
  return shatter;
}

/**
 * Aplica o payload no estado do alvo. Não causa dano: devolve os valores para quem
 * chamou aplicar com seu próprio pipeline (texto, morte, recompensas).
 */
export function applyElementalHit(state, payload, hitDamage, { boss = false } = {}) {
  const result = { burning: false, froze: false, freezeDamage: 0, lightning: 0 };
  if (!payload || !(hitDamage > 0)) return result;
  if (payload.fire) result.burning = applyBurn(state, hitDamage, payload.fire.burn, payload.fire.duration);
  if (payload.lightning) {
    result.lightning = hitDamage * Math.max(0, payload.lightning.bonus || 0);
    state.shock = ELEMENT_RULES.lightning.shockTime;
  }
  if (payload.ice) {
    const duration = payload.ice.duration * (boss ? ELEMENT_RULES.ice.bossDurationFactor : 1);
    result.froze = applyFreeze(state, hitDamage, duration, payload.ice.shatter);
    if (result.froze) result.freezeDamage = hitDamage * Math.max(0, payload.ice.damage || 0);
  }
  return result;
}

/** Avança o tempo: devolve o dano de queimadura dos ticks vencidos e a quebra do gelo que expirou. */
export function tickElementState(state, delta) {
  const result = { burn: 0, thaw: 0 };
  if (!state || !(delta > 0)) return result;
  const tick = ELEMENT_RULES.fire.tick;
  state.immunity = Math.max(0, state.immunity - delta);
  state.shock = Math.max(0, state.shock - delta);
  if (state.burn) {
    const burn = state.burn;
    burn.clock += Math.min(delta, Math.max(0, burn.remaining));
    burn.remaining -= delta;
    while (burn.clock >= tick - 1e-9) {
      burn.clock -= tick;
      result.burn += burn.dps * tick;
    }
    if (burn.remaining <= 1e-9) state.burn = null;
  }
  if (state.freeze) {
    state.freeze.remaining -= delta;
    if (state.freeze.remaining <= 0) result.thaw = thawElementState(state);
  }
  return result;
}

/** Raio em cadeia: salta de alvo em alvo (o mais próximo ainda não atingido), cada salto limitado ao alcance. */
export function elementChainTargets(origin, candidates, range, count, excludedIds = []) {
  const used = new Set(excludedIds), hops = [];
  let from = origin;
  for (let i = 0; i < count; i++) {
    let best = null, min = range;
    for (const candidate of candidates) {
      if (used.has(candidate.id)) continue;
      const distance = Math.hypot(candidate.position.x - from.x, candidate.position.z - from.z);
      if (distance <= min) { best = candidate; min = distance; }
    }
    if (!best) break;
    used.add(best.id);
    hops.push(best);
    from = best.position;
  }
  return hops;
}

// Canal de eventos visuais (cadeia de raio, congelar, quebrar o gelo)
const fxListeners = new Set();
export function emitElementalFx(event) { fxListeners.forEach(listener => listener(event)); }
export function subscribeElementalFx(listener) {
  fxListeners.add(listener);
  return () => { fxListeners.delete(listener); };
}
