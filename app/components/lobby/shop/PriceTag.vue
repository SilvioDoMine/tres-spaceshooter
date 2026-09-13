<script setup lang="ts">
// Ícone da moeda + valor. Fica vermelho quando o saldo não alcança.
const props = withDefaults(
  defineProps<{ currency: 'gems' | 'gold' | 'free'; amount?: number; short?: boolean; insufficient?: boolean; size?: number }>(),
  { amount: 0, short: false, insufficient: false, size: 26 },
);

const text = computed(() => {
  if (props.currency === 'free') return 'Grátis';
  if (props.short && props.amount >= 1000) return `${Number((props.amount / 1000).toFixed(1))}K`;
  return props.amount.toLocaleString('pt-BR');
});
</script>

<template>
  <span class="price" :class="{ 'is-short': insufficient }">
    <SvgGemIcon v-if="currency === 'gems'" :size="size" :sparkle="false" />
    <SvgCoinIcon v-else-if="currency === 'gold'" :size="size" />
    <span>{{ text }}</span>
  </span>
</template>

<style scoped>
.price {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font: 22px/1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 4px #10183a;
  paint-order: stroke fill;
  white-space: nowrap;
}
.price.is-short span {
  color: #ff6b6b;
}
</style>
