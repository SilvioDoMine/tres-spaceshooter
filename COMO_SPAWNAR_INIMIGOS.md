# 🎮 Como Spawnar os Novos Inimigos

## 📋 Resumo Rápido

Os 3 novos inimigos exemplo já estão configurados e prontos para usar:

| Nome do Inimigo | ID para Spawn | Tipo Visual | Características |
|----------------|---------------|-------------|-----------------|
| **Sphere Enemy** | `sphereEnemy` | Esfera cyan | Inimigo básico esférico |
| **Torus Enemy** | `torusEnemy` | Disco laranja | Rotaciona continuamente |
| **Composite Enemy** | `compositeEnemy` | Icosaedro roxo com satélites | Visual complexo com partes orbitando |

## 🚀 Como Spawnar

### Método 1: Spawnar Manualmente (para testar)

Se você quiser testar spawnar um inimigo específico, você pode usar o console do navegador ou em qualquer código:

```js
// Acesse o enemy manager
const enemyManager = useEnemyManager();

// Spawne um inimigo em uma posição específica
enemyManager.spawnEnemy('sphereEnemy', { x: 0, y: 0, z: -10 });
enemyManager.spawnEnemy('torusEnemy', { x: 5, y: 0, z: -15 });
enemyManager.spawnEnemy('compositeEnemy', { x: -5, y: 0, z: -20 });
```

### Método 2: Adicionar em Ondas de Spawn (sistema de níveis)

Procure onde você define as ondas de spawn no seu jogo. Deve ser algo assim:

```js
// Exemplo de configuração de onda
const wave1 = [
  { type: 'asteroid', count: 5 },
  { type: 'ufo', count: 2 },
  // Adicione os novos inimigos:
  { type: 'sphereEnemy', count: 3 },
  { type: 'torusEnemy', count: 2 },
  { type: 'compositeEnemy', count: 1 },
];
```

### Método 3: Spawnar Aleatoriamente

```js
// Lista de tipos de inimigos disponíveis
const enemyTypes = [
  'asteroid',
  'ufo',
  'kamikaze',
  'sphereEnemy',    // ← Novo
  'torusEnemy',     // ← Novo
  'compositeEnemy', // ← Novo
];

// Escolhe um tipo aleatório
const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
enemyManager.spawnEnemy(randomType, position);
```

## 🔍 Onde Procurar o Sistema de Spawn

Você provavelmente tem um sistema de spawn em um desses lugares:

1. **Arquivo de níveis/ondas**: Procure por arquivos como:
   - `levelConfig.js` ou `levelConfig.ts`
   - `waves.js` ou `waveManager.js`
   - Dentro de `composables/useGameLoop.js`
   - Dentro de `stores/currentRunStore.js`

2. **Sistema de spawn automático**: Procure por:
   ```js
   // Busque por estas funções:
   spawnEnemy()
   spawnWave()
   generateEnemies()
   ```

## 📝 Exemplo Completo: Testando no Jogo

### Opção A: Teste Rápido via Console do Navegador

1. Abra o jogo no navegador
2. Pressione `F12` para abrir o DevTools
3. Vá na aba "Console"
4. Cole este código:

```js
// Pega o enemy manager
const { useEnemyManager } = await import('~/composables/useEnemyManager');
const enemyManager = useEnemyManager();

// Spawna os 3 novos inimigos
enemyManager.spawnEnemy('sphereEnemy', { x: 0, y: 0, z: -10 });
enemyManager.spawnEnemy('torusEnemy', { x: 5, y: 0, z: -15 });
enemyManager.spawnEnemy('compositeEnemy', { x: -5, y: 0, z: -20 });

console.log('✅ 3 novos inimigos spawnados!');
```

### Opção B: Criar um Botão de Teste na UI

Adicione um botão temporário na tela do jogo:

```vue
<template>
  <!-- Adicione este botão na sua UI de debug -->
  <button
    @click="spawnTestEnemies"
    class="fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded"
  >
    Spawnar Inimigos Teste
  </button>
</template>

<script setup>
import { useEnemyManager } from '~/composables/useEnemyManager';

const enemyManager = useEnemyManager();

function spawnTestEnemies() {
  enemyManager.spawnEnemy('sphereEnemy', { x: 0, y: 0, z: -10 });
  enemyManager.spawnEnemy('torusEnemy', { x: 5, y: 0, z: -15 });
  enemyManager.spawnEnemy('compositeEnemy', { x: -5, y: 0, z: -20 });
  console.log('✅ Inimigos teste spawnados!');
}
</script>
```

## 🎨 Customizando os Inimigos Exemplo

### Mudar a Cor

Edite o arquivo `composables/useEnemyManager.js`:

```js
sphereEnemy: {
  color: 'lime', // ← Mude para qualquer cor CSS
  // ... resto das stats
}
```

### Mudar o Tamanho

```js
sphereEnemy: {
  // ...
  size: 2.0, // ← Aumenta o tamanho (padrão é 1.2)
  // ...
}
```

### Mudar a Velocidade

```js
sphereEnemy: {
  // ...
  speed: 5.0, // ← Mais rápido (padrão é 2.5)
  // ...
}
```

### Mudar as Recompensas

```js
sphereEnemy: {
  // ...
  drops: {
    exp: {min: 500, max: 1000}, // ← Muito XP!
    gold: {min: 100, max: 200}   // ← Muito ouro!
  }
}
```

## 🆕 Criar Seu Próprio Inimigo Personalizado

### Passo 1: Copie um componente exemplo

```bash
cp app/components/game/enemies/EnemySphere.vue \
   app/components/game/enemies/EnemyMeuInimigo.vue
```

### Passo 2: Customize o componente

Edite `EnemyMeuInimigo.vue` e mude a geometria:

```vue
<template>
  <TresMesh
    :ref="setVisualMeshRef(enemy.id)"
    :name="`enemy-visual-${enemy.id}`"
  >
    <TresMeshStandardMaterial :color="baseStats[enemy.type].color" />
    <!-- Troque por outra geometria -->
    <TresTetrahedronGeometry :args="[baseStats[enemy.type].size]" />
  </TresMesh>
</template>
```

### Passo 3: Registre no EnemyManager.vue

```js
import EnemyMeuInimigo from '~/components/game/enemies/EnemyMeuInimigo.vue';

const enemyComponents = {
  // ... outros
  meuinimigo: EnemyMeuInimigo, // ← Adicione aqui
};
```

### Passo 4: Adicione as stats no useEnemyManager.js

```js
meuInimigoCustom: {
  color: 'yellow',
  shape: 'meuinimigo', // ← Nome do mapeamento
  speed: 4.0,
  health: 300,
  onHitDamage: 250,
  size: 1.8,
  deathSound: 'hit-hard3',
  hitSound: 'hit-soft2',
  drops: {
    exp: {min: 200, max: 300},
    gold: {min: 30, max: 50}
  }
}
```

### Passo 5: Spawne!

```js
enemyManager.spawnEnemy('meuInimigoCustom', position);
```

## 📚 Geometrias Disponíveis

Você pode usar qualquer uma dessas geometrias do Three.js:

- `TresBoxGeometry` - Cubo
- `TresSphereGeometry` - Esfera ✅ (já tem exemplo)
- `TresConeGeometry` - Cone (kamikaze usa)
- `TresCylinderGeometry` - Cilindro
- `TresDodecahedronGeometry` - Dodecaedro (asteroid usa)
- `TresTorusGeometry` - Donut ✅ (já tem exemplo)
- `TresIcosahedronGeometry` - Icosaedro ✅ (composite usa)
- `TresOctahedronGeometry` - Octaedro
- `TresTetrahedronGeometry` - Tetraedro (pirâmide)
- `TresTorusKnotGeometry` - Nó de torus
- `TresRingGeometry` - Anel

## ⚠️ Dicas Importantes

1. **Nome do `shape` deve ser IGUAL ao nome no mapeamento**
   ```js
   // No useEnemyManager.js
   shape: 'sphere'  // ← Este nome

   // No EnemyManager.vue
   const enemyComponents = {
     sphere: EnemySphere  // ← Deve ser o mesmo
   }
   ```

2. **O ID do inimigo (para spawn) é diferente do shape**
   ```js
   // ID do inimigo (qualquer nome descritivo)
   sphereEnemy: {
     // Shape (deve estar no mapeamento)
     shape: 'sphere',
     // ...
   }
   ```

3. **Sempre teste spawnar 1 inimigo antes de spawnar muitos**

4. **Se o inimigo não aparecer, verifique o console do navegador**

## 🐛 Problemas Comuns

### Inimigo não aparece

1. Verifique se o `shape` está no mapeamento
2. Verifique se importou o componente no EnemyManager.vue
3. Verifique se a posição do spawn está visível na câmera

### Erro "component is not defined"

Você esqueceu de importar o componente no EnemyManager.vue:

```js
import EnemySphere from '~/components/game/enemies/EnemySphere.vue';
```

### Inimigo aparece mas sem textura/cor

Verifique se a propriedade `color` está definida no baseStats.

## 🎯 Próximos Passos

1. Teste spawnar os 3 inimigos exemplo
2. Customize suas cores e stats
3. Adicione eles nas suas ondas de spawn
4. Crie seus próprios inimigos personalizados!

---

**Dúvidas?** Consulte o README em `app/components/game/enemies/README.md`
