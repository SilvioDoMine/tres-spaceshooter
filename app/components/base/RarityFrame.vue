<script setup lang="ts">
// Moldura de raridade no estilo Archero 2: contorno escuro fino, anel claro na cor da raridade e um
// miolo rebaixado (sombra interna no topo, faixa escura embaixo e brilho no canto). Tudo em unidades
// do próprio tamanho (cqw), então funciona igual de 40px a 140px.
// Usada pelo card de equipamento e pelos ícones de recompensa (ouro, gemas, exp).
//
// Atenção: `cqw` no próprio elemento que é o container mede o container de FORA (a tela). Por isso a raiz
// só define o tamanho e o anel/sombras ficam numa camada interna.
export type FrameRarity = 'gray' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'empty';

withDefaults(defineProps<{ rarity?: FrameRarity }>(), { rarity: 'gray' });
</script>

<template>
  <div class="rframe" :class="`is-${rarity}`">
    <span class="rframe__ring" aria-hidden="true"></span>
    <span class="rframe__panel" aria-hidden="true"></span>
    <span class="rframe__gloss" aria-hidden="true"></span>
    <div class="rframe__content"><slot /></div>
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.rframe {
  /* Anel (claro) */
  --ring-light: #f2f4f8;
  --ring-dark: #c3c9d3;
  /* Miolo */
  --panel-top: #b7bfca;
  --panel-mid: #9ba3b0;
  --panel-bottom: #858d9a;
  /* Contorno e sombra de apoio */
  --outline: #454c5b;
  --glow: transparent;

  position: relative;
  width: 100%;
  aspect-ratio: 1;
  container-type: inline-size;
  border-radius: 19%;
}

/* Anel claro + contorno escuro + base (sombra dura curta embaixo, sem cara de botão) */
.rframe__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, var(--ring-light), var(--ring-dark));
  box-shadow:
    0 0 0 max(1.5px, 2cqw) var(--outline),
    0 max(2px, 3.5cqw) 0 max(1.5px, 2cqw) var(--outline),
    0 0 14cqw var(--glow),
    inset 0 max(1px, 2.5cqw) 0 rgba(255, 255, 255, 0.7);
}

/* Miolo rebaixado dentro do anel */
.rframe__panel {
  position: absolute;
  inset: 6.5cqw;
  border-radius: 14%;
  background: linear-gradient(180deg, var(--panel-top) 0%, var(--panel-mid) 58%, var(--panel-bottom) 100%);
  box-shadow:
    inset 0 5cqw 5cqw -2.5cqw rgba(0, 0, 0, 0.32),
    inset 0 -4cqw 0 rgba(0, 0, 0, 0.14),
    inset 0 0 0 max(1px, 1cqw) rgba(0, 0, 0, 0.22);
}

/* Reflexo no canto de cima (como o brilho dos cards do Archero) */
.rframe__gloss {
  position: absolute;
  top: 11cqw;
  left: 11cqw;
  width: 16cqw;
  height: 7cqw;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  rotate: -35deg;
  pointer-events: none;
}

.rframe__content {
  position: absolute;
  inset: 13%;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 2cqw 0 rgba(0, 0, 0, 0.22));
}

.rframe.is-green {
  --ring-light: #c9ffb8;
  --ring-dark: #74e25e;
  --panel-top: #66d850;
  --panel-mid: #45b934;
  --panel-bottom: #319a24;
  --outline: #1f5f19;
}
.rframe.is-blue {
  --ring-light: #cbe9ff;
  --ring-dark: #72bbff;
  --panel-top: #58a4f5;
  --panel-mid: #3d84e0;
  --panel-bottom: #2d69c2;
  --outline: #173f7d;
}
.rframe.is-purple {
  --ring-light: #f5d4ff;
  --ring-dark: #d487ff;
  --panel-top: #c066f3;
  --panel-mid: #a045e0;
  --panel-bottom: #8130be;
  --outline: #4a1a7a;
}
.rframe.is-orange {
  --ring-light: #fff0c0;
  --ring-dark: #ffc54f;
  --panel-top: #ffb536;
  --panel-mid: #f3921c;
  --panel-bottom: #d4740f;
  --outline: #7a4006;
  --glow: rgba(255, 196, 80, 0.55);
}
.rframe.is-red {
  --ring-light: #ffd0c4;
  --ring-dark: #ff8573;
  --panel-top: #f3604d;
  --panel-mid: #dc4034;
  --panel-bottom: #b82b25;
  --outline: #6e1414;
  --glow: rgba(255, 110, 90, 0.55);
}

/* Slot vazio: só o buraco tracejado */
.rframe.is-empty {
  background: rgba(10, 18, 40, 0.45);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.2);
  outline: 2px dashed rgba(255, 255, 255, 0.28);
  outline-offset: -2px;
}
.rframe.is-empty .rframe__ring,
.rframe.is-empty .rframe__panel,
.rframe.is-empty .rframe__gloss {
  display: none;
}
.rframe.is-empty .rframe__content {
  filter: none;
}
</style>
