<template>
  <div class="w-full flex justify-center">
    <div
      :class="['relative', 'inline-block', 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]', `ribbon--${variant}`]"
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
        <span :class="['ribbon-text', 'select-none', 'title-text', `title-text-${variant}`, 'text-2xl']">
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
  variant?: 'yellow' | 'blue' | 'green' | 'red' | 'orange' | 'gray';
  width?: number;  // px
  height?: number; // px
  sideWidth?: number; // px
  sideHeight?: number; // px
  sideOffset?: number; // px (quanto "entra" pra fora)
  sideTop?: number; // px (posição Y das pontas)
};

const props = withDefaults(defineProps<Props>(), {
  text: "Pausar",
  variant: "yellow",
  width: 300,
  height: 60,
  sideWidth: 40,
  sideHeight: 45,
  sideOffset: 25,
  sideTop: 26,
});

const vars = computed(() => ({
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
  position: relative;
  overflow: hidden;
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
  border: 4px solid;
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
}

.right-fold {
  right: -5px;
  border-radius: 0px 10px 0px 10px;
  border-width: 15px 15px 0 0;
}

/* ========== VARIANTES DE CORES ========== */

/* Variante Amarela (Padrão) */
.ribbon--yellow .ribbon-main-size {
  background: linear-gradient(
    to bottom,
    #ffdf61 0%,
    #f4c542 50%,
    #ffdf61 100%
  );
  border-color: #d99c30;
}

.ribbon--yellow .ribbon-side {
  background: linear-gradient(
    to bottom,
    #ffdf61 0%,
    #f4c542 50%,
    #ffdf61 100%
  );
  border-color: #d99c30;
}

.ribbon--yellow .left-fold {
  border-color: transparent #d99c30 transparent transparent;
}

.ribbon--yellow .right-fold {
  border-color: #d99c30 transparent transparent transparent;
}

/* Variante Azul */
.ribbon--blue .ribbon-main-size {
  background: linear-gradient(
    to bottom,
    #7cb5ff 0%,
    #5a9fff 50%,
    #7cb5ff 100%
  );
  border-color: #1a4a8a;
}

.ribbon--blue .ribbon-side {
  background: linear-gradient(
    to bottom,
    #7cb5ff 0%,
    #5a9fff 50%,
    #7cb5ff 100%
  );
  border-color: #1a4a8a;
}

.ribbon--blue .left-fold {
  border-color: transparent #1a4a8a transparent transparent;
}

.ribbon--blue .right-fold {
  border-color: #1a4a8a transparent transparent transparent;
}

/* Variante Verde */
.ribbon--green .ribbon-main-size {
  background: linear-gradient(
    to bottom,
    #7ce85c 0%,
    #5cd63c 50%,
    #7ce85c 100%
  );
  border-color: #1a7a0a;
}

.ribbon--green .ribbon-side {
  background: linear-gradient(
    to bottom,
    #7ce85c 0%,
    #5cd63c 50%,
    #7ce85c 100%
  );
  border-color: #1a7a0a;
}

.ribbon--green .left-fold {
  border-color: transparent #1a7a0a transparent transparent;
}

.ribbon--green .right-fold {
  border-color: #1a7a0a transparent transparent transparent;
}

/* Variante Vermelha */
.ribbon--red .ribbon-main-size {
  background: linear-gradient(
    to bottom,
    #ff7a7a 0%,
    #ff4a4a 50%,
    #ff7a7a 100%
  );
  border-color: #b81a1a;
}

.ribbon--red .ribbon-side {
  background: linear-gradient(
    to bottom,
    #ff7a7a 0%,
    #ff4a4a 50%,
    #ff7a7a 100%
  );
  border-color: #b81a1a;
}

.ribbon--red .left-fold {
  border-color: transparent #b81a1a transparent transparent;
}

.ribbon--red .right-fold {
  border-color: #b81a1a transparent transparent transparent;
}

/* Variante Laranja */
.ribbon--orange .ribbon-main-size {
  background: linear-gradient(
    to bottom,
    #ffb366 0%,
    #ff9933 50%,
    #ffb366 100%
  );
  border-color: #cc6600;
}

.ribbon--orange .ribbon-side {
  background: linear-gradient(
    to bottom,
    #ffb366 0%,
    #ff9933 50%,
    #ffb366 100%
  );
  border-color: #cc6600;
}

.ribbon--orange .left-fold {
  border-color: transparent #cc6600 transparent transparent;
}

.ribbon--orange .right-fold {
  border-color: #cc6600 transparent transparent transparent;
}

/* Variante Cinza */
.ribbon--gray {
  background: linear-gradient(
    to bottom,
    #b8b8b8 0%,
    #8a8a8a 50%,
    #b8b8b8 100%
  );
  border-color: #4a4a4a;
}

.ribbon--gray .ribbon-side {
  background: linear-gradient(
    to bottom,
    #b8b8b8 0%,
    #8a8a8a 50%,
    #b8b8b8 100%
  );
  border-color: #4a4a4a;
}

.ribbon--gray .left-fold {
  border-color: transparent #4a4a4a transparent transparent;
}

.ribbon--gray .right-fold {
  border-color: #4a4a4a transparent transparent transparent;
}
</style>
