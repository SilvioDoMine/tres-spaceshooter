<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  activeColor: {
    type: String,
    default: 'rgb(74, 222, 128)' // green-400
  },
  inactiveColor: {
    type: String,
    default: 'rgb(209, 213, 219)' // gray-300
  },
  thumbColor: {
    type: String,
    default: 'white'
  }
})

const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => props.modelValue)

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    @click="toggle"
    class="toggle-button"
    :style="{
      '--active-color': activeColor,
      '--inactive-color': inactiveColor,
      '--thumb-color': thumbColor
    }"
    :class="{ 'is-checked': isChecked }"
    role="checkbox"
    :aria-checked="isChecked"
  >
    <!-- Bolinha deslizante -->
    <span class="toggle-thumb"></span>
  </button>
</template>

<style scoped>
.toggle-button {
  position: relative;
  width: 5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: var(--inactive-color);
  transition: background-color 0.3s ease-in-out;
  outline: none;
  border: none;
  cursor: pointer;
  box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.06);
}

.toggle-button.is-checked {
  background-color: var(--active-color);
}

.toggle-thumb {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: var(--thumb-color);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
  transition: transform 0.3s ease-in-out;
}

.toggle-button.is-checked .toggle-thumb {
  transform: translateX(2.5rem);
}

.toggle-button:hover .toggle-thumb {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
}

.toggle-button:active .toggle-thumb {
  transform: translateX(0) scale(0.95);
}

.toggle-button.is-checked:active .toggle-thumb {
  transform: translateX(2.5rem) scale(0.95);
}
</style>