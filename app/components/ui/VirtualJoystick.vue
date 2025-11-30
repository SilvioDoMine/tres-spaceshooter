<script setup lang="ts">
import { ref, shallowReactive } from 'vue';
import { useCurrentRunStore } from '~/stores/currentRun';

const currentRun = useCurrentRunStore();

const isDragging = ref(false);
// ✅ shallowReactive: Propriedades top-level são reativas, mas sem deep watching
const stickPosition = shallowReactive({ x: 0, y: 0 }); // Posição visual do stick
const MAX_RADIUS = 50; // Raio máximo de movimento do stick em pixels

let startX = 0;
let startY = 0;

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
  startX = coords.clientX;
  startY = coords.clientY;
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
  >
    <div class="joystick-base" :style="{ opacity: isDragging ? 1 : 0.5 }">
      <div 
        class="joystick-stick" 
        :style="{ transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)` }"
      />
    </div>
  </div>
</template>

<style scoped>
.joystick-container {
  /* Posiciona no canto inferior esquerdo da tela */
  position: absolute;
  bottom: 20px; 
  left: 20px; 
  z-index: 100; /* Acima da cena 3D */
  width: 150px; /* Área de toque */
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.joystick-base {
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.2s;
}

.joystick-stick {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  position: absolute;
  cursor: grab;
}
</style>