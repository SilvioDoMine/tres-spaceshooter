---
  🎯 Arquitetura Proposta: Skill System Modular

  Conceito Chave: Strategy Pattern + Hook System

  A ideia é criar um sistema onde:
  1. ✅ Cada skill é independente e não conhece outras skills
  2. ✅ Skills podem ser ativadas/desativadas sem afetar o código principal
  3. ✅ Skills modificam comportamento através de hooks/eventos
  4. ✅ Sistema central gerencia aplicação/remoção de skills

  ---
  📐 Estrutura de Arquivos

  /app
  ├── /stores
  │   ├── currentRunStore.ts          # (já existe)
  │   └── skillStore.ts                # 🆕 NOVO: Gerencia skills ativas
  │
  ├── /composables
  │   └── usePlayerControls.ts        # (já existe - será modificado)
  │
  ├── /skills                          # 🆕 NOVO: Diretório de skills
  │   ├── index.ts                    # Registro de todas as skills
  │   ├── SkillBase.ts                # Classe base abstrata
  │   │
  │   ├── /stat-modifiers             # Skills que modificam stats
  │   │   ├── DamageBoostSkill.ts
  │   │   ├── HealthBoostSkill.ts
  │   │   └── SpeedBoostSkill.ts
  │   │
  │   └── /behavior-modifiers          # Skills que modificam comportamento
  │       ├── MultiShotSkill.ts
  │       ├── DiagonalShotSkill.ts
  │       ├── PiercingShotSkill.ts
  │       └── BackShotSkill.ts
  │
  └── /components/ui
      └── SkillSelectionModal.vue      # 🆕 NOVO: Modal de seleção

  ---
  🔧 1. Classe Base de Skills

  /app/skills/SkillBase.ts

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
  }

  ---
  🎨 2. Exemplo: Skill de Stat (Damage Boost)

  /app/skills/stat-modifiers/DamageBoostSkill.ts

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

  ---
  🚀 3. Exemplo: Skill de Comportamento (Multi Shot)

  /app/skills/behavior-modifiers/MultiShotSkill.ts

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

  ---
  🎮 4. Store de Skills (Gerenciador Central)

  /app/stores/skillStore.ts

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
     * Retorna 3 skills aleatórias para oferecer ao jogador
     */
    function getRandomSkillOptions(count: number = 3): SkillBase[] {
      const eligibleSkills = Object.values(availableSkills.value).filter(
        skill => skill.currentLevel < skill.maxLevel
      );

      // Shuffle e pega as primeiras N
      const shuffled = eligibleSkills.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    /**
     * Aplica hooks de comportamento (chamado no sistema de tiro)
     */
    function applyShootHooks(projectiles: any[]) {
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
      applyShootHooks,
      resetSkills,
    };
  });

  ---
  🎯 5. Registro de Skills

  /app/skills/index.ts

  import { DamageBoostSkill } from './stat-modifiers/DamageBoostSkill';
  import { MultiShotSkill } from './behavior-modifiers/MultiShotSkill';
  // ... importar outras skills

  /**
   * Retorna um objeto com todas as skills disponíveis.
   * Adicionar/remover skills aqui para ativar/desativar facilmente.
   */
  export function getAllSkills() {
    return {
      damage_percentage: new DamageBoostSkill(),
      multishot: new MultiShotSkill(),
      // health_percentage: new HealthBoostSkill(),
      // diagonal_shot: new DiagonalShotSkill(),
      // piercing_shot: new PiercingShotSkill(),
      // ... adicionar mais skills conforme necessário
    };
  }

  ---
  🎬 6. Integração no Level Up

  Modificar currentRunStore.ts linha 432:

  function levelUp() {
    currentLevel.value += 1;
    currentExp.value = currentExp.value - expToNextLevel.value;
    expToNextLevel.value = getExpForLevel(currentLevel.value);

    console.log(`Parabéns! Você alcançou o nível ${currentLevel.value}!`);

    // 🆕 PAUSA O JOGO E ABRE MODAL DE SKILLS
    gamePause();
    showSkillSelectionModal.value = true; // Adicionar este ref
  }

  ---
  🖼️ 7. Modal de Seleção de Skills

  /app/components/ui/SkillSelectionModal.vue

  <template>
    <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="bg-gray-900 border-2 border-yellow-500 rounded-lg p-8 max-w-4xl">
        <h2 class="text-4xl font-bold text-yellow-400 mb-6 text-center">
          🎉 Level Up! Escolha uma Skill
        </h2>

        <div class="grid grid-cols-3 gap-6">
          <button
            v-for="skill in skillOptions"
            :key="skill.id"
            @click="selectSkill(skill.id)"
            class="p-6 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-yellow-400 rounded-lg
  transition-all"
          >
            <div class="text-5xl mb-3">{{ skill.icon }}</div>
            <h3 class="text-xl font-bold text-white mb-2">{{ skill.name }}</h3>
            <p class="text-sm text-gray-400 mb-3">{{ skill.description }}</p>
            <div class="text-yellow-400 font-semibold">
              Nível {{ skill.currentLevel }} → {{ skill.currentLevel + 1 }}
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
    currentRunStore.gameResume(); // Despausa o jogo
  }
  </script>

  ---
  🔫 8. Modificação no Sistema de Tiro

  usePlayerControls.ts linha 193 (onde chama spawnProjectile):

  // ANTES (linha 193)
  projectileStore.spawnProjectile(
    'player',
    { x: position.x, y: position.y, z: position.z },
    direction,
    'player',
    'player',
  );

  // 🆕 DEPOIS (com skills aplicadas)
  const skillStore = useSkillStore();
  const baseDamage = PlayerBaseStats.projectiles.damage * skillStore.appliedModifiers.damageMultiplier;
  const baseSpeed = PlayerBaseStats.projectiles.shotSpeed;
  const baseRange = PlayerBaseStats.projectiles.range * skillStore.appliedModifiers.rangeMultiplier;

  // Cria projétil base
  let projectiles = [{
    position: { x: position.x, y: position.y, z: position.z },
    direction: { ...direction },
    damage: baseDamage,
    speed: baseSpeed,
    range: baseRange,
  }];

  // Aplica hooks de comportamento (multishot, diagonal, etc.)
  projectiles = skillStore.applyShootHooks(projectiles);

  // Spawna todos os projéteis
  projectiles.forEach(proj => {
    projectileStore.spawnProjectile(
      'player',
      proj.position,
      proj.direction,
      'player',
      'player',
      proj.damage, // 🆕 passar damage customizado
      proj.speed,  // 🆕 passar speed customizado
      proj.range,  // 🆕 passar range customizado
    );
  });

  Modificar também projectileStore.js para aceitar parâmetros opcionais:

  function spawnProjectile(type, position, direction, ownerId, ownerType, customDamage?, customSpeed?, customRange?) {
    const config = projectilesType[type];

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
    });
  }

  ---
  ✅ Vantagens desta Arquitetura

  KISS (Keep It Simple, Stupid)

  - ✅ Cada skill é uma classe isolada
  - ✅ Sistema central é apenas um gerenciador
  - ✅ Não há lógica condicional gigante (if (hasSkill))

  DRY (Don't Repeat Yourself)

  - ✅ Classe base SkillBase evita repetição
  - ✅ Sistema de hooks reutilizável
  - ✅ Modificadores calculados automaticamente

  Modularidade

  - ✅ Adicionar nova skill: criar arquivo + registrar em index.ts
  - ✅ Desativar skill: comentar linha no index.ts
  - ✅ Skills não se conhecem (zero acoplamento)

  Testabilidade

  - ✅ Testar skill individualmente
  - ✅ Mockear facilmente no sistema
  - ✅ Debug simplificado

  ---
  🎯 Resumo do Fluxo

  1. Player mata inimigo → ganha XP
  2. XP atinge threshold → levelUp()
  3. levelUp() → pausa jogo + abre modal
  4. Modal → busca 3 skills aleatórias (skillStore.getRandomSkillOptions)
  5. Player clica em skill → skillStore.applySkill(skillId)
  6. Skill faz levelUp() interno → retorna modifiers
  7. Modal fecha → jogo despausa
  8. No próximo tiro → usePlayerControls aplica modifiers
  9. Projectiles são criados com stats modificados
  10. Skills de comportamento aplicam hooks (multishot, etc.)

  ---
  📝 Para Adicionar Skills de Inimigos

  Mesma lógica! Criar EnemySkillStore e aplicar modifiers no useEnemyAI.js onde spawnam projéteis de inimigos (linha ~120 em
   useEnemyAI.js).