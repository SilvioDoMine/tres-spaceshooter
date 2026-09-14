// Sons de combate dos inimigos gerados na hora com Web Audio (sem arquivos).
//
// Base em ruído, não em tom: armas de ficção científica soam como descargas (estalo + sopro filtrado +
// baque grave), sem os apitos que varrem o agudo. Tons só entram graves e curtos, para dar peso.
//
// 'enemy-shot' -> timbre pela família da arma (variant):
//   orb: blaster seco ("tchk")          plasma: sopro quente e abafado ("fwump")
//   heavy: canhão com estalo e baque    lance: descarga elétrica crepitante
//   missile: "thunk" do lançamento + chiado de foguete que se afasta
//   A rajada muda o som: leque (fan) vira camadas rápidas espalhadas no estéreo; anel/espiral ganha um
//   "whoomp" largo; canos duplos (twin) e bordada (broadside) saem dos dois lados. Chefes pesam mais.
// 'enemy-hit' -> explosão pequena: estouro de ruído que fecha rápido + corpo de ruído grave + baque
//   (mais grave e longa em inimigo grande; crítico explode um pouco maior).
// 'enemy-death' -> explosão grande: estouro aberto, corpo grave largo no estéreo, baque profundo,
//   crepitar de fogo sumindo e rumor longo (bem maior nos chefes, com uma segunda explosão).
//
// rr (round-robin): cada som seguido usa outra das 4 variações (afinação, filtro, duração), para
// não cansar o ouvido; o ruído também começa num ponto aleatório a cada vez.

import { noiseBuffer } from '~/utils/synthKit';

// ==================== Barramento compartilhado (um por contexto) ====================

const buses = new WeakMap();

function getBus(ctx) {
    let bus = buses.get(ctx);
    if (bus) return bus;

    // Compressão leve só para colar as camadas; sem reverb
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 10;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 9000;

    const master = ctx.createGain();
    master.gain.value = 0.8;

    compressor.connect(soften).connect(master).connect(ctx.destination);

    // Saturação suave usada só nas explosões (dá o "rasgado" do estouro)
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 2) / Math.tanh(2);
    }

    bus = { input: compressor, curve };
    buses.set(ctx, bus);
    return bus;
}

// Saída de um som: ganho -> (saturação) -> pan -> barramento, desligada sozinha depois de `ms`
function output(ctx, bus, { pan = 0, level, ms, drive = false }) {
    const out = ctx.createGain();
    out.gain.value = level;
    let tail = out;
    const nodes = [out];
    if (drive) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = bus.curve;
        tail.connect(shaper);
        tail = shaper;
        nodes.push(shaper);
    }
    if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        tail.connect(panner);
        tail = panner;
        nodes.push(panner);
    }
    tail.connect(bus.input);
    setTimeout(() => nodes.forEach(node => node.disconnect()), ms);
    return out;
}

// ==================== Ruído marrom (grave, "rumoroso") ====================

const brownBuffers = new WeakMap();

function brownBuffer(ctx) {
    let buffer = brownBuffers.get(ctx);
    if (buffer) return buffer;
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 3), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
    }
    brownBuffers.set(ctx, buffer);
    return buffer;
}

// ==================== Variações ====================

// Quatro variações em sequência: afinação, cor do filtro e duração mudam juntas
const ROUND_ROBIN = [
    { pitch: 1, color: 1, length: 1 },
    { pitch: 0.94, color: 0.88, length: 1.08 },
    { pitch: 1.05, color: 1.12, length: 0.93 },
    { pitch: 0.98, color: 0.95, length: 1.04 },
];

const around = (value, amount = 0.03) => value * (1 + (Math.random() * 2 - 1) * amount);
const between = (min, max) => min + Math.random() * (max - min);

// ==================== Peças ====================

function env(param, t, peak, attack, decay) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + attack);
    param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

// Ruído filtrado com envelope. color: 'white' (estouro, chiado) ou 'brown' (corpo grave da explosão).
// `flutter` modula a amplitude (crepitar elétrico / chama de foguete).
function noise(ctx, out, { t, type = 'bandpass', from, to = from, q = 1, gain, attack = 0.002, decay, color = 'white', flutter = 0, flutterDepth = 0.8 }) {
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    const end = t + attack + decay;
    source.buffer = color === 'brown' ? brownBuffer(ctx) : noiseBuffer(ctx);
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(to, 30), end);
    env(amp.gain, t, gain, attack, decay);
    source.connect(filter);

    if (flutter > 0) {
        const tremolo = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
        tremolo.gain.value = 1 - flutterDepth / 2;
        lfo.type = 'square';
        lfo.frequency.value = flutter;
        depth.gain.value = flutterDepth / 2;
        lfo.connect(depth).connect(tremolo.gain);
        filter.connect(tremolo).connect(amp);
        lfo.start(t);
        lfo.stop(end + 0.03);
    } else {
        filter.connect(amp);
    }

    amp.connect(out);
    source.start(t, Math.random() * 1.4);
    source.stop(end + 0.03);
}

// Baque grave: senoide que cai rápido (peso, sem "blip" audível)
function thump(ctx, out, { t, from, to, gain, decay }) {
    const osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + decay * 0.7);
    env(amp.gain, t, gain, 0.003, decay);
    osc.connect(amp).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.03);
}

// Corpo tonal grave e abafado (serrilhada num lowpass baixo): encorpa sem virar apito
function growl(ctx, out, { t, from, to, gain, decay, cutoff = 700 }) {
    const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + decay);
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    filter.frequency.value = cutoff;
    env(amp.gain, t, gain, 0.004, decay);
    osc.connect(filter).connect(amp).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.03);
}

// Crepitar de fogo: ruído num lowpass com o volume saltando em degraus aleatórios e sumindo
function crackle(ctx, out, { t, duration, gain, cutoff = 2600 }) {
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    source.buffer = noiseBuffer(ctx);
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    amp.gain.setValueAtTime(0, t);
    for (let at = t; at < t + duration; at += between(0.012, 0.035)) {
        const fade = 1 - (at - t) / duration;
        // Poucos picos fortes no meio de silêncio: é o que soa como estalido de fogo, não chiado
        amp.gain.setValueAtTime(Math.random() < 0.35 ? gain * fade * between(0.5, 1) : 0, at);
    }
    amp.gain.setValueAtTime(0, t + duration);
    source.connect(filter).connect(amp).connect(out);
    source.start(t, Math.random() * 1.4);
    source.stop(t + duration + 0.03);
}

// ==================== Armas (uma camada) ====================

function orb(ctx, out, t, v, weight) {
    noise(ctx, out, { t, type: 'highpass', from: 3800 * v.color, gain: 0.05, decay: 0.012 });
    noise(ctx, out, { t, type: 'bandpass', from: 1500 * v.color, to: 700 * v.color, q: 1.1, gain: 0.11, decay: 0.07 * v.length });
    thump(ctx, out, { t, from: 150 * v.pitch, to: 80 * v.pitch, gain: 0.1 * weight, decay: 0.06 * v.length });
}

function plasma(ctx, out, t, v, weight) {
    noise(ctx, out, { t, type: 'lowpass', from: 2600 * v.color, to: 450 * v.color, q: 1.4, gain: 0.13, attack: 0.006, decay: 0.12 * v.length });
    growl(ctx, out, { t, from: 170 * v.pitch, to: 105 * v.pitch, gain: 0.05, decay: 0.1 * v.length, cutoff: 600 * v.color });
    thump(ctx, out, { t, from: 120 * v.pitch, to: 60 * v.pitch, gain: 0.09 * weight, decay: 0.08 * v.length });
}

function heavy(ctx, out, t, v, weight) {
    noise(ctx, out, { t, type: 'highpass', from: 2400 * v.color, gain: 0.09, decay: 0.015 });
    noise(ctx, out, { t, type: 'lowpass', from: 1600 * v.color, to: 300, q: 0.8, gain: 0.15, decay: 0.13 * v.length });
    growl(ctx, out, { t, from: 110 * v.pitch, to: 60 * v.pitch, gain: 0.06, decay: 0.12 * v.length, cutoff: 500 });
    thump(ctx, out, { t, from: 95 * v.pitch, to: 42 * v.pitch, gain: 0.2 * weight, decay: 0.15 * v.length });
}

function lance(ctx, out, t, v, weight) {
    noise(ctx, out, { t, type: 'highpass', from: 4200 * v.color, gain: 0.08, decay: 0.01 });
    // Arco elétrico: ruído estreito crepitando (amplitude picada em ~50 Hz)
    noise(ctx, out, { t, type: 'bandpass', from: 3400 * v.color, to: 1800 * v.color, q: 4, gain: 0.12, attack: 0.003, decay: 0.12 * v.length, flutter: 48 * v.pitch, flutterDepth: 0.9 });
    noise(ctx, out, { t, type: 'lowpass', from: 900, to: 300, gain: 0.06, decay: 0.07 });
    thump(ctx, out, { t, from: 130 * v.pitch, to: 70 * v.pitch, gain: 0.08 * weight, decay: 0.07 });
}

function missile(ctx, out, t, v, weight) {
    // Lançamento
    thump(ctx, out, { t, from: 85 * v.pitch, to: 40 * v.pitch, gain: 0.16 * weight, decay: 0.12 });
    noise(ctx, out, { t, type: 'lowpass', from: 1100 * v.color, to: 250, gain: 0.1, decay: 0.05 });
    // Chiado do foguete saindo: sobe um pouco e se afasta, com a chama tremulando
    noise(ctx, out, { t: t + 0.02, type: 'bandpass', from: 800 * v.color, to: 2000 * v.color, q: 1.2, gain: 0.07, attack: 0.05, decay: 0.3 * v.length, flutter: 23, flutterDepth: 0.35 });
}

const WEAPONS = { orb, plasma, heavy, lance, missile };

// ==================== Rajadas ====================

// Monta a rajada: `layer(delay, pan, variação)` toca uma camada da arma
function volley(ctx, bus, t, { voice, v, weight, count, pattern, pan, gain }) {
    const layer = (delay, offsetPan, layerV, layerGain = 1) => {
        const out = output(ctx, bus, { pan: pan + offsetPan, level: gain * layerGain, ms: (delay + 0.7) * 1000 });
        voice(ctx, out, t + delay, layerV, weight);
    };
    const shifted = (pitch, color) => ({ ...v, pitch: v.pitch * pitch, color: v.color * color });

    if (count <= 1) {
        layer(0, 0, v);
        return;
    }

    if (pattern === 'fan') {
        // Três saídas rápidas em sequência abrindo no estéreo ("trrk")
        layer(0, -0.3, shifted(1.03, 1.05), 0.7);
        layer(0.016, 0, v, 0.75);
        layer(0.032, 0.3, shifted(0.97, 0.95), 0.7);
        return;
    }

    if (pattern === 'twin') {
        // Canos duplos (Colmeia, Harpia): dois disparos colados, um de cada lado
        layer(0, -0.25, shifted(1.02, 1.03), 0.8);
        layer(0.012, 0.25, shifted(0.98, 0.97), 0.8);
        return;
    }

    if (pattern === 'broadside') {
        // Baterias dos dois lados, quase juntas
        layer(0, -0.6, shifted(1, 1.04), 0.8);
        layer(0.022, 0.6, shifted(0.96, 0.96), 0.8);
        return;
    }

    // ring / spiral: camadas largas + sopro grave em volta
    layer(0, -0.45, shifted(1.02, 1.06), 0.65);
    layer(0.01, 0.45, shifted(0.98, 0.94), 0.65);
    const whoomp = output(ctx, bus, { pan, level: gain, ms: 700 });
    noise(ctx, whoomp, { t, type: 'lowpass', from: 700 * v.color, to: 180, q: 0.8, gain: 0.08 + Math.min(count, 12) * 0.006, attack: 0.012, decay: 0.2 });
}

// ==================== Explosão pequena (acerto) ====================

function enemyHit(ctx, out, t, v, { size = 1, critical = false }) {
    const scale = Math.max(0.5, Math.min(2.5, size)) * (critical ? 1.35 : 1);
    const heft = Math.sqrt(scale);
    const length = v.length * heft;
    // Crítico: explosão um pouco maior também em volume (só escurecer e alongar não soava maior)
    const punch = critical ? 1.45 : 1;

    // Estouro: ruído que começa aberto e fecha rápido
    noise(ctx, out, { t, type: 'lowpass', from: (5200 / heft) * v.color, to: 700, q: 0.6, gain: 0.22 * punch, attack: 0.002, decay: 0.05 * length });
    // Corpo: ruído grave fechando (o "pof" da explosão)
    noise(ctx, out, { t, type: 'lowpass', from: (1800 / heft) * v.color, to: 160, q: 0.7, gain: 0.3 * punch, attack: 0.004, decay: 0.13 * length, color: 'brown' });
    // Baque
    thump(ctx, out, { t, from: (110 / heft) * v.pitch, to: 40, gain: 0.2 * punch, decay: 0.1 * length });
}

// ==================== Explosão grande (destruição) ====================

function enemyDeath(ctx, bus, t, v, { size = 1, boss = false, pan, level }) {
    const scale = Math.max(0.6, Math.min(3, size)) * (boss ? 1.9 : 1);
    const heft = Math.sqrt(scale);
    const length = v.length * (0.85 + 0.2 * heft);
    const ms = (boss ? 2.4 : 1.4) * 1000;

    const center = output(ctx, bus, { pan, level, ms, drive: true });
    // Corpo em duas camadas de ruído independentes, uma para cada lado: explosão larga no estéreo
    const left = output(ctx, bus, { pan: pan - 0.35, level: level * 0.8, ms, drive: true });
    const right = output(ctx, bus, { pan: pan + 0.35, level: level * 0.8, ms, drive: true });

    // Estouro inicial que fecha (não muito aberto, para a explosão soar grave e não chiada)
    noise(ctx, center, { t, type: 'lowpass', from: 4500 * v.color, to: 350, q: 0.5, gain: 0.22, attack: 0.003, decay: 0.22 * length });
    // Corpo grave fechando devagar
    for (const side of [left, right]) {
        noise(ctx, side, { t, type: 'lowpass', from: (1700 / heft) * v.color, to: 110, q: 0.7, gain: 0.34, attack: 0.006, decay: 0.55 * length, color: 'brown' });
    }
    // Baque profundo em duas camadas
    thump(ctx, center, { t, from: (80 / heft) * v.pitch, to: 28, gain: 0.34, decay: 0.45 * length });
    thump(ctx, center, { t: t + 0.01, from: 140 * v.pitch, to: 50, gain: 0.14, decay: 0.16 });
    // Fogo crepitando e rumor longo por baixo
    crackle(ctx, left, { t: t + 0.05, duration: 0.45 * length, gain: 0.1, cutoff: 1800 * v.color });
    crackle(ctx, right, { t: t + 0.07, duration: 0.45 * length, gain: 0.1, cutoff: 1650 * v.color });
    noise(ctx, center, { t, type: 'lowpass', from: 320, to: 70, q: 0.5, gain: 0.16, attack: 0.04, decay: 0.8 * length, color: 'brown' });

    if (boss) {
        // Chefe: segunda explosão e rumor mais longo
        const late = t + between(0.24, 0.32);
        noise(ctx, center, { t: late, type: 'lowpass', from: 5000, to: 250, q: 0.5, gain: 0.24, attack: 0.004, decay: 0.3 });
        noise(ctx, left, { t: late, type: 'lowpass', from: 1200, to: 90, gain: 0.28, attack: 0.008, decay: 0.7, color: 'brown' });
        thump(ctx, center, { t: late, from: 70, to: 26, gain: 0.3, decay: 0.55 });
        crackle(ctx, right, { t: late + 0.05, duration: 0.8, gain: 0.1 });
        noise(ctx, center, { t, type: 'lowpass', from: 220, to: 50, q: 0.5, gain: 0.2, attack: 0.08, decay: 1.6, color: 'brown' });
    }
}

// ==================== Entrada ====================

// Ganho de cada som para ficarem no mesmo nível percebido, abaixo do tiro do jogador:
// ruído em filtro estreito perde muita energia, então as armas mais "finas" sobem mais que o canhão.
const WEAPON_TRIM = { orb: 10, plasma: 8, heavy: 3, lance: 10, missile: 4.5 };
// Explosões contidas: acerto bem abaixo do tiro do jogador, morte um pouco abaixo dele
const HIT_TRIM = 1.5;
const DEATH_TRIM = 0.8;
// Rajadas somam várias camadas: descem um pouco para não passarem do tiro do jogador
const VOLLEY_TRIM = 0.6;

export function playCombatSynth(ctx, kind, volume = 1, {
    variant = 'orb', pan = 0, gain = 1, size = 1, critical = false,
    count = 1, pattern = 'aim', boss = false, rr = 0,
} = {}) {
    if (!ctx || volume <= 0 || gain <= 0) return;

    const bus = getBus(ctx);
    const t = ctx.currentTime + 0.002;
    const base = ROUND_ROBIN[rr % ROUND_ROBIN.length];
    // Pequena variação aleatória por cima da variação fixa
    const v = { pitch: around(base.pitch, 0.02), color: around(base.color, 0.04), length: base.length };
    const level = volume * gain;

    if (kind === 'enemy-shot') {
        const voice = WEAPONS[variant] ?? orb;
        const trim = (WEAPON_TRIM[variant] ?? WEAPON_TRIM.orb) * (count > 1 ? VOLLEY_TRIM : 1);
        volley(ctx, bus, t, { voice, v, weight: boss ? 1.5 : 1, count, pattern, pan, gain: level * trim });
    } else if (kind === 'enemy-hit') {
        enemyHit(ctx, output(ctx, bus, { pan, level: level * HIT_TRIM, ms: 700, drive: true }), t, v, { size, critical });
    } else if (kind === 'enemy-death') {
        enemyDeath(ctx, bus, t, v, { size, boss, pan, level: level * DEATH_TRIM });
    }
}
