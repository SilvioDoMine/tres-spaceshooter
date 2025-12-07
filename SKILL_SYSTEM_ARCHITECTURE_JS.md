# Sistema de Skills Modular - Arquitetura (JavaScript)

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
- Adicionar nova skill: criar arquivo + registrar em `index.js`
- Desativar skill: comentar linha no `index.js`
- Skills não se conhecem (zero acoplamento)

---

## Estrutura de Arquivos

```
/app
├── /stores
│   ├── currentRunStore.ts          # (já existe)
│   └── skillStore.js                # NOVO: Gerencia skills ativas
│
├── /composables
│   └── usePlayerControls.ts        # (já existe - será modificado)
│
├── /skills                          # NOVO: Diretório de skills
│   ├── index.js                    # Registro de todas as skills
│   ├── SkillBase.js                # Classe base
│   │
│   ├── /stat-modifiers             # Skills que modificam stats
│   │   ├── DamageBoostSkill.js
│   │   ├── HealthBoostSkill.js
│   │   ├── SpeedBoostSkill.js
│   │   ├── HealthRegenerationSkill.js
│   │   └── RangeExtensionSkill.js
│   │
│   └── /behavior-modifiers          # Skills que modificam comportamento
│       ├── MultiShotSkill.js
│       ├── DiagonalShotSkill.js
│       ├── PiercingShotSkill.js
│       ├── BackShotSkill.js
│       ├── RicochetShotSkill.js
│       └── ShortRangeShotSkill.js
│
└── /components/ui
    └── SkillSelectionModal.vue      # NOVO: Modal de seleção
```

---

## 1. Classe Base de Skills

**Arquivo**: `/app/skills/SkillBase.js`

```javascript
/**
 * Classe base para todas as skills.
 * Cada skill deve implementar o método getModifiers().
 */
export class SkillBase {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.icon = config.icon;
    this.rarity = config.rarity; // 'common', 'rare', 'epic', 'legendary'
    this.currentLevel = 0;
    this.maxLevel = config.maxLevel;
  }

  /**
   * Aplica a skill ao jogador.
   * Incrementa o nível e retorna os modificadores.
   */
  levelUp() {
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
  reset() {
    this.currentLevel = 0;
  }

  /**
   * Retorna os modificadores atuais baseado no nível.
   * Cada skill implementa sua própria lógica.
   *
   * @returns {Object} Objeto com modificadores:
   *   - damageMultiplier: number (multiplicador de dano)
   *   - healthMultiplier: number (multiplicador de vida)
   *   - speedMultiplier: number (multiplicador de velocidade)
   *   - rangeMultiplier: number (multiplicador de alcance)
   *   - healthRegeneration: number (% de regeneração por segundo)
   *   - onShoot: function (hook executado ao atirar)
   *   - onProjectileHit: function (hook executado quando projétil acerta)
   *   - onProjectileSpawn: function (hook executado ao spawnar projéteis)
   */
  getModifiers() {
    throw new Error('Método getModifiers() deve ser implementado pela subclasse');
  }
}
```

---

## 2. Exemplos de Skills

### 2.1 Skill de Stat (Damage Boost)

**Arquivo**: `/app/skills/stat-modifiers/DamageBoostSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class DamageBoostSkill extends SkillBase {
  constructor() {
    super({
      id: 'damage_percentage',
      name: 'Dano Aumentado',
      description: 'Aumenta o dano base do seu projétil.',
      icon: '⚔️',
      rarity: 'common',
      maxLevel: 5,
    });

    this.levels = {
      1: { multiplier: 1.4 },  // +40%
      2: { multiplier: 1.6 },  // +60%
      3: { multiplier: 1.8 },  // +80%
      4: { multiplier: 2.2 },  // +120%
      5: { multiplier: 3.0 },  // +200%
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      damageMultiplier: levelData.multiplier,
    };
  }
}
```

### 2.2 Skill de Stat (Health Boost)

**Arquivo**: `/app/skills/stat-modifiers/HealthBoostSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class HealthBoostSkill extends SkillBase {
  constructor() {
    super({
      id: 'health_percentage',
      name: 'Vida Aumentada',
      description: 'Aumenta sua vida máxima permanentemente.',
      icon: '❤️',
      rarity: 'common',
      maxLevel: 5,
    });

    this.levels = {
      1: { multiplier: 1.4 },  // +40%
      2: { multiplier: 1.5 },  // +50%
      3: { multiplier: 1.6 },  // +60%
      4: { multiplier: 1.7 },  // +70%
      5: { multiplier: 1.8 },  // +80%
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      healthMultiplier: levelData.multiplier,
    };
  }
}
```

### 2.3 Skill de Stat (Speed Boost)

**Arquivo**: `/app/skills/stat-modifiers/SpeedBoostSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class SpeedBoostSkill extends SkillBase {
  constructor() {
    super({
      id: 'general_speed',
      name: 'Velocidade Aumentada',
      description: 'Aumenta sua velocidade de movimento e disparo.',
      icon: '👟',
      rarity: 'common',
      maxLevel: 5,
    });

    this.levels = {
      1: { multiplier: 1.15 },  // +15%
      2: { multiplier: 1.30 },  // +30%
      3: { multiplier: 1.45 },  // +45%
      4: { multiplier: 1.60 },  // +60%
      5: { multiplier: 1.90 },  // +90%
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      speedMultiplier: levelData.multiplier,
    };
  }
}
```

### 2.4 Skill de Stat (Health Regeneration)

**Arquivo**: `/app/skills/stat-modifiers/HealthRegenerationSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class HealthRegenerationSkill extends SkillBase {
  constructor() {
    super({
      id: 'health_regeneration',
      name: 'Regeneração de Vida',
      description: 'Regenera uma porcentagem da sua vida máxima a cada segundo.',
      icon: '🩹',
      rarity: 'common',
      maxLevel: 5,
    });

    this.levels = {
      1: { regen: 0.01 },  // 1% por segundo
      2: { regen: 0.02 },  // 2% por segundo
      3: { regen: 0.03 },  // 3% por segundo
      4: { regen: 0.04 },  // 4% por segundo
      5: { regen: 0.05 },  // 5% por segundo
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      healthRegeneration: levelData.regen,
    };
  }
}
```

### 2.5 Skill de Stat (Range Extension)

**Arquivo**: `/app/skills/stat-modifiers/RangeExtensionSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class RangeExtensionSkill extends SkillBase {
  constructor() {
    super({
      id: 'range_extension',
      name: 'Alcance Estendido',
      description: 'Aumenta o alcance dos seus projéteis.',
      icon: '📏',
      rarity: 'epic',
      maxLevel: 5,
    });

    this.levels = {
      1: { multiplier: 1.5 },  // +50%
      2: { multiplier: 2.0 },  // +100%
      3: { multiplier: 2.5 },  // +150%
      4: { multiplier: 3.0 },  // +200%
      5: { multiplier: 4.0 },  // +300%
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      rangeMultiplier: levelData.multiplier,
    };
  }
}
```

### 2.6 Skill de Comportamento (Multi Shot)

**Arquivo**: `/app/skills/behavior-modifiers/MultiShotSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class MultiShotSkill extends SkillBase {
  constructor() {
    super({
      id: 'multishot',
      name: 'Tiros Múltiplos',
      description: 'Dispara projéteis adicionais com 60% da eficiência.',
      icon: '🔫',
      rarity: 'epic',
      maxLevel: 2,
    });

    this.levels = {
      1: { projectileCount: 2, damageMultiplier: 0.6 },
      2: { projectileCount: 3, damageMultiplier: 0.6 },
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      // Hook que modifica a lista de projéteis antes de spawnar
      onProjectileSpawn: (projectiles) => {
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

### 2.7 Skill de Comportamento (Tiro Diagonal)

**Arquivo**: `/app/skills/behavior-modifiers/DiagonalShotSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class DiagonalShotSkill extends SkillBase {
  constructor() {
    super({
      id: 'diagonal_shot',
      name: 'Tiros Diagonais',
      description: 'Adiciona tiros diagonais adicionais com 50% da eficiência.',
      icon: '➗',
      rarity: 'rare',
      maxLevel: 2,
    });

    this.levels = {
      1: { diagonalCount: 2, damageMultiplier: 0.5 }, // 2 diagonais
      2: { diagonalCount: 4, damageMultiplier: 0.5 }, // 4 diagonais
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      onProjectileSpawn: (projectiles) => {
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

### 2.8 Skill de Comportamento (Back Shot)

**Arquivo**: `/app/skills/behavior-modifiers/BackShotSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class BackShotSkill extends SkillBase {
  constructor() {
    super({
      id: 'back_shot',
      name: 'Tiro Traseiro',
      description: 'Adiciona um tiro para trás com 90% da eficiência.',
      icon: '🔙',
      rarity: 'rare',
      maxLevel: 1,
    });

    this.levels = {
      1: { damageMultiplier: 0.9 },
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      onProjectileSpawn: (projectiles) => {
        const original = projectiles[0];
        const newProjectiles = [...projectiles];

        // Adiciona projétil na direção oposta
        newProjectiles.push({
          ...original,
          direction: {
            x: -original.direction.x,
            y: 0,
            z: -original.direction.z,
          },
          damage: original.damage * levelData.damageMultiplier,
        });

        return newProjectiles;
      },
    };
  }
}
```

### 2.9 Skill de Comportamento (Piercing Shot)

**Arquivo**: `/app/skills/behavior-modifiers/PiercingShotSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class PiercingShotSkill extends SkillBase {
  constructor() {
    super({
      id: 'piercing_shot',
      name: 'Tiro Perfurante',
      description: 'Seus projéteis perfuram inimigos, atingindo múltiplos alvos.',
      icon: '🎯',
      rarity: 'rare',
      maxLevel: 4,
    });

    this.levels = {
      1: { pierceCount: 1 },
      2: { pierceCount: 3 },
      3: { pierceCount: 9 },
      4: { pierceCount: 999 },
    };
  }

  getModifiers() {
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

      onProjectileHit: (context) => {
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

### 2.10 Skill de Comportamento (Ricochet Shot)

**Arquivo**: `/app/skills/behavior-modifiers/RicochetShotSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class RicochetShotSkill extends SkillBase {
  constructor() {
    super({
      id: 'ricochet_shot',
      name: 'Tiro Ricochete',
      description: 'Seus projéteis ricocheteiam nas paredes com 70% da eficiência.',
      icon: '💥',
      rarity: 'rare',
      maxLevel: 5,
    });

    this.levels = {
      1: { ricochetCount: 1, damageMultiplier: 0.7 },
      2: { ricochetCount: 2, damageMultiplier: 0.7 },
      3: { ricochetCount: 3, damageMultiplier: 0.7 },
      4: { ricochetCount: 4, damageMultiplier: 0.7 },
      5: { ricochetCount: 5, damageMultiplier: 0.7 },
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      onProjectileSpawn: (projectiles) => {
        return projectiles.map(proj => ({
          ...proj,
          ricochetCount: levelData.ricochetCount,
          ricochetDamageMultiplier: levelData.damageMultiplier,
        }));
      },
    };
  }
}
```

### 2.11 Skill de Comportamento (Short Range Shot)

**Arquivo**: `/app/skills/behavior-modifiers/ShortRangeShotSkill.js`

```javascript
import { SkillBase } from '../SkillBase.js';

export class ShortRangeShotSkill extends SkillBase {
  constructor() {
    super({
      id: 'short_range_shot',
      name: 'Tiro de Curta Distância',
      description: 'Reduz alcance para corpo a corpo, mas aumenta muito dano e velocidade.',
      icon: '📌',
      rarity: 'legendary',
      maxLevel: 1,
    });

    this.levels = {
      1: {
        rangeMultiplier: 0.2,    // Reduz alcance para 20%
        damageMultiplier: 4.0,   // Aumenta dano em 300%
        speedMultiplier: 3.0,    // Aumenta velocidade de ataque em 200%
      },
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      rangeMultiplier: levelData.rangeMultiplier,
      damageMultiplier: levelData.damageMultiplier,
      speedMultiplier: levelData.speedMultiplier,
    };
  }
}
```

---

## 3. Store de Skills (Gerenciador Central)

**Arquivo**: `/app/stores/skillStore.js`

```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAllSkills } from '~/skills/index.js';

export const useSkillStore = defineStore('skillStore', () => {
  // Skills disponíveis no jogo
  const availableSkills = ref(getAllSkills());

  // Skills ativas na partida atual (IDs)
  const activeSkills = ref([]);

  // Modificadores calculados (cache)
  const appliedModifiers = computed(() => {
    const modifiers = {
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
  function applySkill(skillId) {
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
  function getRandomSkillOptions(count = 3) {
    const eligibleSkills = Object.values(availableSkills.value).filter(
      skill => skill.currentLevel < skill.maxLevel
    );

    if (eligibleSkills.length === 0) {
      console.warn('Nenhuma skill disponível!');
      return [];
    }

    // Sistema de peso baseado em raridade (opcional)
    const rarityWeights = {
      'common': 5,
      'rare': 3,
      'epic': 2,
      'legendary': 1,
    };

    const weightedSkills = eligibleSkills.flatMap(skill => {
      const weight = rarityWeights[skill.rarity] || 1;
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
   * Aplica hooks de comportamento ao spawnar projéteis
   */
  function applyProjectileSpawnHooks(projectiles) {
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
  function applyProjectileHitHooks(context) {
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

**Arquivo**: `/app/skills/index.js`

```javascript
import { DamageBoostSkill } from './stat-modifiers/DamageBoostSkill.js';
import { HealthBoostSkill } from './stat-modifiers/HealthBoostSkill.js';
import { SpeedBoostSkill } from './stat-modifiers/SpeedBoostSkill.js';
import { RangeExtensionSkill } from './stat-modifiers/RangeExtensionSkill.js';
import { HealthRegenerationSkill } from './stat-modifiers/HealthRegenerationSkill.js';

import { MultiShotSkill } from './behavior-modifiers/MultiShotSkill.js';
import { DiagonalShotSkill } from './behavior-modifiers/DiagonalShotSkill.js';
import { BackShotSkill } from './behavior-modifiers/BackShotSkill.js';
import { PiercingShotSkill } from './behavior-modifiers/PiercingShotSkill.js';
import { RicochetShotSkill } from './behavior-modifiers/RicochetShotSkill.js';
import { ShortRangeShotSkill } from './behavior-modifiers/ShortRangeShotSkill.js';

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

```javascript
const showSkillSelectionModal = ref(false);
```

Modificar função `levelUp()` (linha ~432):

```javascript
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

```javascript
return {
  // ... outros retornos
  showSkillSelectionModal,
  // ...
};
```

### 5.2 Modificar `endRun()` para resetar skills

Adicionar no `endRun()` (linha ~247):

```javascript
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

<script setup>
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

function selectSkill(skillId) {
  skillStore.applySkill(skillId);
  isVisible.value = false;
  currentRunStore.showSkillSelectionModal = false;
  currentRunStore.gameResume();
}

function getRarityClass(rarity) {
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

```javascript
import { useSkillStore } from '~/stores/skillStore';
```

Dentro do composable:

```javascript
const skillStore = useSkillStore();
```

Modificar a lógica de tiro (linha ~176-203):

```javascript
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

      // Reseta o cooldown do tiro (modificado por speed)
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

Em `projectileStore.js`, no início do arquivo:

```javascript
import { useSkillStore } from '~/stores/skillStore';
```

Modificar função `checkCollisions` (linha ~55):

```javascript
function checkCollisions() {
  const skillStore = useSkillStore();

  projectiles.value.forEach((projectile, pIndex) => {
    if (projectile.ownerType === 'player') {
      // Verifica colisão com inimigos
      enemyManager.activeEnemies.value.forEach((enemy) => {
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

```javascript
import { useSkillStore } from '~/stores/skillStore';

// No setup
const skillStore = useSkillStore();

// No gameTick
function gameTick({ delta }) {
  if (!currentRunStore.isPlaying) return;

  // ... lógica existente

  // Regeneração de vida
  const regenRate = skillStore.appliedModifiers.healthRegeneration;
  if (regenRate > 0 && currentRunStore.currentHealth < currentRunStore.maxHealth) {
    const regenAmount = currentRunStore.maxHealth * regenRate * delta;
    const newHealth = Math.min(
      currentRunStore.currentHealth + regenAmount,
      currentRunStore.maxHealth
    );
    currentRunStore.currentHealth = newHealth;
  }

  // ... resto do código
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
- ✅ Adicionar skill: criar arquivo + 1 linha no `index.js`
- ✅ Remover skill: comentar 1 linha no `index.js`
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

## 10. Exemplo de Uso Completo

### Criar Nova Skill (Exemplo: Fire Rate)

**1. Criar arquivo** `/app/skills/stat-modifiers/FireRateSkill.js`:

```javascript
import { SkillBase } from '../SkillBase.js';

export class FireRateSkill extends SkillBase {
  constructor() {
    super({
      id: 'fire_rate',
      name: 'Cadência de Fogo',
      description: 'Dispara projéteis mais rapidamente.',
      icon: '⚡',
      rarity: 'common',
      maxLevel: 5,
    });

    this.levels = {
      1: { multiplier: 1.2 },  // +20% fire rate
      2: { multiplier: 1.4 },  // +40%
      3: { multiplier: 1.6 },  // +60%
      4: { multiplier: 1.8 },  // +80%
      5: { multiplier: 2.0 },  // +100%
    };
  }

  getModifiers() {
    if (this.currentLevel === 0) return {};

    const levelData = this.levels[this.currentLevel];

    return {
      speedMultiplier: levelData.multiplier,
    };
  }
}
```

**2. Registrar em** `/app/skills/index.js`:

```javascript
import { FireRateSkill } from './stat-modifiers/FireRateSkill.js';

export function getAllSkills() {
  return {
    // ... outras skills
    fire_rate: new FireRateSkill(), // ← Adicionar apenas esta linha
  };
}
```

**3. Pronto!** A skill já está disponível no jogo.

---

## 11. Próximos Passos

### Fase 1: Implementação Básica
1. Criar estrutura de pastas `/app/skills`
2. Implementar `SkillBase.js`
3. Criar `skillStore.js`
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

Criar `enemySkillStore.js` seguindo mesma lógica:

```javascript
// /app/stores/enemySkillStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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

  return {
    enemyModifiers,
    // ...
  };
});
```

Aplicar no `useEnemyAI.js` onde inimigos atiram.

---

## 13. Considerações de Performance

### Otimizações Já Implementadas
- ✅ `computed()` para `appliedModifiers` (recalcula apenas quando muda)
- ✅ `ref` para arrays de skills (Vue 3 otimiza automaticamente)
- ✅ Hooks são funções puras (sem side-effects)
- ✅ Sistema de peso para raridade (balanceamento probabilístico)

### Possíveis Otimizações Futuras
- Cache de skills aleatórias
- Pool de objetos para projéteis
- Debounce de regeneração
- Spatial partitioning para colisões com piercing

---

## 14. Diferenças entre Versões JS e TS

### JavaScript (esta versão)
- ✅ Sem anotações de tipo
- ✅ JSDoc para documentação
- ✅ Validação em runtime quando necessário
- ✅ Mais flexível, menos verboso
- ✅ Menor curva de aprendizado

### TypeScript (versão anterior)
- ✅ Type safety em compile time
- ✅ Intellisense mais robusto
- ✅ Refatoração mais segura
- ✅ Catch de erros antes do runtime
- ✅ Melhor para projetos grandes

**Recomendação**: Use JavaScript se o resto do projeto é JS. Use TypeScript se o projeto já usa TS.

---

## 15. Referências

- **Arquitetura**: Strategy Pattern + Observer Pattern
- **Inspiração**: Archero 2, Vampire Survivors, Brotato
- **Princípios**: SOLID, KISS, DRY
- **Framework**: Vue 3 + Pinia + TresJS

---

## Conclusão

Este sistema permite que você **adicione/remova skills sem mexer no código core do jogo**, mantendo tudo limpo, testável e escalável. Cada skill é responsável apenas por sua própria lógica, e o sistema central apenas orquestra as aplicações.

**Para adicionar nova skill:**
1. Criar arquivo em `/app/skills/[categoria]/NomeSkill.js`
2. Estender `SkillBase`
3. Implementar `getModifiers()`
4. Adicionar 1 linha em `/app/skills/index.js`

✅ **Pronto!**
