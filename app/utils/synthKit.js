// Peças comuns para sons gerados com Web Audio: nota MIDI -> Hz, ruído e reverb sintético.

export const mtof = midi => 440 * 2 ** ((midi - 69) / 12);

const noiseBuffers = new WeakMap();
export function noiseBuffer(ctx) {
    let buffer = noiseBuffers.get(ctx);
    if (buffer) return buffer;
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
    return buffer;
}

// Resposta de impulso feita de ruído estéreo decaindo: sala grande sem precisar de arquivo
export function createReverb(ctx, seconds = 2.5, decay = 2.5) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
}

// Metal/sopro: duas serrilhadas desafinadas num lowpass que abre no ataque e assenta.
// attack/release longos viram pad; vibrato entra devagar nas notas seguradas.
export function brass(ctx, out, midi, t, duration, gain, { bright = 3000, attack = 0.02, release = 0.12, detune = 7, vibrato = 0 } = {}) {
    const frequency = mtof(midi);
    const end = t + duration + release * 8;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(frequency * 1.5, t);
    filter.frequency.linearRampToValueAtTime(bright, t + Math.max(attack, 0.03));
    filter.frequency.setTargetAtTime(Math.max(frequency * 2.5, bright * 0.55), t + Math.max(attack, 0.03), 0.15);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + attack);
    amp.gain.setTargetAtTime(gain * 0.75, t + attack, 0.12);
    amp.gain.setTargetAtTime(0, t + duration, release);

    let vibratoDepth = null;
    if (vibrato > 0) {
        const lfo = ctx.createOscillator();
        vibratoDepth = ctx.createGain();
        lfo.frequency.value = 5.2;
        vibratoDepth.gain.setValueAtTime(0, t);
        vibratoDepth.gain.linearRampToValueAtTime(frequency * vibrato, t + Math.min(duration, 0.6));
        lfo.connect(vibratoDepth);
        lfo.start(t);
        lfo.stop(end);
    }

    for (const cents of [-detune, detune]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = frequency;
        osc.detune.value = cents;
        vibratoDepth?.connect(osc.frequency);
        osc.connect(filter);
        osc.start(t);
        osc.stop(end);
    }
    filter.connect(amp).connect(out);
}

// Sino FM: modulador inarmônico que some rápido deixa só o brilho limpo
export function bell(ctx, out, midi, t, gain, decay = 1.2) {
    const frequency = mtof(midi);
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const amp = ctx.createGain();

    carrier.frequency.value = frequency;
    modulator.frequency.value = frequency * 3.5;
    modGain.gain.setValueAtTime(frequency * 1.4, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + decay * 0.5);

    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), t + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    modulator.connect(modGain).connect(carrier.frequency);
    carrier.connect(amp).connect(out);
    for (const osc of [carrier, modulator]) {
        osc.start(t);
        osc.stop(t + decay + 0.05);
    }
}

// Batida grave com estalo de ruído (bumbo de orquestra / impacto)
export function boom(ctx, out, t, { from = 120, to = 40, gain = 0.6, decay = 0.8 } = {}) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + 0.25);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(amp).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.05);

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const noiseAmp = ctx.createGain();
    noise.buffer = noiseBuffer(ctx);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.2);
    noiseAmp.gain.setValueAtTime(0.0001, t);
    noiseAmp.gain.exponentialRampToValueAtTime(gain * 0.5, t + 0.004);
    noiseAmp.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    noise.connect(filter).connect(noiseAmp).connect(out);
    noise.start(t, Math.random());
    noise.stop(t + 0.3);
}

// Relógio das músicas geradas: agenda os passos com antecedência (lookahead), faz fade de entrada
// e saída e pausa com a aba em segundo plano (lá o setInterval atrasa e as notas falhariam).
// As vozes ligam em `input`; onStep(passo, tempo) agenda o que toca naquele passo.
export function createMusicEngine(ctx, output, { stepSeconds, onStep, onStart, onStop }) {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(output);

    let step = 0;
    let nextTime = 0;
    let timer = null;
    let teardownTimer = null;
    let volume = 0;
    let playing = false;
    let stopping = false;
    let disposeOnStop = false;

    function tick() {
        while (nextTime < ctx.currentTime + 0.25) {
            onStep(step, nextTime);
            nextTime += stepSeconds;
            step++;
        }
    }

    function runScheduler() {
        clearInterval(timer);
        nextTime = Math.max(nextTime, ctx.currentTime + 0.1);
        timer = setInterval(tick, 50);
        tick();
    }

    function rampTo(value, seconds) {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(value, now + seconds);
    }

    function onVisibility() {
        if (!playing || stopping) return;
        if (document.hidden) {
            clearInterval(timer);
            timer = null;
            rampTo(0, 0.3);
        } else {
            nextTime = ctx.currentTime + 0.1;
            runScheduler();
            rampTo(volume, 1.2);
        }
    }

    function teardown() {
        clearInterval(timer);
        timer = null;
        playing = false;
        stopping = false;
        document.removeEventListener('visibilitychange', onVisibility);
        onStop?.();
        if (disposeOnStop) master.disconnect();
    }

    function start(newVolume = 1, fadeIn = 2.5) {
        volume = newVolume;
        clearTimeout(teardownTimer);
        stopping = false;

        if (!playing) {
            playing = true;
            step = 0;
            nextTime = 0;
            document.addEventListener('visibilitychange', onVisibility);
            onStart?.();
            if (!document.hidden) runScheduler();
        }
        if (!document.hidden) rampTo(volume, fadeIn);
    }

    // dispose: desliga o motor de vez depois do fade (quando outra música vai tomar o lugar)
    function stop(fade = 1.2, { dispose = false } = {}) {
        disposeOnStop ||= dispose;
        if (!playing) {
            if (dispose) master.disconnect();
            return;
        }
        if (stopping) return;
        stopping = true;
        rampTo(0, fade);
        teardownTimer = setTimeout(teardown, fade * 1000 + 100);
    }

    function setVolume(newVolume) {
        volume = newVolume;
        if (playing && !stopping && !document.hidden) {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
        }
    }

    return { input: master, start, stop, setVolume };
}

// Ruído filtrado varrendo a frequência (subida de "whoosh" ou cauda de brilho)
export function sweep(ctx, out, t, duration, { from, to, gain, type = 'bandpass', q = 1.5, peakAt = 0.8 }) {
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    noise.buffer = noiseBuffer(ctx);
    noise.loop = true;
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + duration);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + duration * peakAt);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    noise.connect(filter).connect(amp).connect(out);
    noise.start(t, Math.random());
    noise.stop(t + duration + 0.05);
}
