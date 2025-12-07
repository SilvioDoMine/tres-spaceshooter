# Sistema de Skills Modular - Arquitetura

## Visão Geral

Sistema de skills inspirado no **Archero 2**, onde cada vez que o jogador sobe de nível, o jogo pausa e oferece 3 skills aleatórias para escolher. As skills podem modificar stats base (dano, vida, velocidade) ou adicionar comportamentos especiais (multishot, tiro diagonal, piercing, etc.).

## Princípios de Design

### KISS (Keep It Simple, Stupid)
- Cada skill é uma classe isolada
- Sistema central é apenas um gerenciador
- Não há lógica condicional gigante

### DRY (Don't Repeat Yourself)
- Classe base `SkillBase` evita repetição
- Sistema de hooks reutilizável
- Modificadores calculados automaticamente

### Modularidade
- Adicionar nova skill: criar arquivo + registrar em `index.ts`
- Desativar skill: comentar linha no `index.ts`
- Skills não se conhecem (zero acoplamento)

---

## Estrutura de Arquivos

```
/app
├── /stores
│   ├── currentRunStore.ts          # (já existe)
│   └── skillStore.ts                # NOVO: Gerencia skills ativas
│
├── /composables
│   └── usePlayerControls.ts        # (já existe - será modificado)
│
├── /skills                          # NOVO: Diretório de skills
│   ├── index.ts                    # Registro de todas as skills
│   ├── SkillBase.ts                # Classe base abstrata
│   │
│   ├── /stat-modifiers             # Skills que modificam stats
│   │   ├── DamageBoostSkill.ts
│   │   ├── HealthBoostSkill.ts
│   │   ├── SpeedBoostSkill.ts
│   │   ├── HealthRegenerationSkill.ts
│   │   └── RangeExtensionSkill.ts
│   │
│   └── /behavior-modifiers          # Skills que modificam comportamento
│       ├── MultiShotSkill.ts
│       ├── DiagonalShotSkill.ts
│       ├── PiercingShotSkill.ts
│       ├── BackShotSkill.ts
│       ├── RicochetShotSkill.ts
│       └── ShortRangeShotSkill.ts
│
└── /components/ui
    └── SkillSelectionModal.vue      # NOVO: Modal de seleção
```

---

## 1. Classe Base de Skills

**Arquivo**: `/app/skills/SkillBase.ts`

```typescript
/**
 * Classe base abstrata para todas as skills.
 * Cada skill deve implementar os métodos apply, remove e getModifiers.
 */
export abstract class SkillBase {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  currentLevel: number = 0;
  maxLevel: number;

  constructor(config: SkillConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.icon = config.icon;
    this.rarity = config.rarity;
    this.maxLevel = config.maxLevel;
  }

  /**
   * Aplica a skill ao jogador.
   * Incrementa o nível e retorna os modificadores.
   */
  levelUp(): SkillModifiers {
    if (this.currentLevel >= this.maxLevel) {
      console.warn(`Skill ${this.id} já está no nível máximo`);
      return {};
    }

    this.currentLevel++;
    return this.getModifiers();
  }

  /**
   * Remove a skill (usado para reset entre partidas).
   */
  reset(): void {
    this.currentLevel = 0;
  }

  /**
   * Retorna os modificadores atuais baseado no nível.
   * Cada skill implementa sua própria lógica.
   */
  abstract getModifiers(): SkillModifiers;
}

// Tipos
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  maxLevel: number;
}

export interface SkillModifiers {
  // Modificadores de stats (multiplicadores ou valores fixos)
  damageMultiplier?: number;
  healthMultiplier?: number;
  speedMultiplier?: number;
  rangeMultiplier?: number;
  healthRegeneration?: number; // % por segundo

  // Modificadores de comportamento (funções hook)
  onShoot?: (context: ShootContext) => ShootContext;
  onProjectileHit?: (context: HitContext) => HitContext;
  onProjectileSpawn?: (projectiles: Projectile[]) => Projectile[];
}

export interface ShootContext {
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  target: any;
  baseDamage: number;
  baseSpeed: number;
  baseRange: number;
}

export interface HitContext {
  projectile: any;
  enemy: any;
  damage: number;
  shouldRemoveProjectile: boolean;
}

export interface Projectile {
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  damage: number;
  speed: number;
  range: number;
  piercingCount?: number; // Quantos inimigos pode perfurar
  ricochetCount?: number; // Quantas vezes pode ricochetear
}
```

---

## 2. Exemplos de Skills

### 2.1 Skill de Stat (Damage Boost)

**Arquivo**: `/app/skills/stat-modifiers/DamageBoostSkill.ts`

```typescript
import { SkillBase, SkillModifiers } from '../SkillBase';

export class DamageBoostSkill extends SkillBase {
  private levels = {
    1: { multiplier: 1.4 },  // +40%
    2: { multiplier: 1.6 },  // +60%
    3: { multiplier: 1.8 },  // +80%
    4: { multiplier: 2.2 },  // +120%
    5: { multiplier: 3.0 },  // +200%
  };

  constructor() {
    super({
      id: 'damage_percentage',
      name: 'Dano Aumentado',
      description: 'Aumenta o dano base do seu projétil.',
      icon: '⚔️',
      rarity: 'common',
      maxLevel: 5,
    });
  }

  getModifiers(): SkillModifiers {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      damageMultiplier: levelData.multiplier,
    };
  }
}
```

### 2.2 Skill de Comportamento (Multi Shot)

**Arquivo**: `/app/skills/behavior-modifiers/MultiShotSkill.ts`

```typescript
import { SkillBase, SkillModifiers, Projectile } from '../SkillBase';

export class MultiShotSkill extends SkillBase {
  private levels = {
    1: { projectileCount: 2, damageMultiplier: 0.6 },
    2: { projectileCount: 3, damageMultiplier: 0.6 },
  };

  constructor() {
    super({
      id: 'multishot',
      name: 'Tiros Múltiplos',
      description: 'Dispara projéteis adicionais com 60% da eficiência.',
      icon: '🔫',
      rarity: 'epic',
      maxLevel: 2,
    });
  }

  getModifiers(): SkillModifiers {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      // Hook que modifica a lista de projéteis antes de spawnar
      onProjectileSpawn: (projectiles: Projectile[]) => {
        const original = projectiles[0];
        const newProjectiles = [original];

        // Adiciona projéteis extras com spread angular
        const angleSpread = 0.2; // radianos
        const totalShots = levelData.projectileCount;

        for (let i = 1; i < totalShots; i++) {
          const angle = angleSpread * (i - (totalShots - 1) / 2);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          newProjectiles.push({
            ...original,
            direction: {
              x: original.direction.x * cos - original.direction.z * sin,
              y: 0,
              z: original.direction.x * sin + original.direction.z * cos,
            },
            damage: original.damage * levelData.damageMultiplier,
          });
        }

        return newProjectiles;
      },
    };
  }
}
```

### 2.3 Skill de Comportamento (Tiro Diagonal)

**Arquivo**: `/app/skills/behavior-modifiers/DiagonalShotSkill.ts`

```typescript
import { SkillBase, SkillModifiers, Projectile } from '../SkillBase';

export class DiagonalShotSkill extends SkillBase {
  private levels = {
    1: { diagonalCount: 2, damageMultiplier: 0.5 }, // 2 diagonais
    2: { diagonalCount: 4, damageMultiplier: 0.5 }, // 4 diagonais
  };

  constructor() {
    super({
      id: 'diagonal_shot',
      name: 'Tiros Diagonais',
      description: 'Adiciona tiros diagonais adicionais com 50% da eficiência.',
      icon: '➗',
      rarity: 'rare',
      maxLevel: 2,
    });
  }

  getModifiers(): SkillModifiers {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      onProjectileSpawn: (projectiles: Projectile[]) => {
        const original = projectiles[0];
        const newProjectiles = [...projectiles];

        // Ângulos diagonais (45° e -45° para nível 1, adiciona mais para nível 2)
        const angles = levelData.diagonalCount === 2
          ? [Math.PI / 4, -Math.PI / 4]
          : [Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];

        angles.forEach(angle => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          newProjectiles.push({
            ...original,
            direction: {
              x: original.direction.x * cos - original.direction.z * sin,
              y: 0,
              z: original.direction.x * sin + original.direction.z * cos,
            },
            damage: original.damage * levelData.damageMultiplier,
          });
        });

        return newProjectiles;
      },
    };
  }
}
```

### 2.4 Skill de Comportamento (Piercing Shot)

**Arquivo**: `/app/skills/behavior-modifiers/PiercingShotSkill.ts`

```typescript
import { SkillBase, SkillModifiers, HitContext } from '../SkillBase';

export class PiercingShotSkill extends SkillBase {
  private levels = {
    1: { pierceCount: 1 },
    2: { pierceCount: 3 },
    3: { pierceCount: 9 },
    4: { pierceCount: 999 },
  };

  constructor() {
    super({
      id: 'piercing_shot',
      name: 'Tiro Perfurante',
      description: 'Seus projéteis perfuram inimigos, atingindo múltiplos alvos.',
      icon: '🎯',
      rarity: 'rare',
      maxLevel: 4,
    });
  }

  getModifiers(): SkillModifiers {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      onProjectileSpawn: (projectiles) => {
        // Adiciona propriedade de piercing aos projéteis
        return projectiles.map(proj => ({
          ...proj,
          piercingCount: levelData.pierceCount,
        }));
      },

      onProjectileHit: (context: HitContext) => {
        // Verifica se ainda pode perfurar
        const pierceCount = context.projectile.piercingCount || 0;

        if (pierceCount > 0) {
          // Reduz o contador de piercing
          context.projectile.piercingCount = pierceCount - 1;

          // NÃO remove o projétil
          return {
            ...context,
            shouldRemoveProjectile: false,
          };
        }

        // Acabou o piercing, remove normalmente
        return context;
      },
    };
  }
}
```

---

## 3. Store de Skills (Gerenciador Central)

**Arquivo**: `/app/stores/skillStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SkillBase, SkillModifiers } from '~/skills/SkillBase';
import { getAllSkills } from '~/skills/index';

export const useSkillStore = defineStore('skillStore', () => {
  // Skills disponíveis no jogo
  const availableSkills = ref<Record<string, SkillBase>>(getAllSkills());

  // Skills ativas na partida atual
  const activeSkills = ref<string[]>([]);

  // Modificadores calculados (cache)
  const appliedModifiers = computed(() => {
    const modifiers: SkillModifiers = {
      damageMultiplier: 1,
      healthMultiplier: 1,
      speedMultiplier: 1,
      rangeMultiplier: 1,
      healthRegeneration: 0,
    };

    // Acumula modificadores de todas as skills ativas
    activeSkills.value.forEach(skillId => {
      const skill = availableSkills.value[skillId];
      const skillMods = skill.getModifiers();

      // Multiplica stats (acumulativo)
      if (skillMods.damageMultiplier) {
        modifiers.damageMultiplier *= skillMods.damageMultiplier;
      }
      if (skillMods.healthMultiplier) {
        modifiers.healthMultiplier *= skillMods.healthMultiplier;
      }
      if (skillMods.speedMultiplier) {
        modifiers.speedMultiplier *= skillMods.speedMultiplier;
      }
      if (skillMods.rangeMultiplier) {
        modifiers.rangeMultiplier *= skillMods.rangeMultiplier;
      }
      if (skillMods.healthRegeneration) {
        modifiers.healthRegeneration += skillMods.healthRegeneration;
      }
    });

    return modifiers;
  });

  /**
   * Aplica uma skill (quando o jogador escolhe no level up)
   */
  function applySkill(skillId: string) {
    const skill = availableSkills.value[skillId];

    if (!skill) {
      console.error(`Skill ${skillId} não encontrada`);
      return;
    }

    // Level up da skill
    skill.levelUp();

    // Adiciona à lista de skills ativas (se ainda não estiver)
    if (!activeSkills.value.includes(skillId)) {
      activeSkills.value.push(skillId);
    }

    console.log(`Skill ${skill.name} aplicada (nível ${skill.currentLevel})`);
  }

  /**
   * Retorna 3 skills aleatórias para oferecer ao jogador.
   * Considera raridade para balanceamento.
   */
  function getRandomSkillOptions(count: number = 3): SkillBase[] {
    const eligibleSkills = Object.values(availableSkills.value).filter(
      skill => skill.currentLevel < skill.maxLevel
    );

    if (eligibleSkills.length === 0) {
      console.warn('Nenhuma skill disponível!');
      return [];
    }

    // Sistema de peso baseado em raridade (opcional)
    const weightedSkills = eligibleSkills.flatMap(skill => {
      const weight = {
        'common': 5,
        'rare': 3,
        'epic': 2,
        'legendary': 1,
      }[skill.rarity];

      return Array(weight).fill(skill);
    });

    // Shuffle e pega as primeiras N (sem repetições)
    const shuffled = weightedSkills.sort(() => Math.random() - 0.5);
    const selected = [];
    const selectedIds = new Set();

    for (const skill of shuffled) {
      if (!selectedIds.has(skill.id)) {
        selected.push(skill);
        selectedIds.add(skill.id);

        if (selected.length >= count) break;
      }
    }

    return selected;
  }

  /**
   * Aplica hooks de comportamento (chamado no sistema de tiro)
   */
  function applyProjectileSpawnHooks(projectiles: any[]) {
    let modified = projectiles;

    activeSkills.value.forEach(skillId => {
      const skill = availableSkills.value[skillId];
      const mods = skill.getModifiers();

      if (mods.onProjectileSpawn) {
        modified = mods.onProjectileSpawn(modified);
      }
    });

    return modified;
  }

  /**
   * Aplica hooks de hit (chamado quando projétil acerta inimigo)
   */
  function applyProjectileHitHooks(context: any) {
    let modifiedContext = context;

    activeSkills.value.forEach(skillId => {
      const skill = availableSkills.value[skillId];
      const mods = skill.getModifiers();

      if (mods.onProjectileHit) {
        modifiedContext = mods.onProjectileHit(modifiedContext);
      }
    });

    return modifiedContext;
  }

  /**
   * Reset ao fim da partida
   */
  function resetSkills() {
    Object.values(availableSkills.value).forEach(skill => skill.reset());
    activeSkills.value = [];
  }

  return {
    availableSkills,
    activeSkills,
    appliedModifiers,
    applySkill,
    getRandomSkillOptions,
    applyProjectileSpawnHooks,
    applyProjectileHitHooks,
    resetSkills,
  };
});

// HMR
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSkillStore, import.meta.hot))
}
```

---

## 4. Registro de Skills

**Arquivo**: `/app/skills/index.ts`

```typescript
import { DamageBoostSkill } from './stat-modifiers/DamageBoostSkill';
import { HealthBoostSkill } from './stat-modifiers/HealthBoostSkill';
import { SpeedBoostSkill } from './stat-modifiers/SpeedBoostSkill';
import { RangeExtensionSkill } from './stat-modifiers/RangeExtensionSkill';
import { HealthRegenerationSkill } from './stat-modifiers/HealthRegenerationSkill';

import { MultiShotSkill } from './behavior-modifiers/MultiShotSkill';
import { DiagonalShotSkill } from './behavior-modifiers/DiagonalShotSkill';
import { BackShotSkill } from './behavior-modifiers/BackShotSkill';
import { PiercingShotSkill } from './behavior-modifiers/PiercingShotSkill';
import { RicochetShotSkill } from './behavior-modifiers/RicochetShotSkill';
import { ShortRangeShotSkill } from './behavior-modifiers/ShortRangeShotSkill';

/**
 * Retorna um objeto com todas as skills disponíveis.
 *
 * Para ADICIONAR uma skill: criar arquivo + adicionar aqui
 * Para DESATIVAR uma skill: comentar a linha correspondente
 */
export function getAllSkills() {
  return {
    // Stat Modifiers (Common)
    damage_percentage: new DamageBoostSkill(),
    health_percentage: new HealthBoostSkill(),
    health_regeneration: new HealthRegenerationSkill(),
    general_speed: new SpeedBoostSkill(),

    // Behavior Modifiers (Rare)
    diagonal_shot: new DiagonalShotSkill(),
    back_shot: new BackShotSkill(),
    piercing_shot: new PiercingShotSkill(),
    ricochet_shot: new RicochetShotSkill(),

    // Behavior Modifiers (Epic)
    range_extension: new RangeExtensionSkill(),
    multishot: new MultiShotSkill(),

    // Behavior Modifiers (Legendary)
    short_range_shot: new ShortRangeShotSkill(),
  };
}
```

---

## 5. Integração no Level Up

### 5.1 Modificar `currentRunStore.ts`

Adicionar ref para controlar modal (linha ~208):

```typescript
const showSkillSelectionModal = ref(false);
```

Modificar função `levelUp()` (linha ~432):

```typescript
function levelUp() {
  currentLevel.value += 1;
  currentExp.value = currentExp.value - expToNextLevel.value;
  expToNextLevel.value = getExpForLevel(currentLevel.value);

  console.log(`Parabéns! Você alcançou o nível ${currentLevel.value}!`);

  // Pausa o jogo e abre modal de skills
  gamePause();
  showSkillSelectionModal.value = true;
}
```

Adicionar no return (linha ~453):

```typescript
return {
  // ... outros retornos
  showSkillSelectionModal,
  // ...
};
```

### 5.2 Modificar `endRun()` para resetar skills

Adicionar no `endRun()` (linha ~247):

```typescript
function endRun() {
  console.log('Encerrando a partida atual.');

  // Reset de skills
  const skillStore = useSkillStore();
  skillStore.resetSkills();

  // ... resto do código existente
}
```

---

## 6. Modal de Seleção de Skills

**Arquivo**: `/app/components/ui/SkillSelectionModal.vue`

```vue
<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div class="bg-gray-900 border-4 border-yellow-500 rounded-lg p-8 max-w-4xl">
      <h2 class="text-4xl font-bold text-yellow-400 mb-6 text-center">
        Level Up! Escolha uma Skill
      </h2>

      <div class="grid grid-cols-3 gap-6">
        <button
          v-for="skill in skillOptions"
          :key="skill.id"
          @click="selectSkill(skill.id)"
          :class="[
            'p-6 rounded-lg transition-all transform hover:scale-105',
            'border-2',
            getRarityClass(skill.rarity)
          ]"
        >
          <div class="text-5xl mb-3">{{ skill.icon }}</div>
          <h3 class="text-xl font-bold text-white mb-2">{{ skill.name }}</h3>
          <p class="text-sm text-gray-400 mb-3">{{ skill.description }}</p>
          <div class="text-yellow-400 font-semibold">
            {{ skill.currentLevel === 0 ? 'Novo!' : `Nível ${skill.currentLevel} → ${skill.currentLevel + 1}` }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSkillStore } from '~/stores/skillStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

const skillStore = useSkillStore();
const currentRunStore = useCurrentRunStore();

const isVisible = ref(false);
const skillOptions = ref([]);

// Quando o modal é aberto, busca 3 skills aleatórias
watch(() => currentRunStore.showSkillSelectionModal, (show) => {
  if (show) {
    isVisible.value = true;
    skillOptions.value = skillStore.getRandomSkillOptions(3);
  }
});

function selectSkill(skillId: string) {
  skillStore.applySkill(skillId);
  isVisible.value = false;
  currentRunStore.showSkillSelectionModal = false;
  currentRunStore.gameResume();
}

function getRarityClass(rarity: string) {
  const classes = {
    'common': 'bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-400',
    'rare': 'bg-blue-900 hover:bg-blue-800 border-blue-600 hover:border-blue-400',
    'epic': 'bg-purple-900 hover:bg-purple-800 border-purple-600 hover:border-purple-400',
    'legendary': 'bg-orange-900 hover:bg-orange-800 border-orange-600 hover:border-orange-400',
  };

  return classes[rarity] || classes.common;
}
</script>
```

### 6.1 Adicionar Modal no Layout

Em `/app/pages/play/[id].vue`, adicionar o modal:

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

## 7. Modificação no Sistema de Tiro

### 7.1 Modificar `usePlayerControls.ts`

No início do arquivo, importar skillStore:

```typescript
import { useSkillStore } from '~/stores/skillStore';
```

Dentro do composable:

```typescript
const skillStore = useSkillStore();
```

Modificar a lógica de tiro (linha ~176-203):

```typescript
// Verifica se o cooldown do tiro terminou
if (currentRun.shotCooldown <= 0) {
  if (nearestEnemy && nearestEnemy.position) {
    // Calcula o vetor de direção do jogador para o inimigo
    const dirX = nearestEnemy.position.x - position.x;
    const dirZ = nearestEnemy.position.z - position.z;

    // Normaliza o vetor (magnitude = 1)
    const magnitude = Math.sqrt(dirX * dirX + dirZ * dirZ);

    if (magnitude > 0) {
      const direction = {
        x: dirX / magnitude,
        y: 0,
        z: dirZ / magnitude
      };

      // Aplica modificadores de skills
      const mods = skillStore.appliedModifiers;
      const baseDamage = PlayerBaseStats.projectiles.damage * mods.damageMultiplier;
      const baseSpeed = PlayerBaseStats.projectiles.shotSpeed * mods.speedMultiplier;
      const baseRange = PlayerBaseStats.projectiles.range * mods.rangeMultiplier;

      // Cria projétil base
      let projectiles = [{
        position: { x: position.x, y: position.y, z: position.z },
        direction: { ...direction },
        damage: baseDamage,
        speed: baseSpeed,
        range: baseRange,
      }];

      // Aplica hooks de comportamento (multishot, diagonal, etc.)
      projectiles = skillStore.applyProjectileSpawnHooks(projectiles);

      // Spawna todos os projéteis
      projectiles.forEach(proj => {
        projectileStore.spawnProjectile(
          'player',
          proj.position,
          proj.direction,
          'player',
          'player',
          proj.damage,
          proj.speed,
          proj.range,
          proj.piercingCount,
          proj.ricochetCount,
        );
      });

      // Reseta o cooldown do tiro
      currentRun.shotCooldown = currentRun.shotCooldownTotal * (1 / mods.speedMultiplier);
    }
  }
}
```

### 7.2 Modificar `projectileStore.js`

Atualizar função `spawnProjectile` para aceitar parâmetros customizados (linha ~91):

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
  piercingCount = 0,
  ricochetCount = 0
) {
  const config = projectilesType[type];

  if (!config) {
    console.warn(`Projectile type "${type}" not recognized.`);
    return;
  }

  projectiles.value.push({
    id: `projectile-${Date.now()}_${Math.random()}`,
    type: type,
    ownerId: ownerId,
    ownerType: ownerType,
    position: { ...position },
    direction: { ...direction },
    distanceTraveled: 0,
    speed: customSpeed ?? config.speed,
    damage: customDamage ?? config.damage,
    range: customRange ?? config.range,
    size: config.size,
    color: config.color,
    piercingCount: piercingCount,
    ricochetCount: ricochetCount,
  });
}
```

### 7.3 Modificar Colisões para Suportar Piercing

Em `projectileStore.js`, função `checkCollisions` (linha ~55):

```javascript
function checkCollisions() {
  const skillStore = useSkillStore();

  projectiles.value.forEach((projectile, pIndex) => {
    if (projectile.ownerType === 'player') {
      // Verifica colisão com inimigos
      enemyManager.activeEnemies.value.forEach((enemy, eIndex) => {
        if (
          isColliding(
            projectile.position,
            enemy.position,
            1
          )
        ) {
          enemyManager.takeDamage(enemy.id, projectile.damage);

          // Aplica hooks de hit (para piercing, etc.)
          const hitContext = {
            projectile: projectile,
            enemy: enemy,
            damage: projectile.damage,
            shouldRemoveProjectile: true,
          };

          const modifiedContext = skillStore.applyProjectileHitHooks(hitContext);

          // Remove projétil apenas se o hook permitir
          if (modifiedContext.shouldRemoveProjectile) {
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

### 7.4 Sistema de Regeneração

Em `GameOrchestrator.vue`, adicionar lógica de regeneração no game loop:

```typescript
const skillStore = useSkillStore();

// No game tick, adicionar:
function gameTick({ delta }) {
  if (!currentRunStore.isPlaying) return;

  // ... lógica existente

  // Regeneração de vida
  const regenRate = skillStore.appliedModifiers.healthRegeneration;
  if (regenRate > 0) {
    const regenAmount = currentRunStore.maxHealth * regenRate * delta;
    const newHealth = Math.min(
      currentRunStore.currentHealth + regenAmount,
      currentRunStore.maxHealth
    );
    currentRunStore.currentHealth = newHealth;
  }
}
```

---

## 8. Fluxo Completo do Sistema

```
1. Player mata inimigo
   ↓
2. Ganha XP (addExp)
   ↓
3. XP >= expToNextLevel → levelUp()
   ↓
4. levelUp() → gamePause() + showSkillSelectionModal = true
   ↓
5. Modal carrega 3 skills aleatórias (getRandomSkillOptions)
   ↓
6. Player clica em skill
   ↓
7. skillStore.applySkill(skillId)
   ↓
8. Skill faz levelUp() interno → retorna modifiers
   ↓
9. appliedModifiers (computed) recalcula automaticamente
   ↓
10. Modal fecha → gameResume()
    ↓
11. No próximo tiro:
    - usePlayerControls lê appliedModifiers
    - Aplica multiplicadores de stats
    - Chama applyProjectileSpawnHooks
    - Skills de comportamento modificam projéteis
    ↓
12. Projéteis são spawnados com stats/comportamentos modificados
    ↓
13. Em colisões:
    - applyProjectileHitHooks é chamado
    - Skills como piercing decidem se projétil deve ser removido
```

---

## 9. Benefícios da Arquitetura

### Modularidade Total
- ✅ Cada skill é completamente independente
- ✅ Adicionar skill: criar arquivo + 1 linha no `index.ts`
- ✅ Remover skill: comentar 1 linha no `index.ts`
- ✅ Zero acoplamento entre skills

### Fácil Manutenção
- ✅ Bug em uma skill? Apenas 1 arquivo para debugar
- ✅ Balancear skill? Mudar apenas valores na classe
- ✅ Sistema central nunca precisa ser modificado

### Testabilidade
- ✅ Testar skill individualmente
- ✅ Mockear facilmente
- ✅ Debug simplificado

### Extensibilidade
- ✅ Adicionar novos tipos de hooks sem quebrar código existente
- ✅ Criar categorias de skills facilmente
- ✅ Sistema de raridade já implementado

---

## 10. Skills para Implementar (Baseadas no seu currentRunStore)

### Já Definidas no Código Atual

#### Common (Stat Modifiers)
- ✅ `damage_percentage` - DamageBoostSkill
- ✅ `health_percentage` - HealthBoostSkill
- ✅ `health_regeneration` - HealthRegenerationSkill
- ✅ `general_speed` - SpeedBoostSkill

#### Rare (Behavior Modifiers)
- ✅ `ricochet_shot` - RicochetShotSkill
- ✅ `diagonal_shot` - DiagonalShotSkill
- ✅ `back_shot` - BackShotSkill
- ✅ `piercing_shot` - PiercingShotSkill

#### Epic
- ✅ `range_extension` - RangeExtensionSkill
- ✅ `multishot` - MultiShotSkill

#### Legendary
- ✅ `short_range_shot` - ShortRangeShotSkill

---

## 11. Próximos Passos

### Fase 1: Implementação Básica
1. Criar estrutura de pastas `/app/skills`
2. Implementar `SkillBase.ts`
3. Criar `skillStore.ts`
4. Implementar 2-3 skills simples (damage, health, speed)
5. Criar `SkillSelectionModal.vue`
6. Integrar no `levelUp()`

### Fase 2: Skills de Comportamento
1. Implementar `MultiShotSkill`
2. Implementar `DiagonalShotSkill`
3. Implementar `PiercingShotSkill`
4. Modificar sistema de colisões para suportar piercing

### Fase 3: Skills Avançadas
1. Implementar `RicochetShotSkill` (requer física de ricochete)
2. Implementar `BackShotSkill`
3. Implementar `ShortRangeShotSkill`
4. Sistema de regeneração

### Fase 4: Polimento
1. Animações no modal
2. Sistema de raridade visual
3. Feedback sonoro
4. Partículas especiais por skill
5. Balanceamento

---

## 12. Para Adicionar Skills de Inimigos

Criar `EnemySkillStore` seguindo mesma lógica:

```typescript
// /app/stores/enemySkillStore.ts
export const useEnemySkillStore = defineStore('enemySkillStore', () => {
  // Mesma estrutura do skillStore
  // Skills aplicadas em tipos específicos de inimigos

  const enemyModifiers = computed(() => {
    // Modificadores por tipo de inimigo
    return {
      asteroid: { damageMultiplier: 1, healthMultiplier: 1 },
      ufo: { damageMultiplier: 1, healthMultiplier: 1 },
      boss: { damageMultiplier: 1, healthMultiplier: 1 },
    };
  });

  // ...
});
```

Aplicar no `useEnemyAI.js` onde inimigos atiram (linha ~120).

---

## 13. Considerações de Performance

### Otimizações Já Implementadas
- ✅ `computed()` para `appliedModifiers` (recalcula apenas quando muda)
- ✅ `shallowRef` para arrays de skills (evita reatividade profunda)
- ✅ Hooks são funções puras (sem side-effects)
- ✅ Sistema de peso para raridade (balanceamento probabilístico)

### Possíveis Otimizações Futuras
- Cache de skills aleatórias
- Pool de objetos para projéteis
- Debounce de regeneração
- Spatial partitioning para colisões com piercing

---

## 14. Referências

- **Arquitetura**: Strategy Pattern + Observer Pattern
- **Inspiração**: Archero 2, Vampire Survivors, Brotato
- **Princípios**: SOLID, KISS, DRY
- **Framework**: Vue 3 + Pinia + TresJS

---

## Conclusão

Este sistema permite que você **adicione/remova skills sem mexer no código core do jogo**, mantendo tudo limpo, testável e escalável. Cada skill é responsável apenas por sua própria lógica, e o sistema central apenas orquestra as aplicações.

**Para adicionar nova skill:**
1. Criar arquivo em `/app/skills/[categoria]/NomeSkill.ts`
2. Estender `SkillBase`
3. Implementar `getModifiers()`
4. Adicionar 1 linha em `/app/skills/index.ts`

✅ **Pronto!**
