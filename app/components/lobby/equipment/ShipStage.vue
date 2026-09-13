<script lang="ts">
// Guardados entre montagens (troca de aba): último quadro e posição da câmera
let lastSnapshot: string | null = null;
let lastCameraPosition: [number, number, number] | null = null;
</script>

<script setup lang="ts">
// Palco 3D da tela de equipamento: nave parada sobre uma plataforma, céu estrelado ao fundo.
// Dá para girar só na horizontal (ângulo polar travado), sem zoom nem arrasto lateral.
//
// Troca de aba sem "buraco" na nave:
// - Entrando: o canvas monta na hora, mas a foto da última visita fica por cima até a nave 3D
//   carregar (a câmera volta para o mesmo ângulo, então a troca não pula).
// - Saindo: o WebGL é destruído no desmontar, antes da animação de saída acabar; o último
//   quadro vira uma imagem por cima para a nave continuar visível até sair da tela.
const POLAR_ANGLE = 1.2;
const DISTANCE = 3.3;
const DEFAULT_CAMERA: [number, number, number] = [0, DISTANCE * Math.cos(POLAR_ANGLE), DISTANCE * Math.sin(POLAR_ANGLE)];

/** Tempo máximo com a foto por cima, caso o modelo demore/falhe */
const PLACEHOLDER_FALLBACK_MS = 2000;

const cameraPosition = lastCameraPosition ?? DEFAULT_CAMERA;
const placeholder = ref<string | null>(lastSnapshot);

const root = ref<HTMLElement | null>(null);
const controls = ref<{ instance: { object: { position: { x: number; y: number; z: number } } } | null } | null>(null);

let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

function hidePlaceholder() {
  clearTimeout(fallbackTimer);
  placeholder.value = null;
}

// Espera a nave aparecer em pelo menos um quadro antes de tirar a foto de cima
function onShipLoaded() {
  requestAnimationFrame(() => requestAnimationFrame(hidePlaceholder));
}

onMounted(() => {
  if (placeholder.value) fallbackTimer = setTimeout(hidePlaceholder, PLACEHOLDER_FALLBACK_MS);
});

onBeforeUnmount(() => {
  clearTimeout(fallbackTimer);

  const camera = controls.value?.instance?.object;
  if (camera) lastCameraPosition = [camera.position.x, camera.position.y, camera.position.z];

  const canvas = root.value?.querySelector('canvas');
  if (!canvas || !root.value) return;
  try {
    const dataUrl = canvas.toDataURL();
    // "data:," = canvas sem tamanho/sem quadro desenhado; uma imagem vazia viraria ícone quebrado
    if (dataUrl.length < 32) return;
    lastSnapshot = dataUrl;

    // Criada direto no DOM: o componente já está desmontando, mas o elemento fica até a saída acabar
    const snapshot = document.createElement('img');
    snapshot.src = dataUrl;
    snapshot.alt = '';
    Object.assign(snapshot.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '1' });
    root.value.appendChild(snapshot);
  } catch (error) {
    console.warn('Não foi possível congelar o preview da nave:', error);
  }
});
</script>

<template>
  <div ref="root" class="ship-stage" aria-label="Prévia 3D da nave. Arraste para girar.">
    <TresCanvas :dpr="[1, 1.5]" clear-color="#16305e" :preserve-drawing-buffer="true">
      <TresPerspectiveCamera :position="cameraPosition" :look-at="[0, 0, 0]" :fov="42" />
      <TresAmbientLight :intensity="1" color="#b9dcf5" />
      <TresDirectionalLight :position="[3, 6, 4]" :intensity="3" />
      <TresDirectionalLight :position="[-4, 2, -3]" :intensity="2" color="#50cddd" />

      <Stars :radius="40" :count="900" :size="0.25" :size-attenuation="true" />

      <GameKestrelShip @loaded="onShipLoaded" />

      <!-- Plataforma com anel luminoso -->
      <TresMesh :position="[0, -0.55, 0]">
        <TresCylinderGeometry :args="[1.25, 1.4, 0.16, 48]" />
        <TresMeshStandardMaterial color="#2a4b7c" :metalness="0.6" :roughness="0.35" />
      </TresMesh>
      <TresMesh :position="[0, -0.46, 0]" :rotation="[-Math.PI / 2, 0, 0]">
        <TresRingGeometry :args="[1.05, 1.18, 64]" />
        <TresMeshBasicMaterial color="#5fd6ff" />
      </TresMesh>

      <OrbitControls
        ref="controls"
        :enable-pan="false"
        :enable-zoom="false"
        :enable-damping="true"
        :min-polar-angle="POLAR_ANGLE"
        :max-polar-angle="POLAR_ANGLE"
      />
    </TresCanvas>

    <Transition name="ship-stage-photo">
      <img v-if="placeholder" :src="placeholder" alt="" class="ship-stage__photo" />
    </Transition>
  </div>
</template>

<style scoped>
.ship-stage {
  /* Camadas próprias: a foto/vinheta (z-index) ficam só dentro do palco, sem cobrir os slots da tela */
  isolation: isolate;
  overflow: hidden;
  background: #16305e;
  touch-action: pan-y;
}
.ship-stage__photo {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.ship-stage-photo-leave-active {
  transition: opacity 0.25s ease;
}
.ship-stage-photo-leave-to {
  opacity: 0;
}
/* Luz de chão e vinheta por cima do canvas, sem bloquear o arraste */
.ship-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 30% at 50% 78%, rgba(95, 214, 255, 0.18), transparent 70%),
    linear-gradient(rgba(10, 18, 40, 0.35), transparent 30%, transparent 80%, rgba(29, 36, 64, 0.9));
}
</style>
