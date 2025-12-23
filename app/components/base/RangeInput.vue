<script setup>
import { computed, ref, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 50
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  fillColor: {
    type: String,
    default: 'rgb(74, 222, 128)' // green-400
  },
  trackColor: {
    type: String,
    default: 'rgb(209, 213, 219)' // gray-300
  },
  thumbColor: {
    type: String,
    default: 'white'
  },
  showValue: {
    type: Boolean,
    default: false
  },
  unit: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const sliderRef = ref(null)
const isDragging = ref(false)

const percentage = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

const handleInput = (event) => {
  emit('update:modelValue', Number(event.target.value))
}

const calculateValue = (clientX) => {
  if (!sliderRef.value) return

  const rect = sliderRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
  const percent = x / rect.width

  let value = props.min + percent * (props.max - props.min)
  value = Math.round(value / props.step) * props.step
  value = Math.max(props.min, Math.min(props.max, value))

  emit('update:modelValue', value)
}

const handleMouseDown = (event) => {
  isDragging.value = true
  calculateValue(event.clientX)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event) => {
  if (isDragging.value) {
    calculateValue(event.clientX)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const handleTouchStart = (event) => {
  isDragging.value = true
  const touch = event.touches[0]
  calculateValue(touch.clientX)
}

const handleTouchMove = (event) => {
  if (isDragging.value) {
    event.preventDefault()
    const touch = event.touches[0]
    calculateValue(touch.clientX)
  }
}

const handleTouchEnd = () => {
  isDragging.value = false
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="w-full relative flex items-center">
    <input
      ref="sliderRef"
      type="range"
      :value="modelValue"
      @input="handleInput"
      @mousedown="handleMouseDown"
      @touchstart.passive="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      :min="min"
      :max="max"
      :step="step"
      class="range-slider w-full"
      :style="{
        '--value': percentage,
        '--track-color': trackColor,
        '--fill-color': fillColor,
        '--thumb-color': thumbColor
      }"
    />
    <div v-if="showValue" class="text-center mt-2 text-sm font-semibold text-gray-700 absolute w-full -top-0.5 right-0 pointer-events-none">
      {{ modelValue }}{{ unit }}
    </div>
  </div>
</template>

<style scoped>
.range-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 2rem;
  background: linear-gradient(
    to right,
    var(--fill-color) 0%,
    var(--fill-color) calc(var(--value) * 1%),
    var(--track-color) calc(var(--value) * 1%),
    var(--track-color) 100%
  );
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease-in-out;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: var(--thumb-color);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.range-slider::-moz-range-thumb {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: var(--thumb-color);
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.range-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
}

.range-slider::-moz-range-thumb:active {
  transform: scale(0.95);
}

.range-slider::-moz-range-track {
  background: transparent;
}
</style>
