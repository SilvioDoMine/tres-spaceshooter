<script setup lang="ts">
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
    default: '',
  },
  /** Mostrar quantidade no canto inferior esquerdo */
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

// Classes de tamanho
const sizeClasses = {
  sm: 'w-16 h-16 p-1.5',
  md: 'w-20 h-20 p-2',
  lg: 'w-24 h-24 p-2.5',
};

// Classes de borda (cor mais clara da raridade)
const borderClasses = {
  gray: 'border-gray-300',
  green: 'border-green-300',
  blue: 'border-blue-400',
  purple: 'border-fuchsia-500',
  orange: 'border-orange-400',
  red: 'border-red-500',
};

// Classes de gradiente interno (cores mais escuras com gradiente)
const gradientClasses = {
  gray: 'from-gray-500 via-gray-400 to-gray-500',
  green: 'from-green-600 via-green-500 to-green-600',
  blue: 'from-blue-700 via-blue-600 to-blue-700',
  purple: 'from-fuchsia-900 via-fuchsia-800 to-fuchsia-900',
  orange: 'from-orange-700 via-orange-800 to-orange-900',
  red: 'from-red-700 via-red-800 to-red-900',
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
      'relative flex items-center justify-center',
      'rounded-2xl border-4',
      'shadow-[inset_0_2px_0_rgba(255,255,255,0.1),0_2px_0_0_rgba(0,0,0,0.15),0_3px_0_0_rgba(0,0,0,0.12),0_4px_0_0_rgba(0,0,0,0.09),0_5px_8px_rgba(0,0,0,0.25)]',
      'transition-transform duration-150',
      sizeClasses[size],
      borderClasses[rarity],
      clickable && 'cursor-pointer hover:scale-105 active:scale-95 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.1),0_1px_0_0_rgba(0,0,0,0.15),0_2px_0_0_rgba(0,0,0,0.12),0_3px_4px_rgba(0,0,0,0.25)]',
      !clickable && 'cursor-default',
    ]"
    @click="handleClick"
  >
    <!-- Inner container with inset shadow and gradient -->
    <div
      :class="[
        'absolute inset-0 rounded-xl',
        'bg-linear-to-b',
        'shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),inset_0_0px_0px_rgba(0,0,0,0.3)]',
        gradientClasses[rarity],
      ]"
    />

    <!-- Content area (slot para ícone ou imagem) -->
    <div
      class="relative z-10 w-full h-full flex items-center justify-center"
    >
      <slot />
    </div>

    <!-- Badge (opcional) -->
    <div
      v-if="badge"
      class="absolute title-text -top-1 -left-1 min-w-6 h-6 px-1.5 flex items-center justify-center bg-linear-to-b border-2 rounded-md rotate-45 font-['Fredoka_One'] text-xs text-white text-shadow-[0_1px_2px_rgba(0,0,0,0.4)] shadow-[0_2px_4px_rgba(0,0,0,0.3)] drop-shadow-xs drop-shadow-black sm:min-w-5 sm:h-5 sm:text-[0.625rem]"
      :class="[
        borderClasses[rarity],
        gradientClasses[rarity],
      ]"
    >
      <p class="-rotate-45">{{ badge }}</p>
    </div>

    <!-- Quantity (opcional) -->
    <div
      v-if="quantity"
      class="absolute bottom-0 text-xs right-1 title-text text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-20"
    >
      {{ quantity }}
    </div>
  </div>
</template>
