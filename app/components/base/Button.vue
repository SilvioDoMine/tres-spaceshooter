<template>
  <button
    :class="[
      'glossy-button',
      `glossy-button--${variant}`,
      `glossy-button--${size}`,
      { 'is-pressed': isPressed, 'is-disabled': disabled }
    ]"
    class=""
    :disabled="disabled"
    @mousedown.prevent="handlePress"
    @touchstart.prevent="handlePress"
  >
    <span class="glossy-button__text">
      <slot></slot>
    </span>
  </button>
</template>

<script>
export default {
  name: 'GlossyButton',
  props: {
    variant: {
      type: String,
      default: 'blue',
      validator: (value) => ['blue', 'yellow', 'red', 'green'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  data() {
    return {
      isPressed: false
    }
  },
  methods: {
    handlePress(event) {
      if (this.isPressed || this.disabled) return

      this.isPressed = true

      // Aguarda a animação do botão (150ms: 100ms down + 50ms up)
      setTimeout(() => {
        this.isPressed = false
        // Aguarda mais 50ms para o botão voltar antes de emitir o click
        setTimeout(() => {
          this.$emit('click', event)
        }, 50)
      }, 100)
    }
  }
}
</script>

<style scoped>
.glossy-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  font-family: 'Lilita One', sans-serif;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  text-transform: none;
  letter-spacing: 0.5px;
  white-space: nowrap;
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  min-width: 0;
}

/* Remove estados persistentes */
.glossy-button:focus,
.glossy-button:focus-visible {
  outline: none;
}

/* Tamanhos - Alto relevo com transição gradual */
.glossy-button--sm {
  padding: 10px 24px;
  font-size: 18px;
  border-radius: 10px;
  border: 2px solid;
  transform: translateY(0);
  line-height: 1.2;
}

.glossy-button--md {
  padding: 14px 36px;
  font-size: 22px;
  border-radius: 12px;
  border: 3px solid;
  transform: translateY(0);
  line-height: 1.2;
}

.glossy-button--lg {
  padding: 22px 56px;
  font-size: 36px;
  border-radius: 15px;
  border: 3px solid;
  transform: translateY(0);
  line-height: 1.2;
}

/* Responsivo para telas muito pequenas */
@media (max-width: 400px) {
  .glossy-button {
    white-space: normal;
    text-align: center;
    max-width: 140px;
  }

  .glossy-button--sm {
    font-size: 16px;
    padding: 8px 18px;
  }

  .glossy-button--md {
    font-size: 18px;
    padding: 10px 28px;
  }

  .glossy-button--lg {
    font-size: 28px;
    padding: 18px 44px;
  }
}

/* Pressed states - Botão abaixa */
.glossy-button--sm.is-pressed {
  transform: translateY(4px);
  box-shadow: none !important;
}

.glossy-button--md.is-pressed {
  transform: translateY(5px);
  box-shadow: none !important;
}

.glossy-button--lg.is-pressed {
  transform: translateY(6px);
  box-shadow: none !important;
}

.glossy-button__text {
  display: inline-block;
  color: white;
  text-shadow:
    /* Contorno sutil */
    -1px -1px 0 rgba(0, 0, 0, 0.25),
    1px -1px 0 rgba(0, 0, 0, 0.25),
    -1px 1px 0 rgba(0, 0, 0, 0.25),
    1px 1px 0 rgba(0, 0, 0, 0.25),
    /* Sombra suave */
    0 2px 3px rgba(0, 0, 0, 0.2);
}

/* Variante Azul - Excluir Tudo */
.glossy-button--blue {
  background: linear-gradient(
    to bottom,
    #7cb5ff 0%,
    #5a9fff 50%,
    #3d88ff 100%
  );
  border-color: #1a4a8a;
}

.glossy-button--blue .glossy-button__text {
  text-shadow:
    /* Contorno azul escuro */
    -1px -1px 0 rgba(26, 74, 138, 0.6),
    1px -1px 0 rgba(26, 74, 138, 0.6),
    -1px 1px 0 rgba(26, 74, 138, 0.6),
    1px 1px 0 rgba(26, 74, 138, 0.6),
    0 -1px 0 rgba(26, 74, 138, 0.6),
    0 1px 0 rgba(26, 74, 138, 0.6),
    -1px 0 0 rgba(26, 74, 138, 0.6),
    1px 0 0 rgba(26, 74, 138, 0.6),
    /* Sombra suave */
    0 2px 3px rgba(0, 0, 0, 0.25);
}

/* Sombras graduais para tamanho SM - Azul */
.glossy-button--blue.glossy-button--sm {
  box-shadow:
    0 1px 0 0 #2a5fa0,
    0 2px 0 0 #245396,
    0 3px 0 0 #1e478c,
    0 4px 0 0 #1a4a8a;
}

/* Sombras graduais para tamanho MD - Azul */
.glossy-button--blue.glossy-button--md {
  box-shadow:
    0 1px 0 0 #2a5fa0,
    0 2px 0 0 #255598,
    0 3px 0 0 #204b90,
    0 4px 0 0 #1c4488,
    0 5px 0 0 #1a4a8a;
}

/* Sombras graduais para tamanho LG - Azul */
.glossy-button--blue.glossy-button--lg {
  box-shadow:
    0 1px 0 0 #2d63a4,
    0 2px 0 0 #285c9e,
    0 3px 0 0 #235598,
    0 4px 0 0 #1f4e92,
    0 5px 0 0 #1c478c,
    0 6px 0 0 #1a4a8a;
}

.glossy-button--blue::before {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  height: 45%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 50% 50% 100px 100px;
  pointer-events: none;
}

.glossy-button--blue.glossy-button--sm::before {
  top: 3px;
}

.glossy-button--blue.glossy-button--md::before {
  top: 4px;
}

.glossy-button--blue.glossy-button--lg::before {
  top: 5px;
}

/* Variante Amarela - Resgatar Tudo */
.glossy-button--yellow {
  background: linear-gradient(
    to bottom,
    #ffd97a 0%,
    #ffca4a 50%,
    #ffb82a 100%
  );
  border-color: #a86b00;
}

.glossy-button--yellow .glossy-button__text {
  text-shadow:
    /* Contorno marrom escuro */
    -1px -1px 0 rgba(168, 107, 0, 0.6),
    1px -1px 0 rgba(168, 107, 0, 0.6),
    -1px 1px 0 rgba(168, 107, 0, 0.6),
    1px 1px 0 rgba(168, 107, 0, 0.6),
    0 -1px 0 rgba(168, 107, 0, 0.6),
    0 1px 0 rgba(168, 107, 0, 0.6),
    -1px 0 0 rgba(168, 107, 0, 0.6),
    1px 0 0 rgba(168, 107, 0, 0.6),
    /* Sombra suave */
    0 2px 3px rgba(0, 0, 0, 0.25);
}

/* Sombras graduais para tamanho SM - Amarelo */
.glossy-button--yellow.glossy-button--sm {
  box-shadow:
    0 1px 0 0 #c88400,
    0 2px 0 0 #b87900,
    0 3px 0 0 #ad7000,
    0 4px 0 0 #a86b00;
}

/* Sombras graduais para tamanho MD - Amarelo */
.glossy-button--yellow.glossy-button--md {
  box-shadow:
    0 1px 0 0 #cc8800,
    0 2px 0 0 #be7e00,
    0 3px 0 0 #b37500,
    0 4px 0 0 #ad7000,
    0 5px 0 0 #a86b00;
}

/* Sombras graduais para tamanho LG - Amarelo */
.glossy-button--yellow.glossy-button--lg {
  box-shadow:
    0 1px 0 0 #d08c00,
    0 2px 0 0 #c58300,
    0 3px 0 0 #ba7a00,
    0 4px 0 0 #b07200,
    0 5px 0 0 #ad6e00,
    0 6px 0 0 #a86b00;
}

.glossy-button--yellow::before {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  height: 45%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 50% 50% 100px 100px;
  pointer-events: none;
}

.glossy-button--yellow.glossy-button--sm::before {
  top: 3px;
}

.glossy-button--yellow.glossy-button--md::before {
  top: 4px;
}

.glossy-button--yellow.glossy-button--lg::before {
  top: 5px;
}

/* Variante Vermelha - Cancelar */
.glossy-button--red {
  background: linear-gradient(
    to bottom,
    #ff7a7a 0%,
    #ff4a4a 50%,
    #ff2a2a 100%
  );
  border-color: #b81a1a;
}

.glossy-button--red .glossy-button__text {
  text-shadow:
    /* Contorno vermelho escuro */
    -1px -1px 0 rgba(184, 26, 26, 0.6),
    1px -1px 0 rgba(184, 26, 26, 0.6),
    -1px 1px 0 rgba(184, 26, 26, 0.6),
    1px 1px 0 rgba(184, 26, 26, 0.6),
    0 -1px 0 rgba(184, 26, 26, 0.6),
    0 1px 0 rgba(184, 26, 26, 0.6),
    -1px 0 0 rgba(184, 26, 26, 0.6),
    1px 0 0 rgba(184, 26, 26, 0.6),
    /* Sombra suave */
    0 2px 3px rgba(0, 0, 0, 0.25);
}

/* Sombras graduais para tamanho SM - Vermelho */
.glossy-button--red.glossy-button--sm {
  box-shadow:
    0 1px 0 0 #d82020,
    0 2px 0 0 #c81e1e,
    0 3px 0 0 #bd1c1c,
    0 4px 0 0 #b81a1a;
}

/* Sombras graduais para tamanho MD - Vermelho */
.glossy-button--red.glossy-button--md {
  box-shadow:
    0 1px 0 0 #dc2424,
    0 2px 0 0 #ce2020,
    0 3px 0 0 #c31e1e,
    0 4px 0 0 #bd1c1c,
    0 5px 0 0 #b81a1a;
}

/* Sombras graduais para tamanho LG - Vermelho */
.glossy-button--red.glossy-button--lg {
  box-shadow:
    0 1px 0 0 #e02828,
    0 2px 0 0 #d52424,
    0 3px 0 0 #ca2020,
    0 4px 0 0 #c01e1e,
    0 5px 0 0 #bc1c1c,
    0 6px 0 0 #b81a1a;
}

.glossy-button--red::before {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  height: 45%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 50% 50% 100px 100px;
  pointer-events: none;
}

.glossy-button--red.glossy-button--sm::before {
  top: 3px;
}

.glossy-button--red.glossy-button--md::before {
  top: 4px;
}

.glossy-button--red.glossy-button--lg::before {
  top: 5px;
}

/* Variante Verde - Confirmar/Ação Positiva */
.glossy-button--green {
  background: linear-gradient(
    to bottom,
    #7ce85c 0%,
    #5cd63c 50%,
    #3cc41c 100%
  );
  border-color: #1a7a0a;
}

.glossy-button--green .glossy-button__text {
  text-shadow:
    /* Contorno verde escuro */
    -1px -1px 0 rgba(26, 122, 10, 0.6),
    1px -1px 0 rgba(26, 122, 10, 0.6),
    -1px 1px 0 rgba(26, 122, 10, 0.6),
    1px 1px 0 rgba(26, 122, 10, 0.6),
    0 -1px 0 rgba(26, 122, 10, 0.6),
    0 1px 0 rgba(26, 122, 10, 0.6),
    -1px 0 0 rgba(26, 122, 10, 0.6),
    1px 0 0 rgba(26, 122, 10, 0.6),
    /* Sombra suave */
    0 2px 3px rgba(0, 0, 0, 0.25);
}

/* Sombras graduais para tamanho SM - Verde */
.glossy-button--green.glossy-button--sm {
  box-shadow:
    0 1px 0 0 #1a8e0e,
    0 2px 0 0 #1a840c,
    0 3px 0 0 #1a7f0b,
    0 4px 0 0 #1a7a0a;
}

/* Sombras graduais para tamanho MD - Verde */
.glossy-button--green.glossy-button--md {
  box-shadow:
    0 1px 0 0 #1a9210,
    0 2px 0 0 #1a8a0e,
    0 3px 0 0 #1a850d,
    0 4px 0 0 #1a7f0b,
    0 5px 0 0 #1a7a0a;
}

/* Sombras graduais para tamanho LG - Verde */
.glossy-button--green.glossy-button--lg {
  box-shadow:
    0 1px 0 0 #1a9612,
    0 2px 0 0 #1a9010,
    0 3px 0 0 #1a8a0e,
    0 4px 0 0 #1a840c,
    0 5px 0 0 #1a7f0b,
    0 6px 0 0 #1a7a0a;
}

.glossy-button--green::before {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  height: 45%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 50% 50% 100px 100px;
  pointer-events: none;
}

.glossy-button--green.glossy-button--sm::before {
  top: 3px;
}

.glossy-button--green.glossy-button--md::before {
  top: 4px;
}

.glossy-button--green.glossy-button--lg::before {
  top: 5px;
}

/* Estado Disabled */
.glossy-button.is-disabled,
.glossy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.3);
}

.glossy-button.is-disabled::before,
.glossy-button:disabled::before {
  opacity: 0.5;
}
</style>