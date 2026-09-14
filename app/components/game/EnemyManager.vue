<script setup lang="js">
import EnemyRaider from './enemies/EnemyRaider.vue';
import EnemyBoss from './enemies/EnemyBoss.vue';
import { shallowRef } from 'vue';
import { Box3 } from 'three';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';
import EnemySquare from '~/components/game/enemies/EnemySquare.vue';
import EnemyCone from '~/components/game/enemies/EnemyCone.vue';
import EnemyDodecahedron from '~/components/game/enemies/EnemyDodecahedron.vue';
// Componentes de exemplo (você pode comentar os que não quiser usar)
import EnemySphere from '~/components/game/enemies/EnemySphere.vue';
import EnemyTorus from '~/components/game/enemies/EnemyTorus.vue';
import EnemyComposite from '~/components/game/enemies/EnemyComposite.vue';
import { applyElementalTint } from '~/utils/elementalVisuals';

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
      enemyRefs.set(enemyId, { visualMesh: null, uiGroup: null, materials: [], visualState: null });
    }
    const refs = enemyRefs.get(enemyId);
    refs.visualMesh = el;
    const materials = new Set();
    el.traverse((part) => {
      if (!part.material) return;
      const partMaterials = Array.isArray(part.material) ? part.material : [part.material];
      partMaterials.forEach(material => materials.add(material));
    });
    refs.materials = [...materials];
    refs.visualState = null;
  }
};

// Função para setar ref do UI group
const setUIGroupRef = (enemyId) => (el) => {
  if (el) {
    if (!enemyRefs.has(enemyId)) {
      enemyRefs.set(enemyId, { visualMesh: null, uiGroup: null, materials: [], visualState: null });
    }
    enemyRefs.get(enemyId).uiGroup = el;
  }
};

// ==================== GAME LOOP (60 FPS) ====================
const { onBeforeRender } = useGameLoop();
let elementTime = 0;
const hpBox = new Box3();
onBeforeRender(({ delta }) => {
  elementTime += Math.min(delta, .1);
  const player = useCurrentRunStore().getPlayerPosition();
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
      opacity = enemy.spawnProgress;
      transparent = true;
    } else if (enemy.state === 'dying') {
      const progress = enemy.deathProgress;
      scale = 1;
      opacity = Math.max(0, 1 - progress * 5);
      transparent = true;
      deathRotation = 0;
    }

    // Atualiza escala
    visualMesh.scale.setScalar(scale);

    // Cascos detalhados possuem muitas peças. Os materiais são coletados uma vez
    // e só recebem escrita quando o estado visual realmente muda.
    const visualState = enemy.state === 'active' ? 'active' : `${enemy.state}:${opacity.toFixed(3)}`;
    if (refs.visualState !== visualState) {
      refs.materials.forEach((material) => {
        material.opacity = opacity;
        material.transparent = transparent;
      });
      refs.visualState = visualState;
    }

    // Modular ships keep their hull upright and face their target.
    // Quem voa com rumo próprio (caças das colmeias) aponta para onde vai, não para o jogador.
    // Congelado: o casco fica travado no rumo em que estava
    const frozen = Boolean(enemy.elementState?.freeze);
    const heading = frozen && refs.heading !== undefined
      ? refs.heading
      : enemy.visualHeading ?? Math.atan2(enemy.position.x - player.x, enemy.position.z - player.z);
    refs.heading = heading;
    visualMesh.rotation.set(0, heading + deathRotation, deathRotation * .2);

    // Barra de vida acima e à frente do casco: mede o modelo uma vez, já em escala cheia.
    // O alcance usa o maior lado para valer em qualquer rumo.
    if (enemy.state === 'active' && !refs.hpBar) {
      refs.hpBar = uiGroup.getObjectByName('enemy-hp-bar');
      if (refs.hpBar) {
        hpBox.setFromObject(visualMesh);
        const { x, y, z } = visualMesh.position;
        const reach = Math.max(x - hpBox.min.x, hpBox.max.x - x, z - hpBox.min.z, hpBox.max.z - z);
        refs.hpBar.position.set(0, Math.max(0, hpBox.max.y - y) + 0.1, -(reach + 0.25));
      }
    }
    applyElementalTint(refs, enemy.elementState, elementTime);
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
        :is="baseStats[enemy.type].model ? EnemyBoss : EnemyRaider"
        :enemy="enemy"
        :base-stats="baseStats"
        :set-visual-mesh-ref="setVisualMeshRef"
      />

      <!-- UI elements (NÃO ROTACIONAM) -->
      <TresGroup
        :ref="setUIGroupRef(enemy.id)"
        :name="`enemy-ui-${enemy.id}`"
      >
        <!-- HealthBar (só mostra quando ativo). A posição do grupo vem da medição do modelo no loop. -->
        <TresGroup name="enemy-hp-bar">
          <GameHealthBar
            v-if="enemy.state === 'active'"
            :current-health="enemy.health"
            :max-health="enemy.maxHealth"
            :width="baseStats[enemy.type].size * 0.9"
            :height="0.2"
            color="red"
            :hiddenFull="true"
          />
        </TresGroup>

        <!-- Combat Text -->
        <GameCombatText
          :position="[0, 0, -baseStats[enemy.type].size]"
          :entity-id="enemy.id"
        />
        <TresMesh
          v-if="enemy.equipmentMarked && enemy.state === 'active'"
          :position="[0, 0.18, 0]"
          :rotation="[-Math.PI / 2, 0, 0]"
        >
          <TresTorusGeometry :args="[baseStats[enemy.type].size * 0.72, 0.055, 6, 24]" />
          <TresMeshBasicMaterial color="#ffcf57" :transparent="true" :opacity="0.75" />
        </TresMesh>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>




