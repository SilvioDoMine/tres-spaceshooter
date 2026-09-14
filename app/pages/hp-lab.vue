<script setup lang="ts">
import { useEnemyManager } from '~/composables/useEnemyManager'

// Bancada das barras de vida (só em dev): jogador, barras soltas e inimigos reais do EnemyManager.
if (!import.meta.dev) await navigateTo('/')
const player = ref(500)
const enemies = reactive([100, 100, 100])
const ENEMY_WIDTHS = [0.9, 1.8, 3.6]
function hit(amount: number) {
  player.value = Math.max(0, player.value - amount)
  enemies.forEach((hp, i) => { enemies[i] = Math.max(0, hp - amount / 5) })
}
function heal() {
  player.value = 500
  enemies.fill(100)
}

// Inimigos com modelo: nascem ativos e já feridos para a barra aparecer
const enemyManager = useEnemyManager()
const SPAWNS: [string, number, number][] = [['miniHive', -5, -3], ['hiveBoss', 4, -3], ['ufo', -5, 4], ['bastionBoss', 4, 5]]
onMounted(() => {
  enemyManager.cleanup()
  SPAWNS.forEach(([type, x, z]) => enemyManager.spawnEnemy(type, { position: { x, y: 0, z }, state: 'active', overrides: { maxHealth: 100, health: 60 } }))
})
</script>
<template>
  <main style="height:100dvh;background:#071226">
    <TresCanvas clear-color="#071226" :dpr="[1,2]">
      <TresPerspectiveCamera :position="[0,34,0.01]" :look-at="[0,0,0]" :fov="30" />
      <TresAmbientLight :intensity=".6" color="#7586da" />
      <TresDirectionalLight :intensity="2.5" :position="[5, 10, 7.5]" color="#ffe0b5" />
      <GameHealthBar :current-health="player" :max-health="500" :width="1.5" :height="0.21" :position="[0,0,-9]" show-hp :segment-hp="100" />
      <GameHealthBar v-for="(width, i) in ENEMY_WIDTHS" :key="i" :current-health="enemies[i]" :max-health="100" :width="width" :height="0.2" :position="[0,0,-8+i*0.6]" color="red" />
      <GameEnemyManager />
    </TresCanvas>
    <div style="position:fixed;top:15px;left:15px;display:flex;gap:12px;color:white;z-index:20">
      <button @click="hit(40)">Dano leve</button>
      <button @click="hit(150)">Dano forte</button>
      <button @click="heal">Curar</button>
    </div>
  </main>
</template>
