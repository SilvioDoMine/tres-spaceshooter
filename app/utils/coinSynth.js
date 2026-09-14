// Sons das moedas de ouro gerados na hora com Web Audio (sem arquivos).
// magnet: brilho ascendente curto quando a sala é limpa e as moedas começam a voar.
// collect: "plim" metálico de duas notas; step sobe o tom em sequência de moedas.

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

function playMagnet(ctx, out) {
    tone(ctx, out, { type: 'triangle', from: 440, to: 1760, attack: 0.18, duration: 0.3, gain: 0.08 });
    tone(ctx, out, { from: 1320, to: 2640, attack: 0.2, duration: 0.34, gain: 0.04, delay: 0.04 });
}

function playCollect(ctx, out, step) {
    // Escala maior pentatônica: a sequência sobe sem soar desafinada
    const semitones = [0, 2, 4, 7, 9][step % 5] + 12 * Math.floor(step / 5);
    const base = 988 * Math.pow(2, semitones / 12);
    tone(ctx, out, { type: 'square', from: base, duration: 0.06, gain: 0.05 });
    tone(ctx, out, { type: 'square', from: base * 4 / 3, duration: 0.16, gain: 0.05, delay: 0.055 });
    // Sino fino por cima dá o timbre metálico
    tone(ctx, out, { from: base * 8 / 3, duration: 0.22, gain: 0.04, delay: 0.055 });
}

export function playCoinSynth(ctx, kind, volume = 1, step = 0) {
    if (!ctx || volume <= 0) return;
    const out = ctx.createGain();
    out.gain.value = volume * 0.6;
    out.connect(ctx.destination);
    if (kind === 'magnet') playMagnet(ctx, out);
    else if (kind === 'collect') playCollect(ctx, out, step);
    setTimeout(() => out.disconnect(), 1000);
}
