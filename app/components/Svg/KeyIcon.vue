<script setup lang="ts">
// Chave dos baús; a cor segue o tipo (prata azulada, obsidiana roxa).
const props = withDefaults(defineProps<{ size?: number; type?: 'silver' | 'obsidian' }>(), { size: 24, type: 'silver' });

const palette = computed(() =>
  props.type === 'obsidian'
    ? { light: '#f0b8ff', mid: '#c25cf0', dark: '#5a1a82' }
    : { light: '#e8f6ff', mid: '#8fc4ef', dark: '#24527e' },
);
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true">
    <g stroke="#10183a" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M14.5 15.5 26 27l-2.5 2.5-2-2-2 2-2-2 1.8-1.8-5.6-5.6" :fill="palette.mid" />
      <circle cx="10.5" cy="11.5" r="7.5" :fill="palette.mid" />
    </g>
    <circle cx="10.5" cy="11.5" r="3" fill="#10183a" />
    <path d="M6 8.5a5.5 5.5 0 0 1 5-3" :stroke="palette.light" stroke-width="2" fill="none" stroke-linecap="round" />
    <path d="M17 20l6 6" :stroke="palette.dark" stroke-width="1.5" opacity=".6" />
  </svg>
</template>
