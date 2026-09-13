<script setup lang="ts">
// Faixa azul com o nome da seção (rebites nas pontas) e legenda opcional logo abaixo.
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <header class="stitle">
    <div class="stitle__band">
      <i aria-hidden="true"></i>
      <h3>{{ title }}</h3>
      <i aria-hidden="true"></i>
    </div>
    <p v-if="subtitle || $slots.default" class="stitle__subtitle">
      <slot>{{ subtitle }}</slot>
    </p>
  </header>
</template>

<style scoped>
.stitle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.stitle__band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 24px);
  padding: 6px 12px;
  border-radius: 12px;
  background: linear-gradient(#3f9bf0, #1f6ccc);
  border: 2px solid #11306a;
  box-shadow: 0 4px 0 #11306a, inset 0 2px 0 rgba(255, 255, 255, 0.35);
}
.stitle__band h3 {
  margin: 0;
  font: 24px/1.1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 4px #11306a;
  paint-order: stroke fill;
}
.stitle__band i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff, #9fb6d8);
  border: 2px solid #11306a;
}
.stitle__subtitle {
  margin: 0;
  font: 14px/1.2 'Lilita One', sans-serif;
  color: #74c3ff;
  text-align: center;
}
</style>
