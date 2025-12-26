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
  height: 2rem;
  border-radius: 9999px;
  background-color: var(--inactive-color);
  transition: background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  outline: none;
  border: 2px solid #9ca3af;
  cursor: pointer;
  box-shadow:
    inset 0 2px 4px 0 rgba(0, 0, 0, 0.15),
    0 1px 0 0 rgba(255, 255, 255, 0.2);
}

/* Estado ativo - glossy verde */
.toggle-button.is-checked {
  background: linear-gradient(
    to bottom,
    hsl(106, 75%, 64%) 0%,
    #5cd63c 50%,
    #3cc41c 100%
  );
  border-color: #1a7a0a;
  box-shadow:
    inset 0 2px 4px 0 rgba(0, 0, 0, 0.1),
    0 1px 0 0 #1a8e0e,
    0 2px 0 0 #1a840c,
    0 3px 0 0 #1a7a0a,
    0 3px 6px 0 rgba(0, 0, 0, 0.3);
}

/* Highlight glossy no toggle ativo */
.toggle-button.is-checked::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 15%;
  right: 15%;
  height: 40%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
}

/* Thumb glossy */
.toggle-thumb {
  position: absolute;
  top: 0rem;
  left: 0.40rem;
  width: 1.50rem;
  height: 1.50rem;
  border-radius: 9999px;
  background: linear-gradient(
    to bottom,
    #ffffff 0%,
    #f3f4f6 50%,
    #e5e7eb 100%
  );
  border: 2px solid #d1d5db;
  box-shadow:
    0 1px 0 0 #e5e7eb,
    0 2px 0 0 #d1d5db,
    0 3px 0 0 #9ca3af,
    0 3px 6px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease-in-out, box-shadow 0.2s ease-in-out;
}

/* Highlight no thumb */
.toggle-thumb::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 15%;
  right: 15%;
  height: 35%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  border-radius: 50% 50% 100px 100px;
  pointer-events: none;
}

.toggle-button.is-checked .toggle-thumb {
  transform: translateX(2.5rem);
}

.toggle-button:hover .toggle-thumb {
  box-shadow:
    0 1px 0 0 #e5e7eb,
    0 2px 0 0 #d1d5db,
    0 3px 0 0 #9ca3af,
    0 4px 8px 0 rgba(0, 0, 0, 0.3);
}

.toggle-button:active .toggle-thumb {
  transform: translateX(0) scale(0.95) translateY(1px);
  box-shadow:
    0 1px 0 0 #d1d5db,
    0 2px 0 0 #9ca3af,
    0 2px 4px 0 rgba(0, 0, 0, 0.2);
}

.toggle-button.is-checked:active .toggle-thumb {
  transform: translateX(2.5rem) scale(0.95) translateY(1px);
  box-shadow:
    0 1px 0 0 #d1d5db,
    0 2px 0 0 #9ca3af,
    0 2px 4px 0 rgba(0, 0, 0, 0.2);
}
</style>