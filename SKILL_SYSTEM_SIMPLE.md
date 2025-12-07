# Sistema de Skills KISS - Versão Simplificada

## Filosofia Ultra-Simples

- ✅ Usar o `SkillsList` que já existe no `currentRunStore.ts`
- ✅ Apenas funções puras, sem classes
- ✅ Skills se empilham automaticamente (multishot + diagonal = ambos aplicados)
- ✅ Modificadores aplicados em sequência
- ✅ Zero arquivos extras, tudo em 1-2 arquivos

---

## 1. Store Simplificado de Skills

**Arquivo**: `/app/stores/skillStore.js`

```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SkillsList } from './currentRunStore';

/**
 * Sistema de skills ultra-simplificado.
 * Cada skill tem apenas um "apply function" que modifica stats ou projéteis.
 */
export const useSkillStore = defineStore('skillStore', () => {
  // Skills ativas: { skillId: currentLevel }
  const activeSkills = ref({});

  // Modificadores de stats acumulados
  const statModifiers = computed(() => {
    let damage = 1;
    let health = 1;
    let speed = 1;
    let range = 1;
    let regen = 0;

    Object.entries(activeSkills.value).forEach(([skillId, level]) => {
      const skill = SkillsList[skillId];
      if (!skill) return;

      const levelData = skill.levels[level];
      if (!levelData) return;

      // Aplica modificadores baseado no tipo de skill
      if (skillId === 'damage_percentage') {
        damage *= levelData.value;
      } else if (skillId === 'health_percentage') {
        health *= levelData.value;
      } else if (skillId === 'general_speed') {
        speed *= levelData.value;
      } else if (skillId === 'range_extension') {
        range *= levelData.value;
      } else if (skillId === 'health_regeneration') {
        regen += levelData.value;
      }
    });

    return { damage, health, speed, range, regen };
  });

  /**
   * Aplica modificadores de comportamento aos projéteis.
   * Esta é a função mágica que permite interações!
   */
  function modifyProjectiles(baseProjectile) {
    let projectiles = [baseProjectile];

    // Aplica cada skill ativa em sequência
    Object.entries(activeSkills.value).forEach(([skillId, level]) => {
      const skill = SkillsList[skillId];
      if (!skill) return;

      const levelData = skill.levels[level];

      // Cada skill modifica TODOS os projéteis existentes
      if (skillId === 'multishot') {
        projectiles = applyMultishot(projectiles, levelData.value);
      } else if (skillId === 'diagonal_shot') {
        projectiles = applyDiagonalShot(projectiles, levelData.value);
      } else if (skillId === 'back_shot') {
        projectiles = applyBackShot(projectiles);
      } else if (skillId === 'piercing_shot') {
        projectiles = applyPiercing(projectiles, levelData.value);
      } else if (skillId === 'ricochet_shot') {
        projectiles = applyRicochet(projectiles, levelData.value);
      }
    });

    return projectiles;
  }

  /**
   * Adiciona/aumenta nível de uma skill
   */
  function addSkill(skillId) {
    const skill = SkillsList[skillId];
    if (!skill) {
      console.error(`Skill ${skillId} não existe`);
      return;
    }

    const currentLevel = activeSkills.value[skillId] || 0;
    const maxLevel = Object.keys(skill.levels).length;

    if (currentLevel >= maxLevel) {
      console.warn(`Skill ${skillId} já está no máximo`);
      return;
    }

    activeSkills.value[skillId] = currentLevel + 1;
    console.log(`${skill.name} nível ${currentLevel + 1}`);
  }

  /**
   * Pega 3 skills aleatórias disponíveis
   */
  function getRandomSkills(count = 3) {
    const available = Object.entries(SkillsList).filter(([id, skill]) => {
      const currentLevel = activeSkills.value[id] || 0;
      const maxLevel = Object.keys(skill.levels).length;
      return currentLevel < maxLevel;
    });

    // Embaralha e pega N skills
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(([id, skill]) => ({
      id,
      ...skill,
      currentLevel: activeSkills.value[id] || 0,
    }));
  }

  /**
   * Reset ao fim do jogo
   */
  function reset() {
    activeSkills.value = {};
  }

  return {
    activeSkills,
    statModifiers,
    modifyProjectiles,
    addSkill,
    getRandomSkills,
    reset,
  };
});

// ============================================
// FUNÇÕES DE MODIFICAÇÃO DE PROJÉTEIS
// ============================================

/**
 * Multishot: Duplica projéteis com pequeno ângulo
 */
function applyMultishot(projectiles, shotCount) {
  const result = [];

  projectiles.forEach(proj => {
    // Mantém o projétil original
    result.push(proj);

    // Adiciona projéteis extras com spread
    const angleSpread = 0.15; // radianos
    for (let i = 1; i < shotCount; i++) {
      const angle = angleSpread * (i % 2 === 0 ? i / 2 : -(i + 1) / 2);
      result.push(rotateProjectile(proj, angle, 0.6)); // 60% damage
    }
  });

  return result;
}

/**
 * Diagonal Shot: Adiciona projéteis em diagonais
 */
function applyDiagonalShot(projectiles, diagonalCount) {
  const result = [...projectiles];

  // Ângulos diagonais
  const angles = diagonalCount === 2
    ? [Math.PI / 4, -Math.PI / 4]
    : [Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];

  projectiles.forEach(proj => {
    angles.forEach(angle => {
      result.push(rotateProjectile(proj, angle, 0.5)); // 50% damage
    });
  });

  return result;
}

/**
 * Back Shot: Adiciona projétil na direção oposta
 */
function applyBackShot(projectiles) {
  const result = [...projectiles];

  projectiles.forEach(proj => {
    result.push({
      ...proj,
      direction: {
        x: -proj.direction.x,
        y: 0,
        z: -proj.direction.z,
      },
      damage: proj.damage * 0.9, // 90% damage
    });
  });

  return result;
}

/**
 * Piercing: Adiciona capacidade de perfurar
 */
function applyPiercing(projectiles, pierceCount) {
  return projectiles.map(proj => ({
    ...proj,
    piercing: pierceCount,
  }));
}

/**
 * Ricochet: Adiciona capacidade de ricochetear
 */
function applyRicochet(projectiles, ricochetCount) {
  return projectiles.map(proj => ({
    ...proj,
    ricochet: ricochetCount,
  }));
}

/**
 * Utilidade: Rotaciona direção de um projétil
 */
function rotateProjectile(proj, angle, damageMultiplier = 1) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    ...proj,
    direction: {
      x: proj.direction.x * cos - proj.direction.z * sin,
      y: 0,
      z: proj.direction.x * sin + proj.direction.z * cos,
    },
    damage: proj.damage * damageMultiplier,
  };
}

// HMR
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSkillStore, import.meta.hot))
}
```

---

## 2. Modal de Seleção (Simplificado)

**Arquivo**: `/app/components/ui/SkillSelectionModal.vue`

```vue
<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
    <div class="bg-gray-900 border-4 border-yellow-500 rounded-xl p-8 max-w-5xl">
      <h2 class="text-5xl font-bold text-yellow-400 mb-8 text-center animate-pulse">
        🎉 LEVEL UP! 🎉
      </h2>

      <div class="grid grid-cols-3 gap-6">
        <button
          v-for="skill in options"
          :key="skill.id"
          @click="select(skill.id)"
          class="group p-6 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-yellow-400 rounded-lg transition-all transform hover:scale-105"
        >
          <div class="text-6xl mb-4">{{ skill.icon }}</div>
          <h3 class="text-2xl font-bold text-white mb-2">{{ skill.name }}</h3>
          <p class="text-sm text-gray-400 mb-4">{{ skill.description }}</p>
          <div class="text-yellow-400 text-lg font-bold">
            {{ skill.currentLevel === 0 ? '🆕 NOVO!' : `Nível ${skill.currentLevel} → ${skill.currentLevel + 1}` }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSkillStore } from '~/stores/skillStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

const skillStore = useSkillStore();
const currentRunStore = useCurrentRunStore();

const visible = ref(false);
const options = ref([]);

watch(() => currentRunStore.showSkillSelectionModal, (show) => {
  if (show) {
    visible.value = true;
    options.value = skillStore.getRandomSkills(3);
  }
});

function select(skillId) {
  skillStore.addSkill(skillId);
  visible.value = false;
  currentRunStore.showSkillSelectionModal = false;
  currentRunStore.gameResume();
}
</script>
```

---

## 3. Integração no currentRunStore.ts

### 3.1 Adicionar ref do modal

Após a linha 208, adicionar:

```typescript
const showSkillSelectionModal = ref(false);
```

### 3.2 Modificar levelUp()

Substituir a função `levelUp()` (linha ~432):

```typescript
function levelUp() {
  currentLevel.value += 1;
  currentExp.value = currentExp.value - expToNextLevel.value;
  expToNextLevel.value = getExpForLevel(currentLevel.value);

  console.log(`🎉 Level ${currentLevel.value}!`);

  // Pausa e mostra modal
  gamePause();
  showSkillSelectionModal.value = true;
}
```

### 3.3 Adicionar no return

No return (linha ~453), adicionar:

```typescript
return {
  // ... existentes
  showSkillSelectionModal,
  // ...
};
```

### 3.4 Resetar skills ao fim do jogo

No `endRun()` (linha ~247), adicionar:

```typescript
function endRun() {
  console.log('Encerrando a partida atual.');

  // Reset de skills
  const skillStore = useSkillStore();
  skillStore.reset();

  // ... resto do código existente
}
```

---

## 4. Modificar Sistema de Tiro

### 4.1 Em `usePlayerControls.ts`

Importar no início:

```typescript
import { useSkillStore } from '~/stores/skillStore';
```

No composable:

```typescript
const skillStore = useSkillStore();
```

Substituir a seção de tiro (linha ~176-203):

```typescript
// Verifica se o cooldown do tiro terminou
if (currentRun.shotCooldown <= 0) {
  if (nearestEnemy && nearestEnemy.position) {
    // Calcula direção
    const dirX = nearestEnemy.position.x - position.x;
    const dirZ = nearestEnemy.position.z - position.z;
    const magnitude = Math.sqrt(dirX * dirX + dirZ * dirZ);

    if (magnitude > 0) {
      const direction = {
        x: dirX / magnitude,
        y: 0,
        z: dirZ / magnitude
      };

      // Pega modificadores de stats
      const mods = skillStore.statModifiers;

      // Projétil base
      const baseProjectile = {
        position: { x: position.x, y: position.y, z: position.z },
        direction: { ...direction },
        damage: PlayerBaseStats.projectiles.damage * mods.damage,
        speed: PlayerBaseStats.projectiles.shotSpeed,
        range: PlayerBaseStats.projectiles.range * mods.range,
      };

      // MAGIA: Aplica todas as skills de comportamento
      const finalProjectiles = skillStore.modifyProjectiles(baseProjectile);

      // Spawna todos os projéteis
      finalProjectiles.forEach(proj => {
        projectileStore.spawnProjectile(
          'player',
          proj.position,
          proj.direction,
          'player',
          'player',
          proj.damage,
          proj.speed,
          proj.range,
          proj.piercing || 0,
          proj.ricochet || 0,
        );
      });

      // Cooldown modificado por speed
      currentRun.shotCooldown = currentRun.shotCooldownTotal / mods.speed;
    }
  }
}
```

---

## 5. Modificar projectileStore.js para Suportar Piercing

### 5.1 Atualizar spawnProjectile

Modificar para aceitar piercing/ricochet (linha ~91):

```javascript
function spawnProjectile(
  type,
  position,
  direction,
  ownerId,
  ownerType,
  customDamage = null,
  customSpeed = null,
  customRange = null,
  piercing = 0,
  ricochet = 0
) {
  const config = projectilesType[type];

  if (!config) {
    console.warn(`Projectile type "${type}" not recognized.`);
    return;
  }

  projectiles.value.push({
    id: `projectile-${Date.now()}_${Math.random()}`,
    type,
    ownerId,
    ownerType,
    position: { ...position },
    direction: { ...direction },
    distanceTraveled: 0,
    speed: customSpeed ?? config.speed,
    damage: customDamage ?? config.damage,
    range: customRange ?? config.range,
    size: config.size,
    color: config.color,
    piercing,  // Quantos inimigos pode perfurar
    ricochet,  // Quantas vezes pode ricochetear
    hitEnemies: new Set(), // Inimigos já atingidos (para piercing)
  });
}
```

### 5.2 Atualizar checkCollisions para Piercing

Modificar a função `checkCollisions` (linha ~55):

```javascript
function checkCollisions() {
  projectiles.value.forEach((projectile, pIndex) => {
    if (projectile.ownerType === 'player') {
      // Verifica colisão com inimigos
      enemyManager.activeEnemies.value.forEach((enemy) => {
        // Ignora inimigos já atingidos por este projétil
        if (projectile.hitEnemies?.has(enemy.id)) return;

        if (
          isColliding(
            projectile.position,
            enemy.position,
            1
          )
        ) {
          // Aplica dano
          enemyManager.takeDamage(enemy.id, projectile.damage);

          // Marca inimigo como atingido
          if (!projectile.hitEnemies) {
            projectile.hitEnemies = new Set();
          }
          projectile.hitEnemies.add(enemy.id);

          // Verifica piercing
          if (projectile.piercing > 0) {
            projectile.piercing -= 1;
            // NÃO remove o projétil
          } else {
            // Sem piercing, remove o projétil
            projectiles.value.splice(pIndex, 1);
          }
        }
      });
    } else if (projectile.ownerType === 'enemy') {
      // Verifica colisão com o jogador
      if (
        isColliding(
          projectile.position,
          currentRunStore.getPlayerPosition(),
          1
        )
      ) {
        currentRunStore.takeDamage(projectile.damage);
        projectiles.value.splice(pIndex, 1);
      }
    }
  });
}
```

---

## 6. Sistema de Regeneração

Em `GameOrchestrator.vue`, adicionar no game loop:

```javascript
import { useSkillStore } from '~/stores/skillStore';

// No setup
const skillStore = useSkillStore();

// No gameTick
function gameTick({ delta }) {
  if (!currentRunStore.isPlaying) return;

  // ... código existente

  // Regeneração de vida
  const regenRate = skillStore.statModifiers.regen;
  if (regenRate > 0 && currentRunStore.currentHealth < currentRunStore.maxHealth) {
    const healAmount = currentRunStore.maxHealth * regenRate * delta;
    currentRunStore.currentHealth = Math.min(
      currentRunStore.currentHealth + healAmount,
      currentRunStore.maxHealth
    );
  }
}
```

---

## 7. Adicionar Modal no Layout

Em `/app/pages/play/[id].vue`:

```vue
<template>
  <div>
    <!-- ... componentes existentes -->
    <SkillSelectionModal />
  </div>
</template>

<script setup>
import SkillSelectionModal from '~/components/ui/SkillSelectionModal.vue';
// ... resto do código
</script>
```

---

## 8. Como Funcionam as Interações

### Exemplo 1: Multishot (2) + Diagonal (4)

```
Tiro base: 1 projétil
  ↓
Aplica Multishot (2 tiros):
  → Projétil frontal
  → Projétil frontal +15°

Agora temos: 2 projéteis
  ↓
Aplica Diagonal (4 diagonais):
  → Para CADA projétil existente (2), adiciona 4 diagonais

Resultado final: 2 + (2 × 4) = 10 projéteis!
```

### Exemplo 2: Diagonal (2) + Back Shot

```
Tiro base: 1 projétil frontal
  ↓
Aplica Diagonal (2):
  → Frontal + 45°
  → Frontal - 45°

Agora temos: 3 projéteis
  ↓
Aplica Back Shot:
  → Para CADA projétil, adiciona versão invertida

Resultado final: 6 projéteis (3 frontais + 3 traseiros)!
```

### Exemplo 3: Multishot (3) + Piercing (999)

```
Tiro base: 1 projétil
  ↓
Aplica Multishot (3):
  → 3 projéteis com spread

Agora temos: 3 projéteis
  ↓
Aplica Piercing (999):
  → Cada projétil pode perfurar 999 inimigos

Resultado: 3 projéteis perfurantes = OP!
```

---

## 9. Vantagens desta Abordagem

### ✅ Ultra-Simples
- **1 store** (`skillStore.js`)
- **1 modal** (`SkillSelectionModal.vue`)
- **Funções puras** (sem classes)
- **Zero configuração extra**

### ✅ Interações Automáticas
- Skills se empilham naturalmente
- Multishot + Diagonal = Multiplicação
- Piercing funciona com qualquer padrão
- Zero código especial para combos

### ✅ Usa Dados Existentes
- `SkillsList` do `currentRunStore.ts`
- Não precisa duplicar configurações
- Fácil de balancear (mexe só no SkillsList)

### ✅ Fácil de Extender
- Adicionar nova skill = adicionar 1 `else if` no `modifyProjectiles`
- Toda a lógica em um único lugar
- Debugar é trivial

---

## 10. Como Adicionar Nova Skill

### Exemplo: "Split Shot" (Divide em 2 após viajar metade do range)

**1. Adicionar no SkillsList** (`currentRunStore.ts`):

```typescript
split_shot: {
  id: 'split_shot',
  name: 'Tiro Dividido',
  description: 'Projéteis se dividem em 2 na metade do caminho.',
  icon: '🪓',
  rarity: 'epic',
  levels: {
    1: { value: 2, description: 'Divide em 2' },
    2: { value: 3, description: 'Divide em 3' },
  }
},
```

**2. Adicionar função em `skillStore.js`**:

```javascript
function applySplitShot(projectiles, splitCount) {
  return projectiles.map(proj => ({
    ...proj,
    splitCount: splitCount,
    splitAt: proj.range * 0.5, // Divide na metade
  }));
}
```

**3. Adicionar no `modifyProjectiles`**:

```javascript
else if (skillId === 'split_shot') {
  projectiles = applySplitShot(projectiles, levelData.value);
}
```

**4. Implementar lógica de split no `projectileStore.js` (update)**:

```javascript
function update(deltaTime) {
  checkCollisions();

  projectiles.value.forEach((projectile, index) => {
    // Move o projétil
    const distance = projectile.speed * deltaTime;
    projectile.position.x += projectile.direction.x * distance;
    projectile.position.z += projectile.direction.z * distance;
    projectile.distanceTraveled += distance;

    // Verifica split
    if (projectile.splitCount && projectile.distanceTraveled >= projectile.splitAt && !projectile.hasSplit) {
      projectile.hasSplit = true;

      // Cria projéteis divididos
      for (let i = 1; i < projectile.splitCount; i++) {
        const angle = (Math.PI / 4) * (i % 2 === 0 ? 1 : -1);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        spawnProjectile(
          projectile.type,
          { ...projectile.position },
          {
            x: projectile.direction.x * cos - projectile.direction.z * sin,
            y: 0,
            z: projectile.direction.x * sin + projectile.direction.z * cos,
          },
          projectile.ownerId,
          projectile.ownerType,
          projectile.damage * 0.7,
          projectile.speed,
          projectile.range - projectile.distanceTraveled,
          projectile.piercing,
          projectile.ricochet,
        );
      }
    }

    // Remove se atingiu alcance
    if (projectile.distanceTraveled >= projectile.range) {
      projectiles.value.splice(index, 1);
    }
  });
}
```

**Pronto!** Skill adicionada e funciona com todas as outras.

---

## 11. Fluxo Completo Simplificado

```
1. Player mata inimigo → ganha XP
2. Level up → pausa jogo → mostra modal
3. Modal → 3 skills aleatórias do SkillsList
4. Player escolhe skill → addSkill(skillId)
5. activeSkills[skillId] = level++
6. statModifiers (computed) recalcula automaticamente

No próximo tiro:
7. Cria projétil base com stats modificados
8. skillStore.modifyProjectiles(baseProjectile)
9. Aplica cada skill ativa em sequência
10. Multishot duplica → Diagonal adiciona → Piercing modifica
11. Spawna TODOS os projéteis resultantes
12. Projéteis com piercing não são removidos ao acertar
```

---

## 12. Resumo dos Arquivos

### Criar:
- ✅ `/app/stores/skillStore.js` (~200 linhas)
- ✅ `/app/components/ui/SkillSelectionModal.vue` (~50 linhas)

### Modificar:
- ✅ `/app/stores/currentRunStore.ts` (+ 3 linhas)
- ✅ `/app/composables/usePlayerControls.ts` (~30 linhas modificadas)
- ✅ `/app/stores/projectileStore.js` (~50 linhas modificadas)
- ✅ `/app/components/game/GameOrchestrator.vue` (+8 linhas)
- ✅ `/app/pages/play/[id].vue` (+2 linhas)

**Total**: ~350 linhas de código para sistema completo!

---

## 13. Skill Short Range (Caso Especial)

Para skills que modificam múltiplos stats ao mesmo tempo:

```javascript
// No statModifiers computed:
else if (skillId === 'short_range_shot') {
  damage *= 4.0;   // +300%
  range *= 0.2;    // -80%
  speed *= 3.0;    // +200% attack speed
}
```

---

## Conclusão

Este é o sistema **mais simples possível** que:

1. ✅ Usa suas definições existentes
2. ✅ Permite interações naturais entre skills
3. ✅ Não tem classes, heranças ou abstrações desnecessárias
4. ✅ Toda lógica em 1 store de ~200 linhas
5. ✅ Fácil de debugar e extender

**Para adicionar skill**:
1. Adiciona no `SkillsList` (já existe)
2. Adiciona 1 `else if` no `modifyProjectiles`
3. Pronto!

🚀 **KISS ao extremo!**
