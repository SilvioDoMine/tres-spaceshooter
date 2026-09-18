<script setup lang="ts">
// Atalho quadrado do HUD do lobby (Config, Grátis, Missões) no estilo das cartas de habilidade:
// face colorida com contorno escuro, sombra dura e brilho no canto, e o nome com contorno por cima da base.
// O slot `badge` recebe a notificação ("!") presa no canto do botão. Com `to` vira um link (NuxtLink).
const props = withDefaults(
  defineProps<{
    label?: string;
    variant?: 'blue' | 'orange' | 'green' | 'purple' | 'gray';
    to?: string;
  }>(),
  { label: '', variant: 'blue', to: undefined },
);

const NuxtLink = resolveComponent('NuxtLink');
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'button'"
    :to="props.to"
    :type="props.to ? undefined : 'button'"
    class="hudbtn"
    :class="`is-${variant}`"
    :aria-label="label || undefined"
    data-ui-sound="tap"
  >
    <span class="hudbtn__face">
      <span class="hudbtn__shine" aria-hidden="true"></span>
      <span class="hudbtn__icon"><slot /></span>
    </span>
    <span v-if="label" class="hudbtn__label">{{ label }}</span>
    <slot name="badge" />
  </component>
</template>

<style scoped>
.hudbtn {
  --from: #5fb8ff;
  --to: #2a74db;
  --outline: #173f7d;

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 62px;
  padding: 0 0 8px;
  border: 0;
  background: none;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.hudbtn__face {
  position: relative;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 15px;
  border: 3px solid var(--outline);
  background: linear-gradient(180deg, var(--from), var(--to) 85%);
  box-shadow:
    0 4px 0 var(--outline),
    0 8px 12px rgba(0, 0, 0, 0.35),
    inset 0 2px 0 rgba(255, 255, 255, 0.5),
    inset 0 -4px 0 rgba(0, 0, 0, 0.12);
  transition: translate 0.1s ease, box-shadow 0.1s ease;
}

.hudbtn__shine {
  position: absolute;
  top: 4px;
  left: 6px;
  width: 13px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  rotate: -30deg;
  pointer-events: none;
}

.hudbtn__icon {
  display: grid;
  place-items: center;
  color: #fff;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.3));
}
.hudbtn__icon :deep(svg) {
  width: 32px;
  height: 32px;
}

/* Nome por cima da base da face, com contorno na cor do botão */
.hudbtn__label {
  position: absolute;
  bottom: 0;
  left: 50%;
  translate: -50% 0;
  font: 13px/1 'Lilita One', sans-serif;
  letter-spacing: 0.3px;
  color: #fff;
  white-space: nowrap;
  -webkit-text-stroke: 4px var(--outline);
  paint-order: stroke fill;
  pointer-events: none;
}

.hudbtn:active .hudbtn__face {
  translate: 0 3px;
  box-shadow:
    0 1px 0 var(--outline),
    0 3px 6px rgba(0, 0, 0, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.5),
    inset 0 -4px 0 rgba(0, 0, 0, 0.12);
}

.hudbtn.is-orange {
  --from: #ffd257;
  --to: #f08a14;
  --outline: #7a4006;
}
.hudbtn.is-green {
  --from: #7fe46a;
  --to: #34a526;
  --outline: #1f5f19;
}
.hudbtn.is-purple {
  --from: #d07cff;
  --to: #8a32cf;
  --outline: #3f1470;
}
.hudbtn.is-gray {
  --from: #c9d0db;
  --to: #8e97a6;
  --outline: #3c4352;
}
</style>
