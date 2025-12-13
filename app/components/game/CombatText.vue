<script setup lang="js">
import { shallowRef, computed } from 'vue';
import { useLoop } from '@tresjs/core';

const props = defineProps({
  position: {
    type: Array,
    default: () => [0, 0, 0],
  },
});

// Lista de textos de combate ativos
const combatTexts = shallowRef([]);

// Função para adicionar um novo texto de combate
const addCombatText = (value, type = 'damage') => {
  const id = Date.now() + Math.random();
  const text = {
    id,
    value: Math.abs(Math.ceil(value)),
    type, // 'damage' ou 'heal'
    startTime: Date.now(),
    duration: 1000, // 1 segundo de duração
  };

  combatTexts.value = [...combatTexts.value, text];

  // Remove o texto após a duração
  setTimeout(() => {
    combatTexts.value = combatTexts.value.filter(t => t.id !== id);
  }, text.duration);
};

// Expõe a função para componentes pais
defineExpose({
  addCombatText,
});

// Calcula posição e opacidade baseado no tempo
const getTextState = (text) => {
  const elapsed = Date.now() - text.startTime;
  const progress = Math.min(elapsed / text.duration, 1);

  // Movimento para cima
  const yOffset = progress * 2;

  // Fade out
  const opacity = 1 - progress;

  return {
    position: [props.position[0], props.position[1] + yOffset, props.position[2]],
    opacity,
  };
};

// Retorna cor baseado no tipo
const getColor = (type) => {
  return type === 'heal' ? '#00ff00' : '#ff0000';
};

// Retorna prefixo baseado no tipo
const getPrefix = (type) => {
  return type === 'heal' ? '+' : '-';
};
</script>

<template>
  <TresGroup>
    <TresGroup
      v-for="text in combatTexts"
      :key="text.id"
      :position="getTextState(text).position"
    >
      <Suspense>
        <Text3D
          :position="[0, 0, 0]"
          :rotation="[-Math.PI / 2, 0, 0]"
          :scale="[0.5, 0.5, 0.5]"
          :text="`${getPrefix(text.type)}${text.value}`"
          font="/fonts/PoppinsBold.json"
          center
        >
          <TresMeshBasicMaterial
            :color="getColor(text.type)"
            :opacity="getTextState(text).opacity"
            :transparent="true"
          />
        </Text3D>
      </Suspense>
    </TresGroup>
  </TresGroup>
</template>
