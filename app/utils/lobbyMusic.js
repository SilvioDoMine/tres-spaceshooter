// Música do lobby gerada na hora com Web Audio (sem arquivos): ambiente espacial calmo em Ré maior.
// Pad lento + baixo + arpejo com eco + sinos ocasionais + vento de fundo. O arpejo é sorteado
// dentro das notas de cada acorde e repete por duas voltas da progressão antes de mudar,
// então soa como um loop reconhecível que nunca fica idêntico.
import { mtof, noiseBuffer, createReverb, createMusicEngine, bell } from './synthKit';

const TEMPO = 70;
const STEP = 60 / TEMPO / 2; // colcheia
const STEPS_PER_CHORD = 16; // 2 compassos por acorde

const PROGRESSION = [
    { bass: 38, pad: [50, 57, 61, 64, 66], arp: [62, 66, 69, 73, 74, 76, 78, 81] }, // Dmaj9
    { bass: 35, pad: [47, 54, 57, 61, 62], arp: [59, 62, 66, 69, 71, 73, 74, 78] }, // Bm9
    { bass: 31, pad: [43, 50, 54, 59, 61], arp: [59, 62, 66, 67, 69, 71, 73, 74] }, // Gmaj7(#11)
    { bass: 33, pad: [45, 52, 57, 59, 64], arp: [57, 61, 64, 66, 69, 71, 73, 76] }, // A6/9
];

function randomPattern(size) {
    let index = Math.floor(size / 2);
    return Array.from({ length: STEPS_PER_CHORD }, (_, step) => {
        const chance = step % 4 === 0 ? 0.8 : step % 2 === 0 ? 0.45 : 0.25;
        if (Math.random() > chance) return null;
        index = Math.min(size - 1, Math.max(0, index + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
        return { index, velocity: 0.6 + Math.random() * 0.4 };
    });
}

export function createLobbyMusic(ctx) {
    const compressor = ctx.createDynamicsCompressor();
    const music = ctx.createGain();
    const padBus = ctx.createGain();
    const arpBus = ctx.createGain();
    const bellBus = ctx.createGain();
    const reverb = createReverb(ctx, 3.5, 2.2);
    const reverbWet = ctx.createGain();

    let patterns = [];
    let wind = null;
    const engine = createMusicEngine(ctx, ctx.destination, { stepSeconds: STEP, onStep: scheduleStep, onStart: startWind, onStop: stopWind });

    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    music.connect(compressor).connect(engine.input);
    reverb.connect(reverbWet).connect(compressor);
    reverbWet.gain.value = 0.7;

    for (const [bus, wet] of [[padBus, 0.5], [arpBus, 0.45], [bellBus, 0.9]]) {
        const send = ctx.createGain();
        send.gain.value = wet;
        bus.connect(music);
        bus.connect(send).connect(reverb);
    }

    // Eco do arpejo a cada 3 colcheias, perdendo agudo a cada volta
    const delay = ctx.createDelay(2);
    const feedback = ctx.createGain();
    const damp = ctx.createBiquadFilter();
    const delayWet = ctx.createGain();
    delay.delayTime.value = STEP * 3;
    feedback.gain.value = 0.38;
    damp.type = 'lowpass';
    damp.frequency.value = 2200;
    delayWet.gain.value = 0.35;
    arpBus.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(delayWet).connect(music);

    function pad(t, notes, duration) {
        const end = t + duration + 5;
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        filter.type = 'lowpass';
        filter.Q.value = 0.5;
        filter.frequency.setValueAtTime(450, t);
        filter.frequency.linearRampToValueAtTime(1300, t + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(650, t + duration + 2);
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(1, t + 2.2);
        amp.gain.setTargetAtTime(0, t + duration, 0.8);
        filter.connect(amp).connect(padBus);

        for (const midi of notes) {
            const voice = ctx.createGain();
            voice.gain.value = 0.018;
            voice.connect(filter);
            for (const cents of [-8, 8]) {
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

    function bass(t, midi, duration) {
        const end = t + duration + 2;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(0.16, t + 0.5);
        amp.gain.setTargetAtTime(0.11, t + 0.5, 1.5);
        amp.gain.setTargetAtTime(0, t + duration, 0.35);
        amp.connect(music);
        for (const [type, ratio, gain] of [['sine', 1, 1], ['triangle', 2, 0.18]]) {
            const osc = ctx.createOscillator();
            const voice = ctx.createGain();
            osc.type = type;
            osc.frequency.value = mtof(midi) * ratio;
            voice.gain.value = gain;
            osc.connect(voice).connect(amp);
            osc.start(t);
            osc.stop(end);
        }
    }

    function pluck(t, midi, velocity) {
        const frequency = mtof(midi);
        const end = t + 1.5;
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, t);
        filter.frequency.exponentialRampToValueAtTime(700, t + 0.6);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.055 * velocity, t + 0.005);
        amp.gain.exponentialRampToValueAtTime(0.0001, end);
        filter.connect(amp).connect(arpBus);
        for (const [type, ratio, gain] of [['triangle', 1, 1], ['sine', 2, 0.3]]) {
            const osc = ctx.createOscillator();
            const voice = ctx.createGain();
            osc.type = type;
            osc.frequency.value = frequency * ratio;
            voice.gain.value = gain;
            osc.connect(voice).connect(filter);
            osc.start(t);
            osc.stop(end + 0.05);
        }
    }

    function scheduleStep(index, t) {
        const chordIndex = Math.floor(index / STEPS_PER_CHORD) % PROGRESSION.length;
        const local = index % STEPS_PER_CHORD;
        const chord = PROGRESSION[chordIndex];

        if (local === 0) {
            if (index % (STEPS_PER_CHORD * PROGRESSION.length * 2) === 0) {
                patterns = PROGRESSION.map(({ arp }) => randomPattern(arp.length));
            }
            pad(t, chord.pad, STEPS_PER_CHORD * STEP);
            bass(t, chord.bass, STEPS_PER_CHORD * STEP);
        }

        // Primeiro compasso só com pad e baixo, o arpejo entra depois
        const hit = index >= 8 ? patterns[chordIndex][local] : null;
        if (hit) pluck(t + Math.random() * 0.012, chord.arp[hit.index], hit.velocity);

        if ((local === 0 && Math.random() < 0.45) || (local === 11 && Math.random() < 0.25)) {
            const note = chord.arp[Math.floor(Math.random() * chord.arp.length)] + 12;
            bell(ctx, bellBus, note, t, 0.02, 2.4);
        }
    }

    // Vento espacial: ruído num bandpass que varre bem devagar
    function startWind() {
        wind = ctx.createBufferSource();
        const windFilter = ctx.createBiquadFilter();
        const windAmp = ctx.createGain();
        const windLfo = ctx.createOscillator();
        const windDepth = ctx.createGain();
        wind.buffer = noiseBuffer(ctx);
        wind.loop = true;
        windFilter.type = 'bandpass';
        windFilter.Q.value = 0.9;
        windFilter.frequency.value = 650;
        windLfo.frequency.value = 0.05;
        windDepth.gain.value = 300;
        windAmp.gain.value = 0.025;
        windLfo.connect(windDepth).connect(windFilter.frequency);
        wind.connect(windFilter).connect(windAmp).connect(music);
        wind.onended = () => { windLfo.stop(); windAmp.disconnect(); };
        wind.start();
        windLfo.start();
    }

    function stopWind() {
        wind?.stop();
        wind = null;
    }

    return { start: engine.start, stop: engine.stop, setVolume: engine.setVolume };
}
