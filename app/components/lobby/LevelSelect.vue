<script setup lang="ts">
import { useLoop } from '@tresjs/core';
import EnemyRaider from '~/components/game/enemies/EnemyRaider.vue';
import EnemyBoss from '~/components/game/enemies/EnemyBoss.vue';
import { shallowRef, ref, watch, computed } from 'vue'
import { Html } from '@tresjs/cientos'

// Import Enemy Components
import EnemySquare from '~/components/game/enemies/EnemySquare.vue';
import EnemyCone from '~/components/game/enemies/EnemyCone.vue';
import EnemyDodecahedron from '~/components/game/enemies/EnemyDodecahedron.vue';
import EnemyComposite from '../game/enemies/EnemyComposite.vue';

// Import Background Component
import BgStarField from '~/components/lobby/backgrounds/BgStarField.vue';

const props = withDefaults(
  defineProps<{modelValue: number, maxUnlockedLevel?: number}>(),
  {maxUnlockedLevel: 1},
)

const emit = defineEmits(['update:modelValue'])

const groupRef = shallowRef(null)
const bossRefs = ref([])

// Map component types to actual components for dynamic rendering
const componentMap = {
  square: EnemySquare,
  cone: EnemyCone,
  dodecahedron: EnemyDodecahedron,
  composite: EnemyComposite
}

// Background Atmosphere Colors
const atmosphereColors = {
  1: '#ffffff', // White
  2: '#ffffff', // White
  3: '#ffffff'  // White
}

// Boss configurations
const bosses = [
  { id: 1, type: 'composite', displayType: 'SENTINELA • Patrulha orbital' },
  { id: 2, type: 'square', model: 'harpy', displayType: 'HARPIA • Interceptador pesado' },
  { id: 3, type: 'cone', model: 'colossus', displayType: 'COLOSSO • Comando da frota' },
]

// Mock Base Stats for visual representation
const baseStats = {
  square: { color: 'hotpink', size: 2 },
  cone: { color: '#ff4d4d', size: 2 },
  dodecahedron: { color: 'gray', size: 2 },
  composite: { color: 'fuchsia', size: 2 },
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
    // Smoothly interpolate current x to target x. O fator é limitado a 1: com um frame longo
    // (delta > 0.4s) ele passava do alvo e divergia, jogando o carrossel para o infinito.
    groupRef.value.position.x += (targetX.value - groupRef.value.position.x) * Math.min(1, delta * 5)
  }

  // Animate individual bosses
  bossRefs.value.forEach((bossGroup, index) => {
    if (!bossGroup) return
    
    const locked = bosses[index].id > props.maxUnlockedLevel
    bossGroup.traverse((part) => {
      if (!part.material) return
      for (const m of (Array.isArray(part.material) ? part.material : [part.material])) {
        if (!m.color) continue
        if (!m.userData.originalColor) {
          m.userData.originalColor = m.color.clone()
          m.userData.originalOpacity = m.opacity
          m.userData.originalTransparent = m.transparent
        }
        if (m.emissive && !m.userData.originalEmission) m.userData.originalEmission=m.emissive.clone()
        m.color.copy(m.userData.originalColor)
        if (locked) m.color.set('#626d7e')
        if(m.emissive) m.emissive.copy(locked ? m.color.clone().multiplyScalar(0) : m.userData.originalEmission)
        m.opacity=locked ? .48 : m.userData.originalOpacity; m.transparent=locked || m.userData.originalTransparent
      }
    })
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
    } else if (bossType === 'composite') {
      // Composite has both slow rotation and bobbing
      bossGroup.rotation.y += delta * 0.3
      bossGroup.position.y = Math.sin(elapsed * 1) * 0.5
    }
  })
})

</script>

<template>
  <TresGroup>
    <!-- Environment -->
    <TresPerspectiveCamera :position="[0, 8, 12]" :look-at="[0, 0 , 0]" />
    <TresAmbientLight :intensity="1.2" color="#b5d4e7" />
    <TresDirectionalLight :position="[3,6,5]" :intensity="3" />
    <TresDirectionalLight :position="[-4,2,-3]" :intensity="2" color="#36b6d1" />
    
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
            :is="boss.model ? EnemyBoss : EnemyRaider"
            :model="boss.model"
            :enemy="{ id: boss.id, type: boss.type }"
            :baseStats="baseStats"
            :setVisualMeshRef="setVisualMeshRef"
            :opacity="boss.id > maxUnlockedLevel ? 0.3 : 1"
          />
        </TresGroup>

        <Html v-if="boss.id > maxUnlockedLevel" :position="[0,.5,0]" center :z-index-range="[2,2]" pointer-events="none">
          <div class="chapter-lock" aria-label="Capítulo bloqueado">🔒</div>
        </Html>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>

<style scoped>
.chapter-lock{font-size:48px;background:#172b48d9;border:3px solid #89a0bd;border-radius:22px;padding:8px 15px;box-shadow:0 5px 0 #0d192b;filter:drop-shadow(0 4px 10px #0009)}
.enemy-title{width:250px;max-width:75vw;text-align:center;padding:10px 16px;border:3px solid #3672b4;border-radius:15px;background:linear-gradient(#65b5fa,#2c79c7);box-shadow:0 5px 0 #194b85,inset 0 2px 0 #b7e1ff;color:white;font-family:'Lilita One',sans-serif;text-shadow:0 2px 0 #25528b}
.enemy-title strong{display:block;font-size:23px;font-weight:400;letter-spacing:.5px}.enemy-title span{display:block;font:13px 'Fredoka One',sans-serif;margin:2px 0 8px}.enemy-title small{display:block;background:#183d6d;border-radius:8px;padding:6px;font:12px 'Lilita One',sans-serif;color:#ffdf85;text-shadow:none}.enemy-title small.ready{color:#d9f3ff;background:#235d99}
@media(max-width:650px),(max-height:500px){.chapter-lock{font-size:32px;padding:5px 10px;border-radius:15px}}
</style>


