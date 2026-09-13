<script setup lang="ts">
// Palco 3D da tela de equipamento: nave parada sobre uma plataforma, céu estrelado ao fundo.
// Dá para girar só na horizontal (ângulo polar travado), sem zoom nem arrasto lateral.
const POLAR_ANGLE = 1.2;
const DISTANCE = 3.3;
const cameraPosition: [number, number, number] = [0, DISTANCE * Math.cos(POLAR_ANGLE), DISTANCE * Math.sin(POLAR_ANGLE)];
</script>

<template>
  <div class="ship-stage" aria-label="Prévia 3D da nave. Arraste para girar.">
    <TresCanvas :dpr="[1, 1.5]" clear-color="#16305e">
      <TresPerspectiveCamera :position="cameraPosition" :look-at="[0, 0, 0]" :fov="42" />
      <TresAmbientLight :intensity="1" color="#b9dcf5" />
      <TresDirectionalLight :position="[3, 6, 4]" :intensity="3" />
      <TresDirectionalLight :position="[-4, 2, -3]" :intensity="2" color="#50cddd" />

      <Stars :radius="40" :count="900" :size="0.25" :size-attenuation="true" />

      <GameKestrelShip />

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
        :enable-pan="false"
        :enable-zoom="false"
        :enable-damping="true"
        :min-polar-angle="POLAR_ANGLE"
        :max-polar-angle="POLAR_ANGLE"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
.ship-stage {
  overflow: hidden;
  background: #16305e;
  touch-action: pan-y;
}
/* Luz de chão e vinheta por cima do canvas, sem bloquear o arraste */
.ship-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 30% at 50% 78%, rgba(95, 214, 255, 0.18), transparent 70%),
    linear-gradient(rgba(10, 18, 40, 0.35), transparent 30%, transparent 80%, rgba(29, 36, 64, 0.9));
}
</style>
