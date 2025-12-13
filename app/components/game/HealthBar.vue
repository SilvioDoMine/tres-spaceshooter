<script setup lang="js">
import { computed } from 'vue';
import { DoubleSide } from 'three';

const props = defineProps({
  currentHealth: {
    type: Number,
    required: true,
  },
  maxHealth: {
    type: Number,
    required: true,
  },
  width: {
    type: Number,
    default: 1,
  },
  height: {
    type: Number,
    default: 0.1,
  },
  position: {
    type: Array,
    default: () => [0, 0, 0],
  },
  color: {
    type: String,
    default: null,
  },
  hiddenFull: {
    type: Boolean,
    default: false,
  },
  showHp: {
    type: Boolean,
    default: false,
  },
});

// Calcula a porcentagem de vida
const healthPercentage = computed(() => {
  return Math.max(0, Math.min(1, props.currentHealth / props.maxHealth));
});

// Largura da barra de vida baseada na porcentagem
const healthBarWidth = computed(() => {
  return props.width * healthPercentage.value;
});

// Cor da barra baseada na porcentagem de vida ou cor customizada
const healthColor = computed(() => {
  if (props.color) return props.color;
  if (healthPercentage.value > 0.6) return '#006400'; // Verde escuro
  if (healthPercentage.value > 0.3) return '#9b870c'; // Amarelo escuro
  return '#ff0000'; // Vermelho
});

// Posição da barra de vida (ajustada para ficar centralizada)
const healthBarPosition = computed(() => {
  const offset = (props.width - healthBarWidth.value) / 2;
  return [-offset, 0, 0];
});

// Visibilidade: só mostra se a vida não tiver cheia
const isVisible = computed(() => props.currentHealth >= props.maxHealth ? false : true);

// Texto de HP
const hpText = computed(() => {
  return `${Math.ceil(props.currentHealth)}`;
});
</script>

<template>
  <TresGroup :position="position" :rotation="[-Math.PI / 2, 0, 0]" v-if="isVisible || !props.hiddenFull">
    <!-- Fundo da barra (cinza) -->
    <TresMesh :position="[0, 0, 0]">
      <TresPlaneGeometry :args="[width, height]" />
      <TresMeshBasicMaterial color="#333333" :side="DoubleSide" />
    </TresMesh>

    <!-- Barra de vida (colorida) -->
    <TresMesh :position="healthBarPosition">
      <TresPlaneGeometry :args="[healthBarWidth, height]" />
      <TresMeshBasicMaterial :color="healthColor" :side="DoubleSide" />
    </TresMesh>

    <!-- Borda da barra -->
    <TresLineSegments :position="[0, 0, 0.001]">
      <TresEdgesGeometry>
        <TresPlaneGeometry :args="[width, height]" />
      </TresEdgesGeometry>
      <TresLineBasicMaterial color="#000000" />
    </TresLineSegments>

    <!-- Texto de HP (se habilitado) -->
    <Suspense v-if="showHp">
      <Text3D
        :position="[0, 0.1, 0.01]"
        :rotation="[0, 0, 0]"
        :scale="[height * 2, height * 2, 0.01]"
        :text="hpText"
        font="/fonts/PoppinsBold.json"
        need-updates
        center
      >
        <TresMeshBasicMaterial color="#fff" />
      </Text3D>
    </Suspense>
  </TresGroup>
</template>
