# Sistema de Inimigos Modular

Este diretório contém os componentes visuais dos inimigos do jogo. Cada tipo de geometria tem seu próprio componente.

## Estrutura Atual

```
enemies/
├── EnemySquare.vue         # Inimigos com forma de cubo (UFOs, Bosses)
├── EnemyCone.vue           # Inimigos com forma de cone (Kamikazes)
├── EnemyDodecahedron.vue   # Inimigos com forma de dodecaedro (Asteroids)
└── README.md               # Este arquivo
```

## Como Adicionar um Novo Tipo de Inimigo

### Passo 1: Criar o Componente Visual

Crie um novo arquivo na pasta `enemies/`, por exemplo `EnemySphere.vue`:

```vue
<script setup lang="js">
defineProps({
  enemy: {
    type: Object,
    required: true
  },
  baseStats: {
    type: Object,
    required: true
  },
  setVisualMeshRef: {
    type: Function,
    required: true
  }
});
</script>

<template>
  <TresMesh
    :ref="setVisualMeshRef(enemy.id)"
    :name="`enemy-visual-${enemy.id}`"
  >
    <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
    <TresSphereGeometry
      :args="[baseStats[enemy.type].size * 0.5, 32, 32]"
    />
  </TresMesh>
</template>
```

### Passo 2: Registrar no EnemyManager

Abra `components/game/EnemyManager.vue` e:

1. Importe o novo componente:
```js
import EnemySphere from '~/components/game/enemies/EnemySphere.vue';
```

2. Adicione ao mapeamento `enemyComponents`:
```js
const enemyComponents = {
  square: EnemySquare,
  cone: EnemyCone,
  dodecahedron: EnemyDodecahedron,
  sphere: EnemySphere, // ← Adicione aqui
};
```

### Passo 3: Adicionar nas Estatísticas Base

Abra `composables/useEnemyManager.js` e adicione as stats do novo inimigo em `baseStats`:

```js
export const baseStats = {
  // ... outros inimigos
  sphereEnemy: {
    color: 'cyan',
    shape: 'sphere', // ← Use o mesmo nome do mapeamento
    speed: 2.5,
    health: 100,
    onHitDamage: 150,
    size: 1.2,
    deathSound: 'hit-hard3',
    hitSound: 'hit-soft2',
    drops: {
      exp: {min: 80, max: 120},
      gold: {min: 10, max: 20}
    }
  }
};
```

### Passo 4: Spawnar o Inimigo

Agora você pode spawnar o novo inimigo usando:

```js
enemyManager.spawnEnemy('sphereEnemy', position);
```

## Personalizações Avançadas

### Adicionar Animações Customizadas

Você pode adicionar animações específicas para cada tipo de inimigo:

```vue
<script setup lang="js">
import { useLoop } from '@tresjs/core';

const props = defineProps({
  enemy: Object,
  baseStats: Object,
  setVisualMeshRef: Function
});

const meshRef = ref(null);

// Animação customizada para este tipo de inimigo
const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (meshRef.value) {
    // Exemplo: rotação contínua
    meshRef.value.rotation.x += 0.01;
    meshRef.value.rotation.y += 0.02;
  }
});
</script>

<template>
  <TresMesh
    ref="meshRef"
    :ref="setVisualMeshRef(enemy.id)"
    :name="`enemy-visual-${enemy.id}`"
  >
    <!-- ... -->
  </TresMesh>
</template>
```

### Adicionar Efeitos Visuais

Você pode adicionar partículas, trails, ou qualquer efeito visual específico:

```vue
<template>
  <TresGroup>
    <!-- Mesh principal -->
    <TresMesh
      :ref="setVisualMeshRef(enemy.id)"
      :name="`enemy-visual-${enemy.id}`"
    >
      <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
      <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.5, 32, 32]" />
    </TresMesh>

    <!-- Efeito de aura/glow -->
    <TresMesh>
      <TresMeshBasicMaterial
        color="cyan"
        :transparent="true"
        :opacity="0.3"
      />
      <TresSphereGeometry :args="[baseStats[enemy.type].size * 0.6, 16, 16]" />
    </TresMesh>
  </TresGroup>
</template>
```

## Tipos de Geometria Disponíveis no TresJS

- `TresBoxGeometry` - Cubo
- `TresSphereGeometry` - Esfera
- `TresConeGeometry` - Cone
- `TresCylinderGeometry` - Cilindro
- `TresDodecahedronGeometry` - Dodecaedro (12 faces)
- `TresIcosahedronGeometry` - Icosaedro (20 faces)
- `TresTorusGeometry` - Torus (donut)
- `TresOctahedronGeometry` - Octaedro (8 faces)
- E muitos outros! Veja a [documentação do Three.js](https://threejs.org/docs/#api/en/geometries/BoxGeometry)

## Dicas

1. **Mantenha a estrutura simples**: Cada componente deve focar apenas na renderização visual
2. **Use props corretamente**: Sempre receba `enemy`, `baseStats`, e `setVisualMeshRef`
3. **Performance**: Evite operações pesadas no loop de renderização
4. **Nomenclatura**: Use o padrão `Enemy[Shape].vue` para facilitar identificação
