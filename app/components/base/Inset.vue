<script setup lang="ts">
// Fundinho de conteúdo dos modais do lobby, no mesmo acabamento dos painéis de madeira da Loja.
//   light  -> placa clara em relevo (contorno de madeira e sombra dura curta)
//   sunken -> área rebaixada dentro de uma placa (sombra interna no topo)
//   dark   -> vidro escuro rebaixado, para grades de ícones e textos brancos
// Só pinta o fundo: layout (flex, grid, padding) vem das classes de quem usa.
withDefaults(defineProps<{ variant?: 'light' | 'sunken' | 'dark' }>(), { variant: 'light' });
</script>

<template>
  <div class="inset" :class="`is-${variant}`">
    <slot />
  </div>
</template>

<style scoped>
.inset {
  position: relative;
  border-radius: 14px;
}

.inset.is-light {
  background: linear-gradient(180deg, #fffaf0 0%, #fbeccf 100%);
  border: 2px solid #d9a766;
  box-shadow:
    0 3px 0 #c48c4a,
    inset 0 2px 0 rgba(255, 255, 255, 0.9);
}

.inset.is-sunken {
  border-radius: 11px;
  background: linear-gradient(180deg, #f1d9ae 0%, #f6e5c6 100%);
  box-shadow:
    inset 0 3px 4px rgba(107, 61, 18, 0.22),
    inset 0 0 0 1px rgba(138, 83, 31, 0.18);
}

.inset.is-dark {
  background: linear-gradient(180deg, #1b3257 0%, #203d69 100%);
  border: 2px solid #0e1f3b;
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 4px 6px rgba(0, 0, 0, 0.35);
  color: #fff;
}
</style>
