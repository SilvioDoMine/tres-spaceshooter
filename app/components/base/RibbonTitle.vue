<script setup lang="ts">
// Faixa de título (ribbon) no estilo Archero 2: faixa na frente com brilho, pontas recortadas em V atrás
// (mais baixas) e dobras escuras ligando as duas. A cor vem de `variant`; o tamanho acompanha a tela.
// Ao montar (e sempre que `open` volta a ser true) a faixa estica do centro e as pontas saem de trás.
type Variant = 'blue' | 'yellow' | 'green' | 'red' | 'orange' | 'purple' | 'gray';

const props = withDefaults(
  defineProps<{
    text: string;
    variant?: Variant;
    /** Losangos decorativos dos lados do texto */
    gems?: boolean;
    /** Controla a animação de abertura (para quem fica sempre montado e só aparece/some) */
    open?: boolean;
  }>(),
  { variant: 'blue', gems: true, open: true },
);

// Começa fechada e abre no frame seguinte, senão a transição não roda na montagem
const mounted = ref(false);
onMounted(() => requestAnimationFrame(() => (mounted.value = true)));

const isOpen = computed(() => mounted.value && props.open);
</script>

<template>
  <div class="ribbon-wrap">
    <header class="ribbon" :class="[`is-${variant}`, { 'is-open': isOpen }]">
      <span class="ribbon__tail is-left" aria-hidden="true"><i></i></span>
      <span class="ribbon__tail is-right" aria-hidden="true"><i></i></span>
      <span class="ribbon__fold is-left" aria-hidden="true"></span>
      <span class="ribbon__fold is-right" aria-hidden="true"></span>
      <span class="ribbon__band">
        <i v-if="gems" class="ribbon__gem" aria-hidden="true"></i>
        <h2>{{ text }}</h2>
        <i v-if="gems" class="ribbon__gem" aria-hidden="true"></i>
      </span>
    </header>
  </div>
</template>

<style scoped>
.ribbon-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
  flex-shrink: 0;
}

/* A faixa fica na frente; as pontas ficam atrás, `--drop` mais baixas, entrando `--inset` por baixo dela.
   A dobra é o triângulo escuro entre o canto de baixo da faixa e o topo visível da ponta. */
.ribbon {
  --h: 52px;
  --drop: 14px;
  --inset: 16px;
  --tail: 50px;

  /* Paleta (azul por padrão) */
  --band-1: #74c8ff;
  --band-2: #45a2f5;
  --band-3: #2f86e6;
  --band-4: #2a78d8;
  --tail-1: #3f95ea;
  --tail-2: #2a74d0;
  --tail-3: #1f60b8;
  --outline: #134a91;
  --fold: #0d2f63;
  --gem-2: #ffe68a;
  --gem-3: #f5b82a;
  --gem-border: #7a4a00;

  position: relative;
  max-width: calc(100% - 2 * (var(--tail) - var(--inset)) - 8px);
  margin-bottom: var(--drop);
  filter: drop-shadow(0 6px 5px rgba(0, 0, 0, 0.4));
}

.ribbon__band {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: var(--h);
  padding: 0 24px;
  border-radius: 6px;
  border: 3px solid var(--outline);
  background: linear-gradient(180deg, var(--band-1) 0%, var(--band-2) 48%, var(--band-3) 52%, var(--band-4) 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.55),
    inset 0 -5px 0 rgba(0, 0, 0, 0.14);
  scale: 0.2 1;
  opacity: 0;
  transition: scale 0.4s cubic-bezier(0.3, 1.5, 0.6, 1), opacity 0.15s ease;
}
/* Brilho de plástico na metade de cima */
.ribbon__band::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 10px;
  right: 10px;
  height: 40%;
  border-radius: 4px 4px 50% 50% / 4px 4px 100% 100%;
  background: linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.04));
  pointer-events: none;
}
.ribbon__band h2 {
  position: relative;
  z-index: 1;
  margin: 0;
  font: 24px/1 'Lilita One', sans-serif;
  letter-spacing: 0.5px;
  color: #fff;
  white-space: nowrap;
  -webkit-text-stroke: 5px var(--outline);
  paint-order: stroke fill;
  text-shadow: 0 3px 0 var(--outline);
  user-select: none;
}
.ribbon__gem {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  rotate: 45deg;
  border-radius: 3px;
  background: linear-gradient(135deg, #fff 0%, var(--gem-2) 45%, var(--gem-3) 100%);
  border: 2px solid var(--gem-border);
  box-shadow: 0 2px 0 var(--outline);
}

/* Pontas: o recorte em V é clip-path (que cortaria uma border). O contorno é a própria ponta na cor
   escura, e o miolo é uma camada interna 3px menor com o mesmo recorte. */
.ribbon__tail {
  position: absolute;
  z-index: 0;
  top: var(--drop);
  width: var(--tail);
  height: var(--h);
  background: var(--outline);
  opacity: 0;
  transition: translate 0.35s cubic-bezier(0.3, 1.4, 0.6, 1) 0.18s, opacity 0.15s ease 0.18s;
}
.ribbon__tail i {
  position: absolute;
  inset: 3px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0 3px, transparent 3px),
    linear-gradient(180deg, var(--tail-1) 0%, var(--tail-2) 55%, var(--tail-3) 100%);
}
.ribbon__tail.is-left {
  left: calc(var(--inset) - var(--tail));
  translate: calc(var(--tail) - var(--inset)) 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 30% 50%);
}
.ribbon__tail.is-left i {
  right: 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, calc(30% + 2px) 50%);
}
.ribbon__tail.is-right {
  right: calc(var(--inset) - var(--tail));
  translate: calc(var(--inset) - var(--tail)) 0;
  clip-path: polygon(0 0, 100% 0, 70% 50%, 100% 100%, 0 100%);
}
.ribbon__tail.is-right i {
  left: 0;
  clip-path: polygon(0 0, 100% 0, calc(70% - 2px) 50%, 100% 100%, 0 100%);
}

/* Dobras: o verso da faixa, bem escuro */
.ribbon__fold {
  position: absolute;
  z-index: 1;
  top: calc(var(--h) - 3px);
  width: var(--inset);
  height: calc(var(--drop) + 3px);
  background: linear-gradient(180deg, var(--fold), var(--outline));
  opacity: 0;
  transition: opacity 0.15s ease 0.22s;
}
.ribbon__fold.is-left {
  left: 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}
.ribbon__fold.is-right {
  right: 0;
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

/* Abertura: a faixa estica do centro e as pontas saem de trás dela */
.ribbon.is-open .ribbon__band {
  scale: 1;
  opacity: 1;
}
.ribbon.is-open .ribbon__tail {
  translate: 0 0;
  opacity: 1;
}
.ribbon.is-open .ribbon__fold {
  opacity: 1;
}

/* ==================== Cores ==================== */
.ribbon.is-yellow {
  --band-1: #ffe98f;
  --band-2: #ffd24d;
  --band-3: #f6b624;
  --band-4: #eba61a;
  --tail-1: #f4b82f;
  --tail-2: #dd9b18;
  --tail-3: #c4800f;
  --outline: #8a5300;
  --fold: #5e3800;
  --gem-2: #bfe6ff;
  --gem-3: #4fa8f0;
  --gem-border: #134a91;
}
.ribbon.is-green {
  --band-1: #a2f282;
  --band-2: #72dc52;
  --band-3: #50c236;
  --band-4: #44b02c;
  --tail-1: #59c93e;
  --tail-2: #41aa2b;
  --tail-3: #2f8f1f;
  --outline: #1f5f19;
  --fold: #143f10;
}
.ribbon.is-red {
  --band-1: #ffa192;
  --band-2: #ff6e5e;
  --band-3: #e9493d;
  --band-4: #d93b31;
  --tail-1: #ed5b4c;
  --tail-2: #d03c32;
  --tail-3: #b02b25;
  --outline: #6e1414;
  --fold: #4a0c0c;
}
.ribbon.is-orange {
  --band-1: #ffc882;
  --band-2: #ffa640;
  --band-3: #f58b1f;
  --band-4: #e67d16;
  --tail-1: #f59b36;
  --tail-2: #dd801a;
  --tail-3: #c46a10;
  --outline: #7a4006;
  --fold: #522b04;
  --gem-2: #fff3c4;
  --gem-3: #ffd34d;
}
.ribbon.is-purple {
  --band-1: #e4adff;
  --band-2: #c97fff;
  --band-3: #a854eb;
  --band-4: #9848dd;
  --tail-1: #b666f1;
  --tail-2: #9b48d9;
  --tail-3: #8034be;
  --outline: #4a1a7a;
  --fold: #310f52;
}
.ribbon.is-gray {
  --band-1: #eceff4;
  --band-2: #cbd1da;
  --band-3: #aab2be;
  --band-4: #9aa2b0;
  --tail-1: #b3bbc7;
  --tail-2: #969eac;
  --tail-3: #7d8594;
  --outline: #3c4352;
  --fold: #262b36;
}

/* ==================== Tamanhos ==================== */
@media (max-width: 479px) {
  .ribbon {
    --h: 46px;
    --drop: 11px;
    --inset: 13px;
    --tail: 40px;
  }
  .ribbon__band {
    padding: 0 16px;
  }
  .ribbon__band h2 {
    font-size: 20px;
    -webkit-text-stroke-width: 4px;
  }
  .ribbon__gem {
    display: none;
  }
}
@media (min-width: 1024px) {
  .ribbon {
    --h: 58px;
    --drop: 16px;
    --inset: 18px;
    --tail: 58px;
  }
  .ribbon__band {
    padding: 0 30px;
  }
  .ribbon__band h2 {
    font-size: 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ribbon__band,
  .ribbon__tail,
  .ribbon__fold {
    transition: none;
  }
}
</style>
