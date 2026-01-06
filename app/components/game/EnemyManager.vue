<script setup lang="js">
import { shallowRef } from 'vue';
import { useLoop } from '@tresjs/core';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';
import EnemySquare from '~/components/game/enemies/EnemySquare.vue';
import EnemyCone from '~/components/game/enemies/EnemyCone.vue';
import EnemyDodecahedron from '~/components/game/enemies/EnemyDodecahedron.vue';
// Componentes de exemplo (você pode comentar os que não quiser usar)
import EnemySphere from '~/components/game/enemies/EnemySphere.vue';
import EnemyTorus from '~/components/game/enemies/EnemyTorus.vue';
import EnemyComposite from '~/components/game/enemies/EnemyComposite.vue';

const enemyManager = useEnemyManager();
const activeEnemies = enemyManager.activeEnemies;

// Mapeamento de shapes para componentes
// Para adicionar um novo tipo de inimigo, basta criar o componente e adicioná-lo aqui
const enemyComponents = {
  square: EnemySquare,
  cone: EnemyCone,
  dodecahedron: EnemyDodecahedron,
  // Componentes de exemplo:
  sphere: EnemySphere,
  torus: EnemyTorus,
  composite: EnemyComposite,
};

// Map para armazenar refs dos meshes de cada inimigo
// Chave: enemy.id, Valor: { visualMesh, uiGroup }
const enemyRefs = new Map();

// Função para setar ref do visual mesh
const setVisualMeshRef = (enemyId) => (el) => {
  if (el) {
    if (!enemyRefs.has(enemyId)) {
      enemyRefs.set(enemyId, { visualMesh: null, uiGroup: null });
    }
    enemyRefs.get(enemyId).visualMesh = el;
  }
};

// Função para setar ref do UI group
const setUIGroupRef = (enemyId) => (el) => {
  if (el) {
    if (!enemyRefs.has(enemyId)) {
      enemyRefs.set(enemyId, { visualMesh: null, uiGroup: null });
    }
    enemyRefs.get(enemyId).uiGroup = el;
  }
};

// ==================== GAME LOOP (60 FPS) ====================
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  activeEnemies.value.forEach(enemy => {
    const refs = enemyRefs.get(enemy.id);
    if (!refs?.visualMesh || !refs?.uiGroup) return;

    const visualMesh = refs.visualMesh;
    const uiGroup = refs.uiGroup;

    // ✅ MUTAÇÃO DIRETA: Atualiza posição sem disparar reatividade
    visualMesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
    uiGroup.position.set(enemy.position.x, enemy.position.y, enemy.position.z);

    // Calcula escala e opacidade baseado no estado
    let scale = 1;
    let opacity = 1;
    let transparent = false;
    let deathRotation = 0;

    if (enemy.state === 'spawning') {
      scale = enemy.spawnProgress;
      opacity = enemy.spawnProgress * 0.3;
      transparent = true;
    } else if (enemy.state === 'dying') {
      const progress = enemy.deathProgress;
      scale = 1 - progress;
      opacity = 1 - progress;
      transparent = true;
      deathRotation = progress * Math.PI * 2;
    }

    // Atualiza escala
    visualMesh.scale.setScalar(scale);

    // Atualiza material (opacidade e transparência)
    if (visualMesh.material) {
      visualMesh.material.opacity = opacity;
      visualMesh.material.transparent = transparent;
    }

    // Atualiza rotação baseado no tipo
    if (enemy.shape === 'square' || enemy.shape === 'cone') {
      // Square e Cone: rotação no eixo Y
      const rotY = (enemy.rotation || 0) + deathRotation;
      visualMesh.rotation.set(0, rotY, 0);
    } else if (enemy.shape === 'dodecahedron') {
      // Dodecahedron: rotação 3D customizada
      visualMesh.rotation.set(
        enemy.rotation?.x || 0,
        deathRotation,
        enemy.rotation?.z || 0
      );
    }
  });

  // Limpa refs de inimigos removidos
  const activeIds = new Set(activeEnemies.value.map(e => e.id));
  for (const [id] of enemyRefs) {
    if (!activeIds.has(id)) {
      enemyRefs.delete(id);
    }
  }
});

onUnmounted(() => {
  enemyManager.cleanup();
  enemyRefs.clear();
});
</script>

<template>
  <TresGroup>
    <TresGroup
      v-for="enemy in activeEnemies"
      :key="enemy.id"
    >
      <!-- Componente dinâmico baseado no shape do inimigo -->
      <component
        :is="enemyComponents[enemy.shape]"
        :enemy="enemy"
        :base-stats="baseStats"
        :set-visual-mesh-ref="setVisualMeshRef"
      />

      <!-- UI elements (NÃO ROTACIONAM) -->
      <TresGroup
        :ref="setUIGroupRef(enemy.id)"
        :name="`enemy-ui-${enemy.id}`"
      >
        <!-- HealthBar (só mostra quando ativo) -->
        <GameHealthBar
          v-if="enemy.state === 'active'"
          :current-health="enemy.health"
          :max-health="baseStats[enemy.type].health"
          :width="baseStats[enemy.type].size * 0.9"
          :height="0.2"
          :position="[0, 0, -baseStats[enemy.type].size * 0.7]"
          color="red"
          :hiddenFull="true"
        />

        <!-- Combat Text -->
        <GameCombatText
          :position="[0, 0, -baseStats[enemy.type].size]"
          :entity-id="enemy.id"
        />
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
