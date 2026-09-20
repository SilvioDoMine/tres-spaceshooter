// Trilha das fases gerada na hora com Web Audio (sem arquivos): um tema por capítulo e três
// intensidades que entram e saem em camadas, acompanhando a sala:
//   'calm'   intro e sala limpa: pad, drone e arpejo leve
//   'combat' entram o baixo pulsando, a bateria (com sidechain no pad) e o arpejo corrido
//   'boss'   bumbo em todos os tempos, chimbal corrido, estocadas de metais e subida de ruído
// O arpejo é sorteado dentro de cada acorde e muda a cada duas voltas da progressão.
import { mtof, noiseBuffer, createReverb, createMusicEngine, bell, brass, sweep } from './synthKit';

const THEMES = {
    // Patrulha orbital: Lá menor heroico
    1: {
        tempo: 100, arpVoice: 'pluck', padBright: 1400, chords: [
            { bass: 33, pad: [57, 60, 64, 69], arp: [57, 60, 64, 67, 69, 72, 76] }, // Am
            { bass: 29, pad: [53, 57, 60, 65], arp: [57, 60, 65, 67, 69, 72, 77] }, // F
            { bass: 36, pad: [55, 60, 64, 67], arp: [60, 64, 67, 72, 74, 76, 79] }, // C
            { bass: 31, pad: [55, 59, 62, 67], arp: [59, 62, 67, 69, 71, 74, 79] }, // G
        ],
    },
    // Estaleiro na nebulosa: Mi frígio, misterioso e metálico
    2: {
        tempo: 94, arpVoice: 'bell', padBright: 1000, chords: [
            { bass: 28, pad: [52, 55, 59, 64], arp: [59, 64, 67, 71, 72, 76] }, // Em
            { bass: 29, pad: [53, 57, 60, 65], arp: [60, 65, 69, 72, 77] }, // F
            { bass: 26, pad: [50, 53, 57, 62], arp: [57, 62, 65, 69, 74] }, // Dm
            { bass: 28, pad: [52, 53, 59, 64], arp: [59, 64, 65, 67, 71, 76] }, // Em(b9)
        ],
    },
    // Comando da frota: Ré menor épico, fechando na dominante tensa
    3: {
        tempo: 108, arpVoice: 'saw', padBright: 1700, chords: [
            { bass: 38, pad: [50, 57, 62, 65], arp: [62, 65, 69, 74, 77] }, // Dm
            { bass: 34, pad: [50, 53, 58, 62], arp: [58, 62, 65, 70, 74] }, // Bb
            { bass: 31, pad: [50, 55, 58, 62], arp: [55, 58, 62, 67, 70] }, // Gm
            { bass: 33, pad: [49, 52, 57, 61], arp: [57, 61, 64, 69, 73] }, // A
        ],
    },
};

// New sectors reuse the established voices with their own tempo and transposition.
THEMES[4] = { ...THEMES[3], tempo: 102, padBright: 1200,
  chords: THEMES[3].chords.map(c => ({ bass: c.bass - 2, pad: c.pad.map(n => n - 2), arp: c.arp.map(n => n - 2) })) };
THEMES[5] = { ...THEMES[2], tempo: 112, padBright: 1600,
  chords: THEMES[2].chords.map(c => ({ bass: c.bass + 3, pad: c.pad.map(n => n + 3), arp: c.arp.map(n => n + 3) })) };

// Volume de cada camada por intensidade
const LEVELS = {
    calm: { pad: 1, arp: 0.55, bass: 0, drums: 0, boss: 0 },
    combat: { pad: 0.75, arp: 1, bass: 1, drums: 1, boss: 0 },
    boss: { pad: 0.9, arp: 0.9, bass: 1.15, drums: 1.15, boss: 1 },
};

const LEVEL_ORDER = ['calm', 'combat', 'boss'];

const STEPS_PER_BAR = 16; // semicolcheias
const CHORD_STEPS = STEPS_PER_BAR * 2;
// Linha do baixo em colcheias: intervalo acima da fundamental
const BASS_LINE = [0, 0, 12, 0, 0, 12, 0, 7];

function randomPattern(size) {
    let index = Math.floor(size / 2);
    return Array.from({ length: CHORD_STEPS }, (_, step) => {
        const chance = step % 4 === 0 ? 0.75 : step % 2 === 0 ? 0.45 : 0.2;
        if (Math.random() > chance) return null;
        index = Math.min(size - 1, Math.max(0, index + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
        return { index, velocity: 0.6 + Math.random() * 0.4 };
    });
}

export function createChapterMusic(ctx, output, chapter = 1, initialLevel = 'calm') {
    const theme = THEMES[chapter] ?? THEMES[((Math.max(1, chapter) - 1) % 3) + 1];
    const step = 60 / theme.tempo / 4;
    const loopSteps = CHORD_STEPS * theme.chords.length;
    let level = LEVELS[initialLevel] ? initialLevel : 'calm';
    let pendingLevel = null;
    let patterns = [];

    const engine = createMusicEngine(ctx, output, { stepSeconds: step, onStep: scheduleStep });
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;
    compressor.connect(engine.input);

    const reverb = createReverb(ctx, 2.6, 2.4);
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.5;
    reverb.connect(reverbWet).connect(compressor);

    // Pad e baixo passam pelo "duck", que abaixa a cada bumbo (balanço de sidechain)
    const duck = ctx.createGain();
    duck.connect(compressor);

    const bus = {};
    for (const [name, target, wet] of [['pad', duck, 0.45], ['bass', duck, 0], ['arp', compressor, 0.35], ['drums', compressor, 0.08], ['boss', compressor, 0.4]]) {
        bus[name] = ctx.createGain();
        bus[name].gain.value = LEVELS[level][name];
        bus[name].connect(target);
        if (wet > 0) {
            const send = ctx.createGain();
            send.gain.value = wet;
            bus[name].connect(send).connect(reverb);
        }
    }

    // Eco do arpejo em colcheia pontuada
    const delay = ctx.createDelay(2);
    const feedback = ctx.createGain();
    const damp = ctx.createBiquadFilter();
    const delayWet = ctx.createGain();
    delay.delayTime.value = step * 3;
    feedback.gain.value = 0.33;
    damp.type = 'lowpass';
    damp.frequency.value = 2600;
    delayWet.gain.value = 0.3;
    bus.arp.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(delayWet).connect(compressor);

    function pad(t, notes, duration) {
        const end = t + duration + 4;
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        filter.type = 'lowpass';
        filter.Q.value = 0.6;
        filter.frequency.setValueAtTime(theme.padBright * 0.4, t);
        filter.frequency.linearRampToValueAtTime(theme.padBright, t + duration * 0.6);
        filter.frequency.linearRampToValueAtTime(theme.padBright * 0.5, t + duration + 1.5);
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(1, t + 1.2);
        amp.gain.setTargetAtTime(0, t + duration, 0.5);
        filter.connect(amp).connect(bus.pad);

        for (const midi of notes) {
            const voice = ctx.createGain();
            voice.gain.value = 0.014;
            voice.connect(filter);
            for (const cents of [-9, 9]) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = mtof(midi);
                osc.detune.value = cents + (Math.random() - 0.5) * 4;
                osc.connect(voice);
                osc.start(t);
                osc.stop(end);
            }
        }
    }

    function drone(t, midi, duration) {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.frequency.value = mtof(midi);
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(0.09, t + 0.8);
        amp.gain.setTargetAtTime(0, t + duration, 0.3);
        osc.connect(amp).connect(bus.pad);
        osc.start(t);
        osc.stop(t + duration + 2);
    }

    function bassNote(t, midi, duration, velocity) {
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        filter.type = 'lowpass';
        filter.Q.value = 4;
        filter.frequency.setValueAtTime(1500 * velocity, t);
        filter.frequency.exponentialRampToValueAtTime(220, t + duration * 0.9);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.13 * velocity, t + 0.004);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        filter.connect(amp).connect(bus.bass);
        for (const [type, offset, gain] of [['sawtooth', 0, 1], ['square', -12, 0.35]]) {
            const osc = ctx.createOscillator();
            const voice = ctx.createGain();
            osc.type = type;
            osc.frequency.value = mtof(midi + offset);
            voice.gain.value = gain;
            osc.connect(voice).connect(filter);
            osc.start(t);
            osc.stop(t + duration + 0.05);
        }
    }

    function arpNote(t, midi, velocity) {
        if (theme.arpVoice === 'bell') {
            bell(ctx, bus.arp, midi + 12, t, 0.04 * velocity, 0.7);
            return;
        }
        const saw = theme.arpVoice === 'saw';
        const decay = saw ? 0.28 : 0.9;
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(saw ? 3200 : 2600, t);
        filter.frequency.exponentialRampToValueAtTime(saw ? 600 : 800, t + decay * 0.6);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime((saw ? 0.035 : 0.05) * velocity, t + 0.004);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        filter.connect(amp).connect(bus.arp);
        for (const [type, ratio, gain] of saw ? [['sawtooth', 1, 1], ['square', 0.5, 0.25]] : [['triangle', 1, 1], ['sine', 2, 0.3]]) {
            const osc = ctx.createOscillator();
            const voice = ctx.createGain();
            osc.type = type;
            osc.frequency.value = mtof(midi) * ratio;
            voice.gain.value = gain;
            osc.connect(voice).connect(filter);
            osc.start(t);
            osc.stop(t + decay + 0.05);
        }
    }

    function noiseHit(t, destination, { type, frequency, q = 0.7, gain, decay }) {
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        source.buffer = noiseBuffer(ctx);
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = q;
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(gain, t + 0.002);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        source.connect(filter).connect(amp).connect(destination);
        source.start(t, Math.random());
        source.stop(t + decay + 0.02);
    }

    function kick(t) {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.1);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.5, t + 0.003);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        osc.connect(amp).connect(bus.drums);
        osc.start(t);
        osc.stop(t + 0.45);
        noiseHit(t, bus.drums, { type: 'highpass', frequency: 3000, gain: 0.05, decay: 0.015 });

        duck.gain.setValueAtTime(1, t);
        duck.gain.linearRampToValueAtTime(0.5, t + 0.012);
        duck.gain.setTargetAtTime(1, t + 0.02, 0.1);
    }

    function snare(t, velocity) {
        noiseHit(t, bus.drums, { type: 'bandpass', frequency: 1900, q: 0.8, gain: 0.22 * velocity, decay: 0.2 });
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.12 * velocity, t + 0.002);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc.connect(amp).connect(bus.drums);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    function hat(t, velocity, open) {
        noiseHit(t, bus.drums, { type: 'highpass', frequency: 7500, gain: 0.05 * velocity, decay: open ? 0.25 : 0.045 });
    }

    function drums(index, inBar, t) {
        const isBoss = level === 'boss';
        const lastBar = index % loopSteps >= loopSteps - STEPS_PER_BAR;

        if (inBar === 0 || inBar === 8 || (isBoss && inBar % 4 === 0) || (inBar === 10 && Math.random() < 0.3)) kick(t);
        if (inBar === 4 || inBar === 12) snare(t, 1);
        else if (lastBar && inBar >= 13 && Math.random() < 0.7) snare(t, 0.5); // virada
        if (isBoss || inBar % 2 === 0) hat(t, inBar % 2 === 0 ? 1 : 0.55, inBar === 14 && Math.random() < 0.4);
        // Prato na volta da progressão
        if (inBar === 0 && index % loopSteps === 0 && index > 0) {
            sweep(ctx, bus.drums, t, 1.4, { from: 9000, to: 4000, gain: 0.06, type: 'highpass', q: 0.5, peakAt: 0.02 });
        }
    }

    function scheduleStep(index, t) {
        // A troca de intensidade espera o tempo da música: subir entra na cabeça do próximo compasso,
        // descer espera o fim do acorde, para não cortar a frase no meio
        if (pendingLevel) {
            const rising = LEVEL_ORDER.indexOf(pendingLevel) > LEVEL_ORDER.indexOf(level);
            if (index % (rising ? STEPS_PER_BAR : CHORD_STEPS) === 0) applyLevel(pendingLevel, t, rising);
        }

        const targets = LEVELS[level];
        const chordIndex = Math.floor(index / CHORD_STEPS) % theme.chords.length;
        const local = index % CHORD_STEPS;
        const inBar = index % STEPS_PER_BAR;
        const chord = theme.chords[chordIndex];
        // Camada toca enquanto está ligada ou ainda some com fade
        const on = name => targets[name] > 0 || bus[name].gain.value > 0.02;

        if (index % (loopSteps * 2) === 0) patterns = theme.chords.map(({ arp }) => randomPattern(arp.length));

        if (local === 0) {
            pad(t, chord.pad, CHORD_STEPS * step);
            drone(t, chord.bass, CHORD_STEPS * step);
        }

        const hit = patterns[chordIndex][local];
        if (hit && on('arp') && (level !== 'calm' || local % 2 === 0)) arpNote(t, chord.arp[hit.index], hit.velocity);

        if (on('bass') && index % 2 === 0) {
            bassNote(t, chord.bass + 12 + BASS_LINE[inBar / 2], step * 1.8, inBar % 8 === 0 ? 1 : 0.8);
        }

        if (on('drums')) drums(index, inBar, t);

        if (on('boss')) {
            if (local === 0 || local === 22) {
                for (const midi of chord.pad) brass(ctx, bus.boss, midi, t, 0.22, 0.035, { bright: 2200, release: 0.15 });
            }
            // Subida de ruído no último compasso da progressão
            if (index % loopSteps === loopSteps - STEPS_PER_BAR) {
                sweep(ctx, bus.boss, t, STEPS_PER_BAR * step, { from: 300, to: 7000, gain: 0.06, q: 1, peakAt: 0.97 });
            }
        }
    }

    function applyLevel(newLevel, t, rising) {
        level = newLevel;
        pendingLevel = null;
        for (const [name, gain] of Object.entries(bus)) {
            const melodic = name === 'pad' || name === 'arp';
            // Sobe firme no tempo forte; desce devagar, deixando a bateria e o baixo se dissolverem
            const timeConstant = rising ? (melodic ? 0.8 : 0.2) : (melodic ? 2.5 : 1.8);
            gain.gain.cancelScheduledValues(t);
            gain.gain.setTargetAtTime(LEVELS[level][name], t, timeConstant);
        }
        // Prato marcando a entrada da bateria
        if (rising) sweep(ctx, compressor, t, 1.6, { from: 9000, to: 3500, gain: 0.07, type: 'highpass', q: 0.5, peakAt: 0.02 });
    }

    // Pedir a intensidade atual de novo cancela uma troca que ainda estava esperando o compasso
    function setIntensity(newLevel) {
        if (!LEVELS[newLevel]) return;
        pendingLevel = newLevel === level ? null : newLevel;
    }

    return { start: engine.start, stop: engine.stop, setVolume: engine.setVolume, setIntensity };
}
