<script setup lang="ts">
// Mesmo layout de app/spa-loading-template.html, que aparece antes do JS subir
const props = defineProps<{ progress: number }>();
const percent = computed(() => `${Math.round(Math.min(Math.max(props.progress, 0), 1) * 100)}%`);
</script>

<template>
  <div class="app-loading" role="progressbar" aria-label="Carregando" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(props.progress * 100)">
    <img class="app-loading__logo" src="/images/cdpgames-white.png" alt="CDP Games">
    <div class="app-loading__track">
      <div class="app-loading__fill" :style="{ width: percent }" />
    </div>
  </div>
</template>

<style scoped>
.app-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: #000814;
}

.app-loading__logo {
  width: min(70vw, 420px);
  height: auto;
}

.app-loading__track {
  width: min(60vw, 320px);
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.app-loading__fill {
  height: 100%;
  border-radius: inherit;
  background: #fff;
  transition: width 0.2s ease-out;
}
</style>
