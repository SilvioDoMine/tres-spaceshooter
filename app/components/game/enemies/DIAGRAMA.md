# 🔗 Diagrama de Conexão - Sistema de Inimigos

## Como os Arquivos se Conectam

```
┌─────────────────────────────────────────────────────────────┐
│  1. COMPONENTES VISUAIS (*.vue)                            │
│     components/game/enemies/                               │
├─────────────────────────────────────────────────────────────┤
│  EnemySphere.vue          ← Define COMO renderizar         │
│  EnemyTorus.vue           ← Define COMO renderizar         │
│  EnemyComposite.vue       ← Define COMO renderizar         │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ Registrado em
                            │
┌─────────────────────────────────────────────────────────────┐
│  2. MAPEAMENTO (EnemyManager.vue)                          │
│     components/game/EnemyManager.vue                       │
├─────────────────────────────────────────────────────────────┤
│  const enemyComponents = {                                 │
│    sphere: EnemySphere,        ← Shape name → Component    │
│    torus: EnemyTorus,          ← Shape name → Component    │
│    composite: EnemyComposite,  ← Shape name → Component    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ Usa o shape para buscar componente
                            │
┌─────────────────────────────────────────────────────────────┐
│  3. STATS DOS INIMIGOS (useEnemyManager.js)                │
│     composables/useEnemyManager.js                         │
├─────────────────────────────────────────────────────────────┤
│  sphereEnemy: {            ← ID para spawnar               │
│    shape: 'sphere',        ← Conecta ao mapeamento         │
│    color: 'cyan',          ← Propriedades visuais          │
│    health: 100,            ← Stats do inimigo              │
│    ...                                                      │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ Usado para spawnar
                            │
┌─────────────────────────────────────────────────────────────┐
│  4. SPAWN NO JOGO                                          │
│     Qualquer lugar do código                               │
├─────────────────────────────────────────────────────────────┤
│  enemyManager.spawnEnemy('sphereEnemy', position)          │
│                           └─ ID do baseStats               │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Exemplo Concreto: sphereEnemy

Vamos seguir o fluxo completo de um inimigo:

### 1️⃣ Você cria o componente visual

**Arquivo:** `components/game/enemies/EnemySphere.vue`

```vue
<template>
  <TresMesh :ref="setVisualMeshRef(enemy.id)">
    <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
    <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.5]" />
  </TresMesh>
</template>
```

**O que faz:** Renderiza uma esfera 3D com a cor e tamanho das stats

---

### 2️⃣ Você registra no mapeamento

**Arquivo:** `components/game/EnemyManager.vue`

```js
import EnemySphere from '~/components/game/enemies/EnemySphere.vue';

const enemyComponents = {
  sphere: EnemySphere,  // ← Nome 'sphere' conecta ao shape
}
```

**O que faz:** Diz "quando o shape for 'sphere', use o componente EnemySphere"

---

### 3️⃣ Você cria as stats

**Arquivo:** `composables/useEnemyManager.js`

```js
export const baseStats = {
  sphereEnemy: {           // ← ID único do inimigo
    shape: 'sphere',       // ← Conecta ao mapeamento acima
    color: 'cyan',         // ← Cor que será passada pro componente
    health: 100,
    size: 1.2,
    // ... outras stats
  }
}
```

**O que faz:** Define todas as propriedades do inimigo

---

### 4️⃣ Você spawna no jogo

**Em qualquer lugar do código:**

```js
enemyManager.spawnEnemy('sphereEnemy', { x: 0, y: 0, z: -10 });
//                       └─ Usa o ID do baseStats
```

**O que acontece:**
1. Busca `baseStats.sphereEnemy` → encontra `shape: 'sphere'`
2. Busca `enemyComponents['sphere']` → encontra `EnemySphere`
3. Renderiza o componente `EnemySphere` com as stats

---

## 📋 Checklist: Adicionar um Novo Inimigo

Vamos adicionar um inimigo "alienShip":

### ✅ Passo 1: Criar componente visual
```bash
# Criar arquivo
touch app/components/game/enemies/EnemyOctahedron.vue
```

```vue
<template>
  <TresMesh :ref="setVisualMeshRef(enemy.id)">
    <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
    <TresOctahedronGeometry :args="[baseStats[enemy.type].size * 0.6]" />
  </TresMesh>
</template>
```

### ✅ Passo 2: Importar e registrar no EnemyManager.vue
```js
import EnemyOctahedron from '~/components/game/enemies/EnemyOctahedron.vue';

const enemyComponents = {
  // ... existentes
  octahedron: EnemyOctahedron,  // ← Nome do shape
}
```

### ✅ Passo 3: Criar stats no useEnemyManager.js
```js
export const baseStats = {
  // ... existentes
  alienShip: {                  // ← ID para spawnar
    shape: 'octahedron',        // ← Conecta ao mapeamento
    color: 'lime',
    health: 180,
    speed: 3.0,
    onHitDamage: 200,
    size: 1.4,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: {min: 120, max: 180},
      gold: {min: 20, max: 35}
    }
  }
}
```

### ✅ Passo 4: Spawnar no jogo
```js
enemyManager.spawnEnemy('alienShip', position);
//                       └─ ID do baseStats
```

---

## 🔍 Diferenças Importantes

### ID do Inimigo vs Shape

```js
// ❌ ERRADO: Usar o mesmo nome para tudo
myEnemy: {
  shape: 'myEnemy',  // Não faça isso
  // ...
}

// ✅ CORRETO: Separar responsabilidades
myFastUFO: {         // ← ID descritivo (qualquer nome)
  shape: 'square',   // ← Tipo de geometria (registrado no mapeamento)
  color: 'red',      // ← Customização
  speed: 5.0,        // ← Stats específicas
  // ...
}

mySlowUFO: {
  shape: 'square',   // ← Mesma geometria
  color: 'blue',     // ← Cor diferente
  speed: 1.5,        // ← Velocidade diferente
  // ...
}
```

### Múltiplos Inimigos, Mesmo Componente

Você pode ter vários tipos de inimigos usando o mesmo componente visual:

```js
// Todos usam EnemySquare (cubo)
ufo: { shape: 'square', color: 'green', health: 120, ... }
fastUfo: { shape: 'square', color: 'hotpink', health: 180, ... }
miniboss: { shape: 'square', color: 'green', health: 600, size: 3, ... }
boss: { shape: 'square', color: 'hotpink', health: 1200, size: 3, ... }
```

Todos renderizam um cubo, mas com cores, tamanhos e stats diferentes!

---

## 🎨 Fluxo de Dados Visual

```
SPAWN
  │
  ├─→ Pega o ID ('sphereEnemy')
  │
  ├─→ Busca em baseStats
  │    └─→ Encontra: { shape: 'sphere', color: 'cyan', health: 100, ... }
  │
  ├─→ Usa o 'shape' pra buscar componente
  │    └─→ enemyComponents['sphere'] = EnemySphere
  │
  └─→ Renderiza EnemySphere com as props:
       ├─→ enemy: { id: 1, type: 'sphereEnemy', health: 100, ... }
       ├─→ baseStats: { sphereEnemy: { color: 'cyan', size: 1.2, ... } }
       └─→ setVisualMeshRef: function()

RESULTADO: Esfera cyan de tamanho 1.2 com 100 HP aparece no jogo!
```

---

## 💡 Dicas de Design

### Quando criar um novo componente?

**✅ Crie novo componente quando:**
- A geometria é diferente (esfera vs cubo)
- Precisa de animação customizada
- Tem múltiplas partes (composite)

**❌ Não crie novo componente quando:**
- Só muda cor/tamanho/stats
- É a mesma geometria
- A diferença é só numérica

### Exemplo prático:

```js
// ✅ BOM: Reutilizar componente
redKamikaze: { shape: 'cone', color: 'red', speed: 3.5, ... }
blueKamikaze: { shape: 'cone', color: 'blue', speed: 2.0, ... }
// Ambos usam EnemyCone

// ✅ BOM: Criar novo componente
spinningEnemy: { shape: 'torus', ... }
// Usa EnemyTorus que tem animação de rotação customizada
```

---

## 🎯 Resumo Ultra-Rápido

1. **Componente (.vue)** = APARÊNCIA (como renderizar)
2. **Mapeamento (EnemyManager.vue)** = CONEXÃO (shape → componente)
3. **baseStats (useEnemyManager.js)** = PROPRIEDADES (stats + qual shape usar)
4. **Spawn (código do jogo)** = CRIAÇÃO (criar inimigo usando ID das stats)

**Ordem de criação:**
Componente → Mapeamento → Stats → Spawn

**Nomes importantes:**
- **shape**: Liga stats ao componente (ex: 'sphere', 'cone')
- **ID do inimigo**: Nome nas stats para spawnar (ex: 'sphereEnemy', 'alienShip')
