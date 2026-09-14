<script setup lang="js">
// Card de resultado da partida (derrota e vitória) no estilo das cartas de habilidade e da faixa de título:
// contorno escuro, sombra dura embaixo, brilho no topo, etiqueta pendurada e rodapé claro.
// `gold` põe o anel dourado em volta; `sheen` liga o reflexo que atravessa o card de tempos em tempos.
defineProps({
  label: { type: String, required: true },
  variant: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'red', 'green', 'orange', 'purple', 'gray'].includes(value),
  },
  /** Salas feitas (conta de 0 até aqui) */
  value: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  chapter: { type: Number, default: 1 },
  shipLevel: { type: Number, default: 1 },
  /** Atraso da contagem (ms), para casar com a animação de entrada de quem usa */
  countDelay: { type: Number, default: 0 },
  gold: { type: Boolean, default: false },
  sheen: { type: Boolean, default: false },
});
</script>

<template>
  <div class="rcard" :class="[`is-${variant}`, { 'is-gold': gold }]">
    <div class="rcard__body">
      <span class="rcard__pattern" aria-hidden="true"></span>
      <span class="rcard__shine" aria-hidden="true"></span>
      <span v-if="sheen" class="rcard__sheen" aria-hidden="true"></span>

      <span class="rcard__label">{{ label }}</span>

      <p class="rcard__score">
        <PlayCountUp class="rcard__value" :to="value" :delay="countDelay" /><span class="rcard__total">/{{ total }}</span>
      </p>

      <div class="rcard__footer">
        <strong class="rcard__chapter">Capítulo {{ chapter }}</strong>
        <span class="rcard__ship">Nave nv. {{ shipLevel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rcard {
  /* Paleta azul (padrão); as variantes trocam só as variáveis */
  --from: #5fb8ff;
  --to: #2a74db;
  --outline: #173f7d;
  --accent: #d4ecff;
  --foot-1: #eef6ff;
  --foot-2: #c9dcf3;
  --foot-text: #3a4a6b;

  position: relative;
  width: 200px;
  max-width: 100%;
  margin-inline: auto;
  border-radius: 18px;
  filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.45));
}

.rcard__body {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding-top: 34px;
  border-radius: 16px;
  border: 3px solid var(--outline);
  background: linear-gradient(var(--from), var(--to) 80%);
  box-shadow:
    0 6px 0 var(--outline),
    inset 0 3px 0 rgba(255, 255, 255, 0.45),
    inset 0 -6px 0 rgba(0, 0, 0, 0.12);
}

/* Anel dourado em volta (vitória): mesmo acabamento do anel da moldura de raridade */
.rcard.is-gold {
  padding: 6px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fff3b0 0%, #ffd24d 45%, #e9a11a 100%);
  box-shadow:
    0 0 0 3px #7a4a00,
    0 6px 0 3px #7a4a00,
    inset 0 2px 0 rgba(255, 255, 255, 0.75),
    inset 0 -3px 0 rgba(0, 0, 0, 0.15);
}
.rcard.is-gold .rcard__body {
  box-shadow:
    inset 0 3px 0 rgba(255, 255, 255, 0.45),
    inset 0 -6px 0 rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(122, 74, 0, 0.5);
}

/* Losangos bem suaves no fundo, sumindo para baixo */
.rcard__pattern {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(225deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(315deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%);
  background-size: 36px 36px;
  background-position: center;
  -webkit-mask-image: linear-gradient(#000 30%, transparent 85%);
  mask-image: linear-gradient(#000 30%, transparent 85%);
  pointer-events: none;
}

/* Brilho oval do canto (igual às cartas de habilidade) */
.rcard__shine {
  position: absolute;
  z-index: 3;
  top: 7px;
  left: 10px;
  width: 20px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  rotate: -30deg;
  pointer-events: none;
}

.rcard__sheen {
  position: absolute;
  z-index: 3;
  inset: -20% auto -20% 0;
  width: 45%;
  background: linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.6) 50%, transparent 80%);
  translate: -160% 0;
  skew: -18deg 0;
  mix-blend-mode: soft-light;
  pointer-events: none;
  animation: rcard-sheen 3.4s ease-in-out 0.9s infinite;
}

/* Etiqueta pendurada no topo */
.rcard__label {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 50%;
  translate: -50% 0;
  padding: 4px 14px 5px;
  border-radius: 0 0 12px 12px;
  background: var(--outline);
  font: 12px/1 'Lilita One', sans-serif;
  letter-spacing: 0.6px;
  color: var(--accent);
  text-transform: uppercase;
  white-space: nowrap;
}

.rcard__score {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 4px 8px 12px;
  white-space: nowrap;
  line-height: 1;
  font-family: 'Lilita One', sans-serif;
  color: #fff;
  paint-order: stroke fill;
}
.rcard__value {
  font-size: 76px;
  -webkit-text-stroke: 9px var(--outline);
  paint-order: stroke fill;
  text-shadow: 0 6px 0 var(--outline);
}
.rcard__total {
  margin-left: 2px;
  font-size: 30px;
  color: var(--accent);
  -webkit-text-stroke: 6px var(--outline);
  paint-order: stroke fill;
  text-shadow: 0 3px 0 var(--outline);
}

/* Rodapé claro (igual à área de descrição das cartas) */
.rcard__footer {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 9px 10px 11px;
  background: linear-gradient(var(--foot-1), var(--foot-2));
  border-top: 2px solid rgba(0, 0, 0, 0.18);
}
.rcard__chapter {
  font: 20px/1 'Lilita One', sans-serif;
  letter-spacing: 0.3px;
  color: #fff;
  -webkit-text-stroke: 5px var(--outline);
  paint-order: stroke fill;
}
.rcard__ship {
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font: 11px/1.2 'Fredoka One', sans-serif;
  color: var(--foot-text);
}

/* ==================== Variantes ==================== */
.rcard.is-red {
  --from: #ff8a78;
  --to: #dc3e33;
  --outline: #6e1414;
  --accent: #ffd6cc;
  --foot-1: #fff2ee;
  --foot-2: #f6d2c9;
  --foot-text: #6b3a36;
}
.rcard.is-green {
  --from: #7fe46a;
  --to: #34a526;
  --outline: #1f5f19;
  --accent: #d6ffc9;
  --foot-1: #f1ffec;
  --foot-2: #cdeec2;
  --foot-text: #2f5a28;
}
.rcard.is-orange {
  --from: #ffd257;
  --to: #f08a14;
  --outline: #7a4006;
  --accent: #fff0c0;
  --foot-1: #fff8e6;
  --foot-2: #f7dfb0;
  --foot-text: #6b4a1a;
}
.rcard.is-purple {
  --from: #d07cff;
  --to: #8a32cf;
  --outline: #3f1470;
  --accent: #f3d9ff;
  --foot-1: #f9f0ff;
  --foot-2: #e3cff3;
  --foot-text: #4f3a6b;
}
.rcard.is-gray {
  --from: #c9d0db;
  --to: #8e97a6;
  --outline: #3c4352;
  --accent: #eef1f6;
  --foot-1: #f4f6fa;
  --foot-2: #d8dde5;
  --foot-text: #3c4352;
}

@keyframes rcard-sheen {
  0%,
  55% {
    translate: -160% 0;
  }
  100% {
    translate: 360% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rcard__sheen {
    animation: none;
    display: none;
  }
}
</style>
