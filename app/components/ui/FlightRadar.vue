<script setup lang="ts">
import { useEnemyManagerStore } from '~/stores/enemyManagerStore'
const run = useCurrentRunStore()
const enemies = useEnemyManagerStore()
const pilot = ref({ x: 50, y: 50, heading: 0 })
const contacts = ref<{ id: string, x: number, y: number }[]>([])
const portal = ref<{ x: number, y: number } | null>(null)
let timer: ReturnType<typeof setInterval>
function update() {
  const stage = run.currentStage as { width: number, height: number } | null
  if (!stage) return
  const center=run.getPlayerPosition();
  const point = (p: { x: number, z: number }) => ({
    x: Math.max(2, Math.min(98, 50 + (p.x-center.x) / 60 * 100)),
    y: Math.max(2, Math.min(98, 50 + (p.z-center.z) / 60 * 100)),
  })
  pilot.value = { ...point(run.getPlayerPosition()), heading: -run.getPlayerRotation().y * 180 / Math.PI }
  contacts.value = enemies.activeEnemies.filter(e => e.state !== 'dying').map(e => ({ id: e.id, ...point(e.position) }))
  portal.value = run.isDoorActive && run.doorPosition ? point(run.doorPosition) : null
}
onMounted(() => { update(); timer = setInterval(update, 100) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <aside class="flight-radar" aria-label="Radar da arena">
    <div class="radar-heading">K07 <span>RADAR</span></div>
    <svg viewBox="0 0 100 100" role="img" aria-label="Sua nave em branco, inimigos em laranja e portal em ciano">
      <path d="M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100" stroke="#71c9da" stroke-opacity=".12" stroke-width=".5" />
      <circle v-for="enemy in contacts" :key="enemy.id" :cx="enemy.x" :cy="enemy.y" r="1.8" fill="#ff9d62" />
      <circle v-if="portal" :cx="portal.x" :cy="portal.y" r="3.5" fill="none" stroke="#67f6ef" stroke-width="1.2" />
      <path d="M0 -3.5L2.5 3L0 1.5L-2.5 3Z" fill="#e1fbff" :transform="`translate(${pilot.x} ${pilot.y}) rotate(${pilot.heading})`" />
    </svg>
    <p>{{ portal ? 'PORTAL LIBERADO' : `${contacts.length} CONTATOS` }}</p>
    <small>WASD / arraste<br>Pare para atirar</small>
  </aside>
</template>

<style scoped>
.flight-radar { position:fixed; right:16px; top:86px; width:118px; padding:9px; color:#b6dce3; background:#04101ccc; border:1px solid #42657380; border-radius:9px; pointer-events:none; z-index:11; font:10px/1.5 monospace; backdrop-filter:blur(8px) }
.radar-heading { display:flex; justify-content:space-between; letter-spacing:1.5px }
.radar-heading span { color:#628e9c }
svg { width:100%; border:1px solid #426573; margin:7px 0 }
p { margin:0; color:#8ee5de; font-size:9px }
small { display:block; margin-top:6px; color:#75939e; font-size:9px }
@media(max-width:600px) { .flight-radar { width:76px; right:8px; top:auto; bottom:12px; padding:6px } small { display:none } }
@media(max-height:500px){.flight-radar{width:70px;top:74px;bottom:auto;padding:4px}small,.radar-heading{display:none}svg{margin:0}p{font-size:8px}}
</style>


