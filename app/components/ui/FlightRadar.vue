<script setup lang="ts">
import { useEnemyManagerStore } from '~/stores/enemyManagerStore'

// Sonar da arena, no idioma visual das outras HUDs (vidro escuro, borda grossa, aba do nível,
// pílula com ícone em círculo). O feixe gira e cada contato só acende quando ele passa por cima,
// apagando em seguida — por isso a posição vale mais que a cor: azul do HUD no feixe, laranja de
// hostil nos contatos, dourado de objetivo no portal.
const run = useCurrentRunStore()
const enemies = useEnemyManagerStore()

const SWEEP_SECONDS = 2.8   // uma volta do feixe
const TAIL_DEGREES = 62     // quanto tempo o eco leva para apagar, em graus de varredura
const ECHO_FLOOR = 0.12     // brilho mínimo: o contato some, mas nunca a ponto de se perder

const pilot = ref({ x: 50, y: 50, heading: 0 })
const contacts = ref<{ id: string, x: number, y: number, angle: number }[]>([])
const portal = ref<{ x: number, y: number } | null>(null)
const sweep = ref(0)
const reducedMotion = useState('spatial-reduced-motion', () => false)

let timer: ReturnType<typeof setInterval>
let frame = 0
let last = 0

/** Ângulo do ponto no mostrador, em graus horários a partir das 12 horas (mesma origem do feixe). */
function bearing(x: number, y: number) {
  return (Math.atan2(x - 50, 50 - y) * 180 / Math.PI + 360) % 360
}

function update() {
  const stage = run.currentStage as { width: number, height: number } | null
  if (!stage) return
  const center=run.getPlayerPosition();
  const point = (p: { x: number, z: number }) => ({
    x: Math.max(2, Math.min(98, 50 + (p.x-center.x) / 60 * 100)),
    y: Math.max(2, Math.min(98, 50 + (p.z-center.z) / 60 * 100)),
  })
  pilot.value = { ...point(run.getPlayerPosition()), heading: -run.getPlayerRotation().y * 180 / Math.PI }
  contacts.value = enemies.activeEnemies.filter(e => e.state !== 'dying').map(e => {
    const p = point(e.position)
    return { id: e.id, ...p, angle: bearing(p.x, p.y) }
  })
  portal.value = run.isDoorActive && run.doorPosition ? point(run.doorPosition) : null
}

/** Eco do contato: acende quando o feixe passa e vai apagando atrás dele. */
function echo(angle: number) {
  if (reducedMotion.value) return 1
  const behind = (sweep.value - angle + 360) % 360
  return ECHO_FLOOR + (1 - ECHO_FLOOR) * Math.exp(-behind / TAIL_DEGREES)
}

function spin(now: number) {
  frame = requestAnimationFrame(spin)
  const delta = last ? Math.min(now - last, 100) : 0
  last = now
  // Parado na pausa: o feixe congela junto com a partida
  if (run.isPlaying && !reducedMotion.value) sweep.value = (sweep.value + delta / 1000 / SWEEP_SECONDS * 360) % 360
}

onMounted(() => { update(); timer = setInterval(update, 100); frame = requestAnimationFrame(spin) })
onUnmounted(() => { clearInterval(timer); cancelAnimationFrame(frame) })
</script>

<template>
  <aside class="radar" aria-label="Sonar da arena">
    <!-- Aba pendurada, no mesmo recorte da aba de nível -->
    <div class="radar__tab title-text">SONAR</div>

    <!-- Mostrador redondo -->
    <div class="radar__scope">
      <!-- Feixe girando: a ponta clara é a frente da varredura, o rastro fica para trás -->
      <span class="radar__sweep" :style="{ rotate: `${sweep}deg` }" aria-hidden="true"></span>

      <svg viewBox="0 0 100 100" role="img" aria-label="Sua nave no centro, contatos em laranja e portal em dourado">
        <!-- Anéis de alcance e cruz, bem discretos -->
        <circle cx="50" cy="50" r="33" fill="none" stroke="#7cc8ff" stroke-opacity=".16" stroke-width="1" />
        <circle cx="50" cy="50" r="17" fill="none" stroke="#7cc8ff" stroke-opacity=".12" stroke-width="1" />
        <path d="M50 6V94M6 50H94" stroke="#7cc8ff" stroke-opacity=".09" stroke-width="1" />

        <!-- Portal: objetivo da sala, fica sempre aceso -->
        <g v-if="portal" class="radar__portal">
          <circle :cx="portal.x" :cy="portal.y" r="5.4" fill="none" stroke="#2a1a00" stroke-width="3.4" />
          <circle :cx="portal.x" :cy="portal.y" r="5.4" fill="none" stroke="#ffd23a" stroke-width="2" />
        </g>

        <!-- Contatos: acendem na passagem do feixe e apagam atrás dele -->
        <g v-for="enemy in contacts" :key="enemy.id" :opacity="echo(enemy.angle)">
          <circle :cx="enemy.x" :cy="enemy.y" r="5" fill="#ff8a3d" :opacity="echo(enemy.angle) * 0.22" />
          <circle :cx="enemy.x" :cy="enemy.y" r="2.6" fill="#ff8a3d" stroke="#3a1403" stroke-width="1.4" />
        </g>

        <!-- Nave do jogador -->
        <path
          d="M0 -4.6L3.3 4L0 2L-3.3 4Z"
          fill="#ffffff"
          stroke="#10131f"
          stroke-width="1.6"
          stroke-linejoin="round"
          :transform="`translate(${pilot.x} ${pilot.y}) rotate(${pilot.heading})`"
        />
      </svg>
      <span class="radar__gloss" aria-hidden="true"></span>
    </div>

    <!-- Estado: pílula com ícone em círculo, igual à pílula de sala -->
    <div class="radar__status" :class="{ 'is-portal': portal }">
      <span class="radar__icon" aria-hidden="true">
        <svg v-if="portal" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20m0 4.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11"/></svg>
        <svg v-else viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a1.5 1.5 0 0 1 1.5 1.5v1.6a7 7 0 0 1 5.4 5.4h1.6a1.5 1.5 0 0 1 0 3h-1.6a7 7 0 0 1-5.4 5.4v1.6a1.5 1.5 0 0 1-3 0v-1.6a7 7 0 0 1-5.4-5.4H3.5a1.5 1.5 0 0 1 0-3h1.6a7 7 0 0 1 5.4-5.4V3.5A1.5 1.5 0 0 1 12 2m0 6a4 4 0 1 0 0 8a4 4 0 0 0 0-8"/></svg>
      </span>
      <span class="radar__label title-text">{{ portal ? 'PORTAL' : contacts.length }}</span>
    </div>

    <small class="radar__hint title-text">WASD / arraste<br>Pare para atirar</small>
  </aside>
</template>

<style scoped>
/* ==================== Painel ==================== */
.radar {
  position: fixed;
  right: 16px;
  top: 92px;
  z-index: 11;
  width: 132px;
  padding: 10px 10px 12px;
  border-radius: 18px;
  border: 2px solid rgba(10, 8, 20, 0.7);
  background: rgba(10, 8, 20, 0.55);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    inset 0 2px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
  color: #fff;
}

/* ==================== Aba ==================== */
.radar__tab {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 8px);
  translate: -50% 0;
  padding: 4px 18px 3px;
  background: rgba(10, 8, 20, 0.8);
  clip-path: polygon(14% 0, 86% 0, 100% 100%, 0 100%);
  font-size: 11px;
  line-height: 1;
  letter-spacing: 1px;
  color: #ffe9a8;
  white-space: nowrap;
  -webkit-text-stroke: 3px rgba(10, 8, 20, 0.9);
  paint-order: stroke fill;
}

/* ==================== Mostrador ==================== */
.radar__scope {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(10, 8, 20, 0.7);
  background:
    radial-gradient(circle at 50% 42%, rgba(74, 136, 196, 0.2), rgba(6, 11, 22, 0.92) 72%),
    #070d19;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.55);
}
.radar__scope svg {
  position: relative;
  display: block;
  width: 100%;
}

/* Feixe: cone claro na frente e rastro que se apaga para trás */
.radar__sweep {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(124, 200, 255, 0) 0deg,
    rgba(124, 200, 255, 0) 285deg,
    rgba(124, 200, 255, 0.07) 320deg,
    rgba(124, 200, 255, 0.28) 352deg,
    rgba(160, 226, 255, 0.55) 360deg
  );
}

/* Reflexo na metade de cima, como no preenchimento da barra de EXP */
.radar__gloss {
  position: absolute;
  top: 3px;
  left: 12%;
  right: 12%;
  height: 34%;
  border-radius: 999px;
  background: linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.radar__portal {
  animation: radar-portal 1.4s ease-in-out infinite;
  transform-origin: center;
}

/* ==================== Pílula de estado ==================== */
.radar__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 9px auto 0;
  padding: 2px 12px 2px 2px;
  width: fit-content;
  border-radius: 999px;
  background: rgba(10, 8, 20, 0.55);
}
.radar__icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #173f7d;
  background: linear-gradient(#7cc8ff, #2a74db);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.45);
  color: #fff;
}
.radar__icon svg {
  width: 12px;
  height: 12px;
  filter: drop-shadow(0 1px 0 #173f7d);
}
.radar__label {
  font-size: 15px;
  line-height: 1;
  color: #fff;
  -webkit-text-stroke: 4px rgba(10, 8, 20, 0.85);
  paint-order: stroke fill;
}
/* Portal liberado: a pílula vira dourada, a mesma cor de recompensa do resto da HUD */
.radar__status.is-portal .radar__icon {
  border-color: #7a4a00;
  background: linear-gradient(#fff09a, #e89a06);
  color: #5c3800;
}
.radar__status.is-portal .radar__icon svg {
  filter: drop-shadow(0 1px 0 rgba(122, 74, 0, 0.6));
}
.radar__status.is-portal .radar__label {
  font-size: 12px;
  color: #ffe9a8;
}

/* ==================== Dica ==================== */
.radar__hint {
  display: block;
  margin-top: 7px;
  font-size: 9px;
  line-height: 1.45;
  text-align: center;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.55);
}

@keyframes radar-portal {
  0%, 100% { opacity: 1; scale: 1; }
  50% { opacity: 0.55; scale: 1.12; }
}

@media (max-width: 600px) {
  .radar { width: 84px; right: 8px; top: auto; bottom: 12px; padding: 7px 7px 9px; border-radius: 15px }
  .radar__tab { font-size: 9px; padding: 3px 12px 2px }
  .radar__hint { display: none }
  .radar__status { margin-top: 7px; padding-right: 9px }
  .radar__icon { width: 18px; height: 18px }
  .radar__icon svg { width: 10px; height: 10px }
  .radar__label { font-size: 13px }
  /* Estreito demais para a palavra: o anel dourado sozinho já diz que o portal abriu */
  .radar__status.is-portal { padding: 2px }
  .radar__status.is-portal .radar__label { display: none }
}
@media (max-height: 500px) {
  .radar { width: 78px; top: 78px; bottom: auto; padding: 6px 6px 8px }
  .radar__tab, .radar__hint { display: none }
  .radar__status { margin-top: 6px }
  .radar__status.is-portal { padding: 2px }
  .radar__status.is-portal .radar__label { display: none }
}

@media (prefers-reduced-motion: reduce) {
  .radar__portal { animation: none }
  .radar__sweep { display: none }
}
</style>
