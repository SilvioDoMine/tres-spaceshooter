<script setup lang="ts">
// Ícone de recompensa/habilidade (ouro, gemas, exp...) na mesma moldura rebaixada dos equipamentos.
const props = defineProps({
  /** Raridade do item/habilidade */
  rarity: {
    type: String as PropType<'gray' | 'green' | 'blue' | 'purple' | 'orange' | 'red'>,
    default: 'gray',
    validator: (value: string) => ['gray', 'green', 'blue', 'purple', 'orange', 'red'].includes(value),
  },
  /** Tamanho do ícone */
  size: {
    type: String as PropType<'sm' | 'md' | 'lg'>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  /** Mostrar indicador de quantidade/nível */
  badge: {
    type: String,
    required: false,
    default: '',
  },
  /** Mostrar quantidade no canto inferior direito */
  quantity: {
    type: String,
    default: '',
  },
  /** Se o componente é clicável */
  clickable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['click']);

const sizeClasses = {
  sm: 'w-16',
  md: 'w-20',
  lg: 'w-24',
};

function handleClick() {
  if (props.clickable) {
    emit('click');
  }
}
</script>

<template>
  <div
    :class="[
      'aicon relative shrink-0 transition-transform duration-150',
      sizeClasses[size],
      clickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default',
    ]"
    @click="handleClick"
  >
    <BaseRarityFrame :rarity="rarity">
      <slot />

      <template #overlay>
        <!-- Badge (opcional) -->
        <div v-if="badge" class="aicon__badge" :class="`is-${rarity}`">
          <p>{{ badge }}</p>
        </div>

        <!-- Quantidade (opcional) -->
        <div v-if="quantity" class="aicon__quantity title-text">{{ quantity }}</div>
      </template>
    </BaseRarityFrame>
  </div>
</template>

<style scoped>
.aicon__badge {
  position: absolute;
  z-index: 2;
  top: -6%;
  left: -6%;
  display: grid;
  place-items: center;
  min-width: 30%;
  height: 30%;
  padding: 0 4%;
  rotate: 45deg;
  border-radius: 22%;
  background: linear-gradient(#4a5166, #262b3a);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  font: 16cqw/1 'Fredoka One', sans-serif;
  color: #fff;
}
.aicon__badge p {
  margin: 0;
  rotate: -45deg;
}
.aicon__quantity {
  position: absolute;
  z-index: 2;
  right: 9%;
  bottom: 6%;
  font-size: max(11px, 17cqw);
  line-height: 1;
  color: #fff;
  -webkit-text-stroke: max(2.5px, 4cqw) #1a1f2e;
  paint-order: stroke fill;
  white-space: nowrap;
}
</style>
