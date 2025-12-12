<script setup lang="ts">
import { ref, shallowReactive, onMounted, onBeforeUnmount } from 'vue';
import { useCurrentRunStore } from '~/stores/currentRunStore';

const currentRun = useCurrentRunStore();

const isDragging = ref(false);
const joystickBase = shallowReactive({ x: 0, y: 0 }); // Posição da base do joystick
const stickPosition = shallowReactive({ x: 0, y: 0 }); // Posição visual do stick relativa à base
const MAX_RADIUS = 50; // Raio máximo de movimento do stick em pixels

// Posição padrão do joystick (centro inferior da tela)
const defaultPosition = shallowReactive({ x: 0, y: 0 });

let startX = 0;
let startY = 0;

// Calcula a posição padrão ao montar o componente
onMounted(() => {
  updateDefaultPosition();
  window.addEventListener('resize', updateDefaultPosition);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDefaultPosition);
});

function updateDefaultPosition() {
  defaultPosition.x = window.innerWidth / 2;
  defaultPosition.y = window.innerHeight - 100; // 100px do fundo

  // Atualiza a posição do joystick se não estiver sendo arrastado
  if (!isDragging.value) {
    joystickBase.x = defaultPosition.x;
    joystickBase.y = defaultPosition.y;
  }
}

function getClientCoords(event: MouseEvent | TouchEvent): { clientX: number, clientY: number } {
  // Trata eventos de toque ou mouse
  if (event instanceof TouchEvent) {
    const touch = event.touches[0] || event.changedTouches[0];
    return { clientX: touch.clientX, clientY: touch.clientY };
  }

  return { clientX: event.clientX, clientY: event.clientY };
}

function handleStart(event: MouseEvent | TouchEvent) {
  const coords = getClientCoords(event);

  // Move a base do joystick para onde o usuário clicou
  startX = coords.clientX;
  startY = coords.clientY;
  joystickBase.x = coords.clientX;
  joystickBase.y = coords.clientY;

  isDragging.value = true;
  // Previne arrastar a tela em touch devices
  if (event instanceof TouchEvent) event.preventDefault();
}

function handleMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value) return;

  const coords = getClientCoords(event);
  const dx = coords.clientX - startX;
  const dy = coords.clientY - startY;

  // 1. Calcula a distância e limita ao MAX_RADIUS
  const distance = Math.sqrt(dx * dx + dy * dy);
  const finalDistance = Math.min(distance, MAX_RADIUS);

  // 2. Calcula a nova posição visual do stick (mantendo a direção)
  const angle = Math.atan2(dy, dx);
  stickPosition.x = Math.cos(angle) * finalDistance;
  stickPosition.y = Math.sin(angle) * finalDistance;

  // 3. Normaliza o vetor para o Pinia (0 a 1)
  // O eixo Y na tela (vertical) é mapeado para o eixo Z (profundidade) do mundo 3D
  const normalizedX = stickPosition.x / MAX_RADIUS;
  const normalizedZ = stickPosition.y / MAX_RADIUS; // Mapeia Y (tela) para Z (mundo)

  // 4. Atualiza a Store (o Cérebro do Jogo)
  currentRun.setMoveVector(normalizedX, 0, normalizedZ);
}

function handleEnd() {
  isDragging.value = false;
  stickPosition.x = 0;
  stickPosition.y = 0;

  // Volta o joystick para a posição padrão
  joystickBase.x = defaultPosition.x;
  joystickBase.y = defaultPosition.y;

  // Zera o vetor de movimento para o jogador parar
  currentRun.setMoveVector(0, 0, 0);
}
</script>

<template>
  <div
    class="joystick-container"
    @touchstart="handleStart"
    @touchmove.prevent="handleMove"
    @touchend="handleEnd"
    @mousedown="handleStart"
    @mousemove="handleMove"
    @mouseup="handleEnd"
    @mouseleave="handleEnd"
    v-if="currentRun.isPlaying"
  >
    <div
      class="joystick-base"
      :style="{
        left: `${joystickBase.x}px`,
        top: `${joystickBase.y}px`,
        opacity: isDragging ? 1 : 0.5
      }"
    >
      <div
        class="joystick-stick"
        :style="{ transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)` }"
      />
    </div>
  </div>
</template>

<style scoped>
.joystick-container {
  /* Cobre apenas a metade inferior da tela para capturar cliques */
  position: fixed;
  top: 50%;
  left: 0;
  width: 100vw;
  height: 50vh;
  z-index: 10; /* Acima da cena 3D, mas abaixo dos modais (z-50) */
  pointer-events: all;
  touch-action: none;
}

/** If the screen is desktop size, hidden */
@media (min-width: 1024px) {
  .joystick-container {
    display: none;
  }
}

.joystick-base {
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%); /* Centraliza o joystick no ponto clicado */
  pointer-events: none; /* Não bloqueia eventos - o container captura */
  transition: opacity 0.2s ease; /* Animação apenas na opacidade */
}

.joystick-stick {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  position: absolute;
  pointer-events: none;
}
</style>