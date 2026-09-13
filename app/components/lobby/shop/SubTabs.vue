<script setup lang="ts">
// Sub-abas da Loja, flutuando acima da barra do rodapé: a ativa fica amarela.
defineProps<{ tabs: { id: string; label: string; badge?: boolean }[]; active: string }>();
defineEmits<{ select: [id: any] }>();
</script>

<template>
  <nav class="subtabs" aria-label="Seções da loja">
    <div class="subtabs__inner">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        data-ui-sound="tab"
        class="subtabs__tab"
        :class="{ 'is-active': active === tab.id }"
        :aria-current="active === tab.id ? 'true' : undefined"
        @click="$emit('select', tab.id)"
      >
        {{ tab.label }}
        <span v-if="tab.badge" class="subtabs__badge" aria-label="Disponível"><BaseNotification /></span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.subtabs {
  display: flex;
  justify-content: center;
  padding: 36px 10px 8px;
  background: linear-gradient(rgba(15, 20, 48, 0), rgba(15, 20, 48, 0.85) 55%);
}
.subtabs__inner {
  pointer-events: auto;
  display: flex;
  gap: 6px;
  width: min(560px, 100%);
  padding: 5px;
  border-radius: 14px;
  background: #141b36;
  border: 2px solid #e2b93b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
}
.subtabs__tab {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 4px;
  border: 0;
  border-radius: 9px;
  background: #222b4f;
  color: #fff;
  font: 14px/1.1 'Lilita One', sans-serif;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}
.subtabs__tab.is-active {
  background: linear-gradient(#ffe36b, #f5b400);
  color: #5a3100;
  box-shadow: inset 0 2px 0 #fff6c0;
}
.subtabs__badge {
  position: absolute;
  top: -8px;
  right: -2px;
  width: 18px;
  height: 18px;
  pointer-events: none;
}
@media (max-width: 400px) {
  .subtabs__tab {
    font-size: 12px;
  }
}
@media (max-height: 500px) and (orientation: landscape) {
  .subtabs {
    padding: 20px 8px 4px;
  }
  .subtabs__tab {
    padding: 5px 4px;
    font-size: 12px;
  }
}
</style>
