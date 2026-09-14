// Sons do coração de cura gerados na hora com Web Audio (sem arquivos).
// pull: sopro de ar filtrado subindo junto com um brilho senoidal enquanto o coração voa até a nave.
// heal: "bloom" suave com dois sinos em quinta e um eco curto quando ele entra e cura.

let noiseBuffer = null;
function noise(ctx) {
    if (noiseBuffer?.sampleRate === ctx.sampleRate) return noiseBuffer;
    noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
}

function envelope(param, start, attack, peak, end) {
    param.setValueAtTime(0.0001, start);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + attack);
    param.exponentialRampToValueAtTime(0.0001, end);
}

function tone(ctx, out, { type = 'sine', from, to = from, delay = 0, attack = 0.008, duration, gain }) {
    const start = ctx.currentTime + delay, end = start + duration;
    const osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, end);
    envelope(amp.gain, start, attack, gain, end);
    osc.connect(amp).connect(out);
    osc.start(start);
    osc.stop(end + 0.02);
}

function playPull(ctx, out, duration) {
    const start = ctx.currentTime, end = start + duration;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    source.buffer = noise(ctx);
    filter.type = 'bandpass';
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(700, start);
    filter.frequency.exponentialRampToValueAtTime(4200, end);
    // Cresce durante o voo e corta logo antes de entrar, abrindo espaço para o som da cura
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(0.5, end - 0.03);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter).connect(amp).connect(out);
    source.start(start);
    source.stop(end + 0.02);
    tone(ctx, out, { from: 520, to: 1560, attack: duration * 0.8, duration, gain: 0.07 });
}

function playHeal(ctx, out) {
    // Eco curto e abafado dá cauda "brilhante" sem precisar de reverb
    const delay = ctx.createDelay(0.3), feedback = ctx.createGain(), damp = ctx.createBiquadFilter();
    delay.delayTime.value = 0.085;
    feedback.gain.value = 0.3;
    damp.type = 'lowpass';
    damp.frequency.value = 2800;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    out.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(wet).connect(ctx.destination);
    // O loop de feedback não é coletado sozinho
    setTimeout(() => { delay.disconnect(); damp.disconnect(); feedback.disconnect(); wet.disconnect(); }, 1500);

    tone(ctx, out, { type: 'triangle', from: 330, to: 660, attack: 0.004, duration: 0.12, gain: 0.18 });
    tone(ctx, out, { from: 880, attack: 0.005, duration: 0.4, gain: 0.2, delay: 0.02 });
    tone(ctx, out, { from: 1320, attack: 0.005, duration: 0.5, gain: 0.13, delay: 0.07 });
    tone(ctx, out, { from: 2640, attack: 0.003, duration: 0.18, gain: 0.03, delay: 0.07 });
}

export function playHeartSynth(ctx, kind, volume = 1, duration = 0.32) {
    if (!ctx || volume <= 0) return;
    const out = ctx.createGain();
    out.gain.value = volume * 0.6;
    out.connect(ctx.destination);
    if (kind === 'pull') playPull(ctx, out, duration);
    else if (kind === 'heal') playHeal(ctx, out);
    setTimeout(() => out.disconnect(), 2000);
}
