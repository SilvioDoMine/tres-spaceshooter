<template>
  <div class="w-full flex justify-center">
    <div
      class="relative inline-block drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
      :style="vars"
      role="button"
      aria-label="Ribbon"
    >
      <!-- Left side -->
      <div class="ribbon-side left-side"></div>

      <!-- Main -->
      <div
        class="relative z-2 flex items-center justify-center border-4 rounded-sm"
        :class="mainSizeClass"
      >
        <span class="ribbon-text select-none title-text title-text-yellow text-2xl">
          {{ text }}
        </span>

        <!-- Folds -->
        <div class="fold left-fold"></div>
        <div class="fold right-fold"></div>
      </div>

      <!-- Right side -->
      <div class="ribbon-side right-side"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type Props = {
  text?: string;
  width?: number;  // px
  height?: number; // px
  sideWidth?: number; // px
  sideHeight?: number; // px
  sideOffset?: number; // px (quanto “entra” pra fora)
  sideTop?: number; // px (posição Y das pontas)
  primaryYellow?: string;
  darkYellow?: string;
  borderOrange?: string;
};

const props = withDefaults(defineProps<Props>(), {
  text: "Pausar",
  width: 300,
  height: 60,
  sideWidth: 40,
  sideHeight: 45,
  sideOffset: 25,
  sideTop: 26,
  primaryYellow: "#ffdf61",
  darkYellow: "#f4c542",
  borderOrange: "#d99c30",
});

const vars = computed(() => ({
  "--primary-yellow": props.primaryYellow,
  "--dark-yellow": props.darkYellow,
  "--border-orange": props.borderOrange,

  "--main-w": `${props.width}px`,
  "--main-h": `${props.height}px`,

  "--side-w": `${props.sideWidth}px`,
  "--side-h": `${props.sideHeight}px`,
  "--side-offset": `${props.sideOffset}px`,
  "--side-top": `${props.sideTop}px`,
}));

// Tailwind não aceita width/height dinâmico sem arbitrary vars.
// Aqui usamos var() + um class fixo.
const mainSizeClass = computed(() => "ribbon-main-size");
</script>

<style scoped>
/* Corpo central: tamanho via CSS variables */
.ribbon-main-size {
  width: var(--main-w);
  height: var(--main-h);
  border-color: var(--border-orange);
  position: relative;
  overflow: hidden;
  /* Gradiente amarelo vibrante estilo Duolingo */
  background: linear-gradient(
    to bottom,
    var(--primary-yellow) 0%,
    var(--dark-yellow) 50%,
    var(--primary-yellow) 100%
  );
}

/* Efeito de brilho glossy no topo (luz superior) */
.ribbon-main-size::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 10%;
  right: 10%;
  height: 40%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 50% 50% 100px 100px;
  pointer-events: none;
  z-index: 1;
}

/* Efeito de profundidade diagonal (luz lateral) */
.ribbon-main-size::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    transparent 40%,
    transparent 60%,
    rgba(0, 0, 0, 0.1) 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* Pontas */
.ribbon-side {
  position: absolute;
  top: var(--side-top);
  width: var(--side-w);
  height: var(--side-h);
  background: linear-gradient(
    to bottom,
    var(--primary-yellow) 0%,
    var(--dark-yellow) 50%,
    var(--primary-yellow) 100%
  );
  border: 4px solid var(--border-orange);
  z-index: 1;
  overflow: hidden;
}

/* Brilho nas pontas laterais */
.ribbon-side::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 5%;
  right: 5%;
  height: 35%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 50%;
  pointer-events: none;
}

.left-side {
  left: calc(var(--side-offset) * -1);
  border-radius: 4px 0 0 4px;
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 25% 50%);
}

.right-side {
  right: calc(var(--side-offset) * -1);
  border-radius: 0 4px 4px 0;
  clip-path: polygon(0% 0%, 100% 0%, 75% 50%, 100% 100%, 0% 100%);
}

/* Dobras atrás (triângulos) */
.fold {
  position: absolute;
  top: calc(var(--main-h) - 7px);
  width: 0;
  height: 0;
  border-style: solid;
  z-index: 0;
}

.left-fold {
  left: -5px;
  border-width: 0 15px 15px 0;
  border-radius: 10px 0px 10px 0px;
  border-color: transparent var(--border-orange) transparent transparent;
}

.right-fold {
  right: -5px;
  border-radius: 0px 10px 0px 10px;
  border-width: 15px 15px 0 0;
  border-color: var(--border-orange) transparent transparent transparent;
}
</style>
