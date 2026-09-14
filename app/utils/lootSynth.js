// Sons do espólio (moedas e pedrinhas de EXP) gerados na hora com Web Audio (sem arquivos).
// magnet: brilho ascendente curto quando a sala é limpa e o espólio começa a voar.
// coin: "plim" metálico de duas notas. exp: gota cristalina. exp-big: acorde de cristal mais cheio.
// step sobe o tom em sequência de peças do mesmo tipo.

function tone(ctx, out, { type = 'sine', from, to = from, delay = 0, attack = 0.004, duration, gain }) {
    const start = ctx.currentTime + delay, end = start + duration;
    const osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, end);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), start + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(amp).connect(out);
    osc.start(start);
    osc.stop(end + 0.02);
}

// Escala maior pentatônica: a sequência sobe sem soar desafinada
function pentatonic(base, step) {
    const semitones = [0, 2, 4, 7, 9][step % 5] + 12 * Math.floor(step / 5);
    return base * Math.pow(2, semitones / 12);
}

function playMagnet(ctx, out) {
    tone(ctx, out, { type: 'triangle', from: 440, to: 1760, attack: 0.18, duration: 0.3, gain: 0.08 });
    tone(ctx, out, { from: 1320, to: 2640, attack: 0.2, duration: 0.34, gain: 0.04, delay: 0.04 });
}

function playCoin(ctx, out, step) {
    const base = pentatonic(988, step);
    tone(ctx, out, { type: 'square', from: base, duration: 0.06, gain: 0.05 });
    tone(ctx, out, { type: 'square', from: base * 4 / 3, duration: 0.16, gain: 0.05, delay: 0.055 });
    // Sino fino por cima dá o timbre metálico
    tone(ctx, out, { from: base * 8 / 3, duration: 0.22, gain: 0.04, delay: 0.055 });
}

function playExp(ctx, out, step) {
    const base = pentatonic(784, step);
    // "Bloop" subindo rápido + cristal senoidal com harmônico desafinado de leve
    tone(ctx, out, { from: base * 0.5, to: base, duration: 0.07, gain: 0.07 });
    tone(ctx, out, { from: base * 2, duration: 0.18, gain: 0.06, delay: 0.03 });
    tone(ctx, out, { from: base * 3.01, duration: 0.12, gain: 0.02, delay: 0.03 });
}

function playExpBig(ctx, out, step) {
    const base = pentatonic(523, step);
    tone(ctx, out, { from: base * 0.5, to: base, duration: 0.1, gain: 0.09 });
    tone(ctx, out, { type: 'triangle', from: base * 2, duration: 0.35, gain: 0.07, delay: 0.03 });
    tone(ctx, out, { from: base * 2.5, duration: 0.35, gain: 0.05, delay: 0.06 });
    tone(ctx, out, { from: base * 3, duration: 0.4, gain: 0.045, delay: 0.09 });
}

export function playLootSynth(ctx, kind, volume = 1, step = 0) {
    if (!ctx || volume <= 0) return;
    const out = ctx.createGain();
    out.gain.value = volume * 0.6;
    out.connect(ctx.destination);
    if (kind === 'magnet') playMagnet(ctx, out);
    else if (kind === 'coin') playCoin(ctx, out, step);
    else if (kind === 'exp') playExp(ctx, out, step);
    else if (kind === 'exp-big') playExpBig(ctx, out, step);
    setTimeout(() => out.disconnect(), 1000);
}
