// Sons curtos de interface gerados na hora com Web Audio (sem arquivos).
// Cada som é uma lista de "notas": osciladores com envelope rápido e glide de frequência.

const UI_SOUNDS = {
    // Toque em botão comum
    tap: [{ type: 'sine', from: 660, to: 440, duration: 0.07, gain: 0.35 }],
    // Passar o mouse por cima (só desktop), bem discreto
    hover: [{ type: 'triangle', from: 1500, to: 1350, duration: 0.03, gain: 0.07 }],
    // Troca de aba
    tab: [{ type: 'triangle', from: 520, to: 780, duration: 0.09, gain: 0.3 }],
    // Ação principal (INICIAR, escolher habilidade)
    confirm: [
        { type: 'triangle', from: 523, to: 523, duration: 0.08, gain: 0.3 },
        { type: 'triangle', from: 784, to: 784, duration: 0.14, gain: 0.3, delay: 0.07 },
    ],
    // Liga/desliga
    toggleOn: [
        { type: 'sine', from: 440, to: 440, duration: 0.05, gain: 0.3 },
        { type: 'sine', from: 660, to: 660, duration: 0.07, gain: 0.3, delay: 0.05 },
    ],
    toggleOff: [
        { type: 'sine', from: 660, to: 660, duration: 0.05, gain: 0.3 },
        { type: 'sine', from: 440, to: 440, duration: 0.07, gain: 0.3, delay: 0.05 },
    ],
    // Abrir/fechar modal
    open: [{ type: 'sine', from: 280, to: 720, duration: 0.14, gain: 0.25 }],
    close: [{ type: 'sine', from: 620, to: 240, duration: 0.12, gain: 0.22 }],
    // Arrastar slider
    tick: [{ type: 'square', from: 1200, to: 1200, duration: 0.015, gain: 0.05 }],
    // Atributo subiu (arpejo para cima) / desceu (glide para baixo)
    statUp: [
        { type: 'triangle', from: 523, to: 523, duration: 0.07, gain: 0.28 },
        { type: 'triangle', from: 659, to: 659, duration: 0.07, gain: 0.28, delay: 0.06 },
        { type: 'triangle', from: 1047, to: 1047, duration: 0.16, gain: 0.3, delay: 0.12 },
    ],
    statDown: [
        { type: 'sawtooth', from: 330, to: 196, duration: 0.18, gain: 0.12 },
        { type: 'sine', from: 247, to: 147, duration: 0.2, gain: 0.25, delay: 0.08 },
    ],
    // Recompensa resgatada (missões, ofertas, marcos): fanfarra curta que sobe e abre em brilho
    reward: [
        { type: 'triangle', from: 523, to: 523, duration: 0.1, gain: 0.3 },
        { type: 'triangle', from: 659, to: 659, duration: 0.1, gain: 0.3, delay: 0.08 },
        { type: 'triangle', from: 784, to: 784, duration: 0.12, gain: 0.32, delay: 0.16 },
        { type: 'triangle', from: 1047, to: 1047, duration: 0.45, gain: 0.34, delay: 0.24 },
        // Sinos por cima da nota final, para a cauda soar "brilhante" em vez de seca
        { type: 'sine', from: 1568, to: 1568, duration: 0.5, gain: 0.14, delay: 0.26 },
        { type: 'sine', from: 2093, to: 2093, duration: 0.42, gain: 0.08, delay: 0.32 },
    ],
    // Missão resgatada na lista: versão curta da fanfarra, para poder repetir sem cansar
    claim: [
        { type: 'triangle', from: 784, to: 784, duration: 0.07, gain: 0.3 },
        { type: 'triangle', from: 1047, to: 1047, duration: 0.2, gain: 0.32, delay: 0.06 },
        { type: 'sine', from: 1568, to: 1568, duration: 0.24, gain: 0.1, delay: 0.1 },
    ],
    // Fusão concluída no Mecânico
    fuse: [
        { type: 'sine', from: 200, to: 900, duration: 0.3, gain: 0.25 },
        { type: 'triangle', from: 784, to: 784, duration: 0.1, gain: 0.3, delay: 0.3 },
        { type: 'triangle', from: 1175, to: 1175, duration: 0.25, gain: 0.3, delay: 0.38 },
    ],
};

// Vibração de cada som, no formato da Vibration API (ms ou [vibra, pausa, vibra...]).
export const UI_HAPTICS = {
    tap: 8,
    tab: 10,
    toggleOn: 14,
    toggleOff: 14,
    confirm: [12, 40, 18],
    claim: [10, 30, 16],
    reward: [14, 35, 18, 35, 26],
};

export function playUiSynth(ctx, kind, volume = 1) {
    const notes = UI_SOUNDS[kind];
    if (!notes || !ctx) return;

    // Pequena variação de afinação para não cansar em cliques repetidos
    const detune = 1 + (Math.random() - 0.5) * 0.06;
    const now = ctx.currentTime;

    for (const note of notes) {
        const start = now + (note.delay ?? 0);
        const end = start + note.duration;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = note.type;
        osc.frequency.setValueAtTime(note.from * detune, start);
        osc.frequency.exponentialRampToValueAtTime(note.to * detune, end);

        const peak = Math.max(note.gain * volume, 0.0001);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
    }
}
