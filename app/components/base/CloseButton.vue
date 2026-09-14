<script setup lang="ts">
// Botão redondo de fechar (X) no estilo da faixa de título: vermelho brilhante, contorno escuro e sombra dura.
// Usado no canto dos modais do lobby e dos diálogos da Loja. O @click do pai cai direto no <button>.
withDefaults(defineProps<{ label?: string }>(), { label: 'Fechar' });
</script>

<template>
  <button type="button" class="xbtn" :aria-label="label" data-ui-sound="off">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  </button>
</template>

<style scoped>
.xbtn {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  border: 3px solid #6e1414;
  background: linear-gradient(180deg, #ff9585 0%, #f0564a 50%, #d0372f 100%);
  box-shadow:
    0 4px 0 #6e1414,
    0 6px 8px rgba(0, 0, 0, 0.35),
    inset 0 2px 0 rgba(255, 255, 255, 0.55),
    inset 0 -3px 0 rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: translate 0.1s ease, box-shadow 0.1s ease, scale 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

/* Brilho oval no topo */
.xbtn::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 8px;
  width: 11px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  rotate: -30deg;
  pointer-events: none;
}

.xbtn svg {
  width: 20px;
  fill: none;
  stroke: #fff;
  stroke-width: 3.6;
  stroke-linecap: round;
  filter: drop-shadow(0 1.5px 0 #6e1414);
}

.xbtn:hover {
  scale: 1.06;
}

.xbtn:active {
  translate: 0 3px;
  box-shadow:
    0 1px 0 #6e1414,
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.55),
    inset 0 -3px 0 rgba(0, 0, 0, 0.15);
}

.xbtn:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}
</style>
