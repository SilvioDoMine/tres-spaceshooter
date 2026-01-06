<script setup lang="ts">
import { useLoop } from '@tresjs/core';
import { shallowRef, ref, watch, computed } from 'vue'
import * as THREE from 'three'
import { Html } from '@tresjs/cientos'

// Import Enemy Components
import EnemySquare from '~/components/game/enemies/EnemySquare.vue';
import EnemyCone from '~/components/game/enemies/EnemyCone.vue';
import EnemyDodecahedron from '~/components/game/enemies/EnemyDodecahedron.vue';

// Import Background Component
import BgStarField from '~/components/lobby/backgrounds/BgStarField.vue';

const props = defineProps<{
  modelValue: number,
  maxUnlockedLevel: {
    type: Number,
    default: 1
  }
}>()

const emit = defineEmits(['update:modelValue'])

const groupRef = shallowRef(null)
const bossRefs = ref([])

// Map component types to actual components for dynamic rendering
const componentMap = {
  square: EnemySquare,
  cone: EnemyCone,
  dodecahedron: EnemyDodecahedron
}

// Background Atmosphere Colors
const atmosphereColors = {
  1: '#ffffff', // White
  2: '#ffffff', // White
  3: '#ffffff'  // White
}

// Boss configurations
const bosses = [
  { id: 1, type: 'dodecahedron', displayType: 'Dodecahedron' },
  { id: 2, type: 'square', displayType: 'Square' },
  { id: 3, type: 'cone', displayType: 'Cone' },
]

// Mock Base Stats for visual representation
const baseStats = {
  square: { color: 'hotpink', size: 2 },
  cone: { color: '#ff4d4d', size: 2 },
  dodecahedron: { color: 'gray', size: 2 }
}

// Dummy function to satisfy prop requirement (no-op in lobby)
const setVisualMeshRef = () => () => {}

const targetX = ref(0)
const spacing = 20 // Distance between bosses

// Update target position based on selected level
watch(() => props.modelValue, (newLevel) => {
  targetX.value = -((newLevel - 1) * spacing)
}, { immediate: true })

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  if (groupRef.value) {
    // Smoothly interpolate current x to target x
    groupRef.value.position.x += (targetX.value - groupRef.value.position.x) * delta * 5
  }

  // Animate individual bosses
  bossRefs.value.forEach((bossGroup, index) => {
    if (!bossGroup) return
    
    const bossType = bosses[index].type
    
    if (bossType === 'square') {
      // Spin like the cone
      bossGroup.rotation.y += delta * 0.5
      bossGroup.rotation.z = Math.sin(elapsed * 0.5) * 0.05
    } else if (bossType === 'cone') {
      // Much slower spin
      bossGroup.rotation.y += delta * 0.5
      bossGroup.rotation.z = Math.sin(elapsed * 0.5) * 0.05
    } else if (bossType === 'dodecahedron') {
      // Faster rotation in all directions
      bossGroup.rotation.x += delta * 0.8
      bossGroup.rotation.y += delta * 0.8
      bossGroup.rotation.z += delta * 0.8
    }
  })
})

</script>

<template>
  <TresGroup>
    <!-- Environment -->
    <TresPerspectiveCamera :position="[0, 3, 15]" :look-at="[0, 0 , 0]" />
    
    <!-- Dynamic Background -->
    <BgStarField 
      :atmosphereColor="atmosphereColors[modelValue] || '#1a0b2e'" 
      :galaxyOpacity="modelValue > 1 ? 0.6 : 0" 
      :level="modelValue"
    />

    <!-- Bosses Carousel -->
    <TresGroup ref="groupRef" :position="[0, 0, 0]">
      <TresGroup
        v-for="(boss, index) in bosses" 
        :key="boss.id"
        :position="[index * spacing, 0, 0]"
      >
        <!-- Rotated Boss Model -->
        <TresGroup :ref="(el) => bossRefs[index] = el">
          <component 
            :is="componentMap[boss.type]"
            :enemy="{ id: boss.id, type: boss.type }"
            :baseStats="baseStats"
            :setVisualMeshRef="setVisualMeshRef"
            :opacity="boss.id > maxUnlockedLevel ? 0.3 : 1"
          />
        </TresGroup>

        <!-- Static Lock Overlay -->
        <Html
          v-if="boss.id > maxUnlockedLevel"
          transform
          :position="[0, 0, 1]"
          center
          :sprite="true"
        >
          <div class="flex flex-col items-center justify-center pointer-events-none select-none min-w-[300px]">
            <div class="text-4xl filter drop-shadow-lg opacity-80 mb-2">
              🔒
            </div>
            <div class="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
              Conclua o capítulo {{ boss.id - 1 }}
            </div>
          </div>
        </Html>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
