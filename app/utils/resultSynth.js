// Stings de fim de partida gerados na hora com Web Audio (sem arquivos).
// Os tempos acompanham as animações dos modais (VictoryModal/OverModal), que abrem junto com o som.
import { brass, bell, boom, sweep, createReverb } from './synthKit';

const reverbs = new WeakMap();
function sharedReverb(ctx) {
    let reverb = reverbs.get(ctx);
    if (!reverb) {
        reverb = createReverb(ctx, 2.8, 2.6);
        reverb.connect(ctx.destination);
        reverbs.set(ctx, reverb);
    }
    return reverb;
}

// Vitória: whoosh + tercina subindo, estocada e o acorde maior segurado quando o card chega
// ao tamanho final (~0.65s), com sinos subindo junto com o confete.
function playVictory(ctx, out, t0) {
    sweep(ctx, out, t0, 0.34, { from: 300, to: 6500, gain: 0.16 });

    [67, 69, 71].forEach((midi, i) => brass(ctx, out, midi, t0 + 0.08 + i * 0.075, 0.06, 0.11, { bright: 2600 }));

    const stab = t0 + 0.32;
    [72, 76, 79].forEach(midi => brass(ctx, out, midi, stab, 0.11, 0.075));
    boom(ctx, out, stab, { from: 150, to: 60, gain: 0.25, decay: 0.35 });

    const hit = t0 + 0.56;
    // Acorde de Dó maior aberto: graves mais fracos para não embolar
    [[48, 0.05], [60, 0.045], [64, 0.045], [67, 0.05], [72, 0.06], [76, 0.05], [79, 0.045]].forEach(([midi, gain]) =>
        brass(ctx, out, midi, hit, 1.35, gain, { bright: 3400, attack: 0.03, release: 0.35, vibrato: 0.004 }));
    brass(ctx, out, 84, hit + 0.02, 1.2, 0.03, { bright: 5000, attack: 0.06, release: 0.4, vibrato: 0.005 });
    boom(ctx, out, hit, { from: 130, to: 38, gain: 0.55, decay: 1.1 });
    sweep(ctx, out, hit, 1.6, { from: 9000, to: 5000, gain: 0.05, type: 'highpass', q: 0.7, peakAt: 0.05 });

    [84, 88, 91, 93, 96, 98, 100, 103].forEach((midi, i) =>
        bell(ctx, out, midi, hit + 0.12 + i * 0.085 + Math.random() * 0.02, 0.055 * (1 - i * 0.05), 0.9));
    bell(ctx, out, 96, hit + 1.05, 0.04, 1.6);
    bell(ctx, out, 103, hit + 1.12, 0.025, 1.6);
}

// Derrota: pane elétrica caindo, impacto metálico quando o card despenca (~0.47s)
// e um lamento em Lá menor que se apaga devagar.
function playDefeat(ctx, out, t0) {
    const fall = ctx.createBiquadFilter();
    fall.type = 'lowpass';
    fall.frequency.setValueAtTime(4000, t0);
    fall.frequency.exponentialRampToValueAtTime(220, t0 + 0.5);
    fall.connect(out);
    const fallAmp = ctx.createGain();
    fallAmp.gain.setValueAtTime(0, t0);
    fallAmp.gain.linearRampToValueAtTime(0.09, t0 + 0.02);
    fallAmp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
    fallAmp.connect(fall);
    // Tremido que desacelera, como um motor morrendo
    const wobble = ctx.createOscillator();
    const wobbleDepth = ctx.createGain();
    wobble.frequency.setValueAtTime(22, t0);
    wobble.frequency.exponentialRampToValueAtTime(5, t0 + 0.5);
    wobbleDepth.gain.value = 18;
    wobble.connect(wobbleDepth);
    for (const [from, to] of [[660, 70], [622, 66]]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(from, t0);
        osc.frequency.exponentialRampToValueAtTime(to, t0 + 0.5);
        wobbleDepth.connect(osc.frequency);
        osc.connect(fallAmp);
        osc.start(t0);
        osc.stop(t0 + 0.6);
    }
    wobble.start(t0);
    wobble.stop(t0 + 0.6);

    const hit = t0 + 0.47;
    boom(ctx, out, hit, { from: 95, to: 30, gain: 0.7, decay: 1.2 });
    // Clangor metálico: parciais inarmônicas curtas
    [[213, 0.5], [507, 0.35], [781, 0.28], [1130, 0.2]].forEach(([frequency, decay]) => {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = frequency;
        amp.gain.setValueAtTime(0.0001, hit);
        amp.gain.exponentialRampToValueAtTime(0.045, hit + 0.003);
        amp.gain.exponentialRampToValueAtTime(0.0001, hit + decay);
        osc.connect(amp).connect(out);
        osc.start(hit);
        osc.stop(hit + decay + 0.05);
    });

    const lament = hit + 0.22;
    brass(ctx, out, 64, lament, 0.26, 0.07, { bright: 1500, attack: 0.04, release: 0.1 });
    brass(ctx, out, 60, lament + 0.32, 0.26, 0.07, { bright: 1400, attack: 0.04, release: 0.1 });
    brass(ctx, out, 57, lament + 0.64, 1.2, 0.08, { bright: 1300, attack: 0.05, release: 0.45, vibrato: 0.006 });
    // Pad menor por baixo da última nota
    [[45, 0.035], [52, 0.03], [59, 0.022], [60, 0.025]].forEach(([midi, gain]) =>
        brass(ctx, out, midi, lament + 0.6, 1.4, gain, { bright: 900, attack: 0.45, release: 0.6, detune: 10 }));
    boom(ctx, out, lament + 0.64, { from: 60, to: 44, gain: 0.3, decay: 1.8 });
}

export function playResultSynth(ctx, kind, volume = 1) {
    if (!ctx || volume <= 0) return;

    const bus = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const master = ctx.createGain();
    const send = ctx.createGain();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    master.gain.value = volume;
    send.gain.value = kind === 'victory' ? 0.35 : 0.45;
    bus.connect(compressor).connect(master).connect(ctx.destination);
    master.connect(send).connect(sharedReverb(ctx));

    const t0 = ctx.currentTime + 0.02;
    if (kind === 'victory') playVictory(ctx, bus, t0);
    else if (kind === 'defeat') playDefeat(ctx, bus, t0);

    setTimeout(() => { bus.disconnect(); compressor.disconnect(); master.disconnect(); send.disconnect(); }, 4500);
}
