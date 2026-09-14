<script setup lang="ts">
import { SkillsList } from '~/stores/SkillStore';

// Bancada dos ícones de habilidade (só em dev): todos os ícones nas molduras de raridade, em vários tamanhos.
if (!import.meta.dev) await navigateTo('/');

const FRAMES: Record<string, 'gray' | 'green' | 'blue' | 'purple' | 'orange'> = {
  poor: 'gray',
  common: 'gray',
  uncommon: 'green',
  rare: 'blue',
  epic: 'purple',
  legendary: 'orange',
};
const SIZES = [40, 72, 112];

// Última linha: cadastro com emoji, para comparar a caixa
const skills = [
  ...Object.values(SkillsList),
  { id: 'emoji', name: 'Com emoji', icon: '🛡️', rarity: 'rare' },
];
</script>

<template>
  <main class="lab allow-scroll">
    <section v-for="skill in skills" :key="skill.id" class="lab__item">
      <div class="lab__sizes">
        <div v-for="size in SIZES" :key="size" :style="{ width: `${size}px` }">
          <BaseRarityFrame :rarity="FRAMES[skill.rarity]">
            <SkillIcon :icon="skill.icon" />
          </BaseRarityFrame>
        </div>
      </div>
      <p>
        {{ skill.name }} <small>{{ skill.icon }}</small>
      </p>
    </section>
  </main>
</template>

<style scoped>
.lab {
  position: fixed;
  inset: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-content: start;
  gap: 18px;
  padding: 24px;
  background: radial-gradient(ellipse at 50% 30%, #1d2c63, #070b1c 70%);
  color: #fff;
  font-family: 'Fredoka One', sans-serif;
}
.lab__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
}
.lab__sizes {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}
.lab__item p {
  margin: 0;
}
.lab__item small {
  opacity: 0.55;
}
</style>
