<script setup lang="ts">
// Escudo de um marco: placa dourada com o capítulo e, no corpo, o número da sala.
// O brasão é SVG para ter ombros arredondados e ponta macia (clip-path deixava tudo quadrado e não
// aceita contorno nem sombra). O acabamento segue o resto da UI: contorno escuro, moldura dourada,
// miolo rebaixado e brilho de plástico por cima — mesmo vocabulário de BaseRarityFrame/BaseRibbonTitle.
// O tamanho `sm` é usado nos vizinhos do carrossel, que só existem para mostrar que há mais marcos.
withDefaults(
  defineProps<{
    chapter: number;
    room: number;
    size?: 'sm' | 'lg';
    state?: 'claimed' | 'claimable' | 'locked';
  }>(),
  { size: 'lg', state: 'locked' },
);

// Ids únicos por instância: vários escudos na tela não podem dividir os mesmos gradientes
const uid = useId();
const id = (name: string) => `shield-${uid}-${name}`;
</script>

<template>
  <div class="shield" :class="[`is-${size}`, `is-${state}`]">
    <div class="shield__plate">
      <i aria-hidden="true"></i>
      <span>Capítulo {{ chapter }}</span>
      <i aria-hidden="true"></i>
    </div>

    <div class="shield__crest">
      <svg class="crest" viewBox="0 0 120 140" aria-hidden="true">
        <defs>
          <linearGradient :id="id('gold')" x1="0" y1="0" x2="0" y2="1">
            <stop class="crest__gold-1" offset="0" />
            <stop class="crest__gold-2" offset="0.5" />
            <stop class="crest__gold-3" offset="1" />
          </linearGradient>
          <linearGradient :id="id('face')" x1="0" y1="0" x2="0" y2="1">
            <stop class="crest__face-1" offset="0" />
            <stop class="crest__face-2" offset="1" />
          </linearGradient>
          <linearGradient :id="id('gloss')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="0.5" />
            <stop offset="1" stop-color="#fff" stop-opacity="0.04" />
          </linearGradient>
          <clipPath :id="id('face-clip')">
            <path d="M17 27A11 11 0 0 1 28 16H92A11 11 0 0 1 103 27V77C103 98 87 116 60 126 33 116 17 98 17 77Z" />
          </clipPath>
        </defs>

        <!-- Contorno escuro da silhueta inteira -->
        <path
          class="crest__edge"
          d="M6 26A20 20 0 0 1 26 6H94A20 20 0 0 1 114 26V78C114 102 94 122 60 134 26 122 6 102 6 78Z"
          stroke-width="6"
          stroke-linejoin="round"
        />

        <!-- Moldura dourada -->
        <path
          d="M6 26A20 20 0 0 1 26 6H94A20 20 0 0 1 114 26V78C114 102 94 122 60 134 26 122 6 102 6 78Z"
          :fill="`url(#${id('gold')})`"
        />
        <!-- Luz na aresta de cima da moldura -->
        <path class="crest__rim" d="M10 26A16 16 0 0 1 26 10H94A16 16 0 0 1 110 26" fill="none" stroke-width="3" stroke-linecap="round" />

        <!-- Miolo rebaixado -->
        <path
          d="M17 27A11 11 0 0 1 28 16H92A11 11 0 0 1 103 27V77C103 98 87 116 60 126 33 116 17 98 17 77Z"
          :fill="`url(#${id('face')})`"
        />
        <g :clip-path="`url(#${id('face-clip')})`">
          <!-- Sombra interna no topo e faixa escura embaixo, como nos painéis rebaixados da UI -->
          <path
            class="crest__shade"
            d="M17 27A11 11 0 0 1 28 16H92A11 11 0 0 1 103 27"
            fill="none"
            stroke-width="6"
          />
          <path class="crest__shade" d="M22 112 60 128 98 112" fill="none" stroke-width="7" />
          <!-- Brilho de plástico na metade de cima -->
          <path d="M25 31Q25 22 34 22H86Q95 22 95 31V53C83 65 37 65 25 53Z" :fill="`url(#${id('gloss')})`" />
        </g>
      </svg>

      <div class="shield__inner">
        <span v-if="size === 'lg'" class="shield__tag">Sala</span>
        <strong class="shield__room">{{ room }}</strong>
      </div>

      <span v-if="state === 'claimed'" class="shield__check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M20.3 5.7 9 17l-5.3-5.3 2.1-2.1L9 12.8l9.2-9.2z" /></svg>
      </span>
    </div>
  </div>
</template>

<style scoped>
.shield {
  --w: 168px;
  --plate-h: 34px;
  --gold-1: #ffe98f;
  --gold-2: #f6b62a;
  --gold-3: #c98c0e;
  --face-1: #5a86e0;
  --face-2: #2f4795;
  --edge: #16224d;
  --plate-edge: #8a5300;

  position: relative;
  width: var(--w);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Base sólida curta + sombra macia: mesmo apoio dos botões e molduras do jogo */
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.32)) drop-shadow(0 9px 9px rgba(0, 0, 0, 0.42));
}

/* Placa do capítulo: pílula dourada com contorno, brilho e losangos, igual à faixa de título */
.shield__plate {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 94%;
  height: var(--plate-h);
  padding: 0 10px;
  border-radius: 999px;
  border: 3px solid var(--plate-edge);
  background: linear-gradient(180deg, var(--gold-1) 0%, var(--gold-2) 48%, var(--gold-3) 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.55),
    inset 0 -4px 0 rgba(0, 0, 0, 0.14),
    0 3px 0 var(--plate-edge);
}
.shield__plate::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 9px;
  right: 9px;
  height: 42%;
  border-radius: 999px 999px 50% 50% / 999px 999px 100% 100%;
  background: linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.04));
  pointer-events: none;
}
.shield__plate span {
  position: relative;
  z-index: 1;
  font: 15px/1 'Lilita One', sans-serif;
  color: #fff;
  white-space: nowrap;
  -webkit-text-stroke: 4px var(--plate-edge);
  paint-order: stroke fill;
}
.shield__plate i {
  position: relative;
  z-index: 1;
  width: 9px;
  height: 9px;
  rotate: 45deg;
  flex-shrink: 0;
  border-radius: 3px;
  border: 2px solid var(--plate-edge);
  background: linear-gradient(135deg, #fff 0%, #bfe6ff 45%, #4fa8f0 100%);
}

/* Brasão: o SVG define a silhueta e o conteúdo fica por cima */
.shield__crest {
  position: relative;
  width: 100%;
  margin-top: -9px;
}
.crest {
  display: block;
  width: 100%;
  height: auto;
}
.crest__edge {
  fill: var(--edge);
  stroke: var(--edge);
}
.crest__rim {
  stroke: rgba(255, 255, 255, 0.5);
}
.crest__shade {
  stroke: rgba(0, 0, 0, 0.26);
}
.crest__gold-1 {
  stop-color: var(--gold-1);
}
.crest__gold-2 {
  stop-color: var(--gold-2);
}
.crest__gold-3 {
  stop-color: var(--gold-3);
}
.crest__face-1 {
  stop-color: var(--face-1);
}
.crest__face-2 {
  stop-color: var(--face-2);
}

.shield__inner {
  position: absolute;
  inset: 12% 14% 22%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  pointer-events: none;
}
.shield__tag {
  font: 13px/1 'Lilita One', sans-serif;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
}
.shield__room {
  font: 46px/1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 6px var(--edge);
  paint-order: stroke fill;
}

/* Marco resgatado: medalha redonda com o mesmo acabamento dos ícones verdes da UI */
.shield__check {
  position: absolute;
  right: 6%;
  bottom: 20%;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #1f5f19;
  background: linear-gradient(180deg, #8ceb70 0%, #52c53a 55%, #2f8f1f 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.6),
    0 2px 0 #1f5f19;
}
.shield__check svg {
  width: 62%;
  height: 62%;
  fill: #fff;
  filter: drop-shadow(0 1px 0 rgba(31, 95, 25, 0.8));
}

/* Vizinhos do carrossel: menores e apagados, só para mostrar que a fila continua */
.shield.is-sm {
  --w: 116px;
  --plate-h: 26px;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.3)) drop-shadow(0 7px 7px rgba(0, 0, 0, 0.4));
  opacity: 0.72;
}
.shield.is-sm .shield__plate {
  border-width: 2px;
  gap: 5px;
}
.shield.is-sm .shield__plate span {
  font-size: 12px;
  -webkit-text-stroke-width: 3px;
}
.shield.is-sm .shield__plate i {
  display: none;
}
.shield.is-sm .shield__crest {
  margin-top: -7px;
}
.shield.is-sm .shield__room {
  font-size: 32px;
  -webkit-text-stroke-width: 5px;
}
.shield.is-sm .shield__check {
  width: 24px;
  height: 24px;
}

/* Marco liberado: ouro mais quente e um brilho pulsando atrás */
.shield.is-claimable {
  --gold-1: #fff4bc;
  --gold-2: #ffc63e;
  --gold-3: #dc9c10;
  --face-1: #6b95ee;
  --face-2: #3552ab;
}
.shield.is-claimable.is-lg::before {
  content: '';
  position: absolute;
  inset: -18px;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 214, 110, 0.45), rgba(255, 214, 110, 0));
  animation: shield-glow 1.8s ease-in-out infinite;
}

/* Marco resgatado: ouro e miolo apagados, a medalha verde carrega o destaque */
.shield.is-claimed {
  --face-1: #55618a;
  --face-2: #2b3350;
  --gold-1: #efe6cf;
  --gold-2: #bcab7e;
  --gold-3: #8b7c58;
  --plate-edge: #5f5438;
}

@keyframes shield-glow {
  0%, 100% { opacity: 0.55; scale: 0.94; }
  50% { opacity: 1; scale: 1.04; }
}

@media (max-width: 479px) {
  .shield {
    --w: 148px;
  }
  .shield.is-sm {
    --w: 100px;
  }
  .shield__room {
    font-size: 40px;
  }
}

/* Paisagem baixa: a altura é o recurso escasso, então o escudo encolhe junto */
@media (max-height: 560px) and (orientation: landscape) {
  .shield {
    --w: 90px;
    --plate-h: 22px;
  }
  .shield.is-sm {
    --w: 68px;
    --plate-h: 19px;
  }
  .shield__plate {
    border-width: 2px;
  }
  .shield__plate span {
    font-size: 11px;
    -webkit-text-stroke-width: 3px;
  }
  .shield__tag {
    display: none;
  }
  .shield__room,
  .shield.is-sm .shield__room {
    font-size: 26px;
    -webkit-text-stroke-width: 4px;
  }
  .shield__check,
  .shield.is-sm .shield__check {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shield.is-claimable.is-lg::before {
    animation: none;
  }
}
</style>
