<script setup lang="js">
// Número que conta de 0 até `to` depois de `delay` ms e dá um "pop" ao terminar.
// Fica dentro do conteúdo do PlayModal, que desmonta ao fechar, então a contagem roda a cada abertura.
const props = defineProps({
  to: { type: Number, default: 0 },
  duration: { type: Number, default: 700 },
  delay: { type: Number, default: 0 },
});

const value = ref(0);
const done = ref(false);
let timer = 0;
let frame = 0;

function finish() {
  value.value = props.to;
  done.value = true;
}

onMounted(() => {
  if (props.to <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();

  timer = window.setTimeout(() => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / props.duration);
      value.value = Math.round(props.to * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
  }, props.delay);
});

watch(() => props.to, (to) => {
  if (done.value) value.value = to;
});

onUnmounted(() => {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
});
</script>

<template>
  <span class="count-up" :class="{ 'is-done': done }">{{ value }}</span>
</template>

<style scoped>
.count-up {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}

.count-up.is-done {
  animation: count-up-pop 0.35s cubic-bezier(0.3, 1.8, 0.5, 1);
}

@keyframes count-up-pop {
  40% {
    transform: scale(1.3);
    filter: brightness(1.6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .count-up.is-done {
    animation: none;
  }
}
</style>
