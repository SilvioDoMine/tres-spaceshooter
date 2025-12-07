# ANÁLISIS ESTRUCTURAL - TresJS Space Shooter

## Stack Tecnológico
- **Framework Principal**: Nuxt 4.1.2 (Vue 3)
- **Renderización 3D**: TresJS 5.0.0 (wrapper de Three.js r.180)
- **Estado Global**: Pinia 3.0.4 
- **Librerías Adicionales**: TresJS Cientos, Leches, Post-Processing
- **Utilidades**: Tweakpane 4.0.5 (debug/controls), Tailwind CSS

## Estructura de Carpetas

```
/app
├── /stores              # Estado global (Pinia)
│   ├── currentRunStore.ts      # Estado principal del juego
│   ├── projectileStore.js      # Gestión de proyectiles
│   ├── enemyManagerStore.js    # Lista de enemigos activos
│   ├── playerStats.ts          # Stats base y skills/upgrades
│   └── useTweakpaneStore.js    # Controls de debug
│
├── /composables         # Lógica reutilizable (Composition API)
│   ├── usePlayerControls.ts    # Input + Movimiento del player
│   ├── useGameDirector.js      # Orquestación del juego (waves, stages)
│   ├── useEnemyManager.js      # Spawn y gestión de enemigos
│   ├── useEnemyAI.js           # IA y comportamiento de enemigos
│   ├── useCombat.js            # Sistema de combate (esqueleto)
│   └── useUpgradeSystem.js     # Sistema de upgrades
│
├── /components
│   ├── /game              # Componentes principales del juego 3D
│   │   ├── GameOrchestrator.vue      # Main game loop (60 FPS)
│   │   ├── PlayerCharacter.vue       # Renderización + Control del player
│   │   ├── EnemyManager.vue          # Renderización de enemigos
│   │   ├── ProjectileManager.vue     # Renderización de proyectiles
│   │   ├── World.vue                 # Plano del mundo + luces
│   │   ├── DoorManager.vue           # Detección de entrada a portal
│   │   ├── PauseModal.vue            # UI Pausa
│   │   ├── OverModal.vue             # UI Game Over
│   │   └── VictoryModal.vue          # UI Victoria
│   │
│   ├── /ui               # Componentes HUD
│   │   ├── Resources.vue       # Mostrador de oro + botón pausa
│   │   ├── Level.vue           # Barra de nivel/exp + número de sala
│   │   └── VirtualJoystick.vue # Joystick mobile (comentado)
│   │
│   └── TheExperience.vue       # (Demo, no usado en juego)
│
├── /pages                # Rutas Nuxt
│   ├── index.vue         # Pantalla principal
│   ├── level-select.vue  # Selección de niveles
│   └── /play
│       ├── index.vue     # Lista de niveles
│       └── [id].vue      # Página principal del juego
│
└── /games
    └── /levels
        └── LevelOneConfig.js  # Configuración de Level 1
```

## 1. SISTEMA DE NIVELES/EXPERIENCIA

### Flujo de Experiencia:
```
Enemy derrotado → drop exp → addExp() en store
→ while(currentExp >= expToNextLevel) levelUp()
→ currentLevel++, currentExp resetea, expToNextLevel se recalcula
```

### Archivos clave:
- **currentRunStore.ts** (líneas 214-451):
  - `currentExp`: XP acumulada
  - `currentLevel`: Nivel actual
  - `expToNextLevel`: XP necesaria para siguiente nivel
  - `getExpForLevel()`: Calcula XP requerida: `baseExp * level^1.5`
  - `addExp()`: Suma XP y dispara level-up si es necesario

- **useEnemyManager.js** (líneas 133-143):
  - Cuando enemy.health <= 0, genera drops de exp/gold
  - Llama a `useCurrentRun.addExp(expDropped)`

- **Level.vue** (líneas 8-16):
  - Muestra progreso visual: `(currentExp / expToNextLevel) * 100%`
  - Detecta cuando baja de 100% para resetear la barra

### Parámetros de Balance:
```javascript
// Base de cálculo en currentRunStore.ts
const baseExp = 100;
const exponent = 1.5;
// Nivel 1: 100 XP
// Nivel 2: 190 XP
// Nivel 3: 316 XP
// Nivel 4: 480 XP
// Nivel 5: 684 XP
```

---

## 2. LÓGICA DEL PLAYER Y SISTEMA DE TIRO

### Componentes principales:
1. **PlayerCharacter.vue**: Renderización (mesh triangle)
2. **usePlayerControls.ts**: Input + movimiento + tiro
3. **projectileStore.js**: Gestión de proyectiles

### Flujo de Movimiento:
```
User Input (W/A/S/D/Space/Shift)
  ↓
handleKeyDown/Up actualizan keysPressed{}
  ↓
calculateMovementVector() → normaliza dirección 3D
  ↓
setMoveVector() en store (dispara reactividad)
  ↓
usePlayerControls.update() [60 FPS]:
  - Lee moveVector y currentMoveSpeed
  - position += moveVector * speed * delta
  - Rotación suave hacia dirección del movimiento
  ↓
PlayerCharacter.onBeforeRender():
  - Lee posición de store
  - Mutación directa en mesh Three.js (sin reactividad)
```

### Flujo de Tiro:
```
Player está PARADO (velocidad = 0)
  ↓
shotCooldown cuenta hacia atrás (usePlayerControls.update)
  ↓
Si cooldown <= 0:
  - Encuentra enemigo más cercano (projectileStore.nearestEnemyFromPlayer)
  - Si existe y está en rango:
    - Calcula dirección normalizada hacia enemigo
    - spawnProjectile('player', pos, dir, 'player', 'player')
    - shotCooldown = shotCooldownTotal (0.25 segundos)
  ↓
Proyectil se renderiza y se actualiza en projectileStore.update()
```

### Archivos clave:
- **usePlayerControls.ts** (lineas 16-226):
  - Movimiento: líneas 104-140
  - Sistema de tiro: líneas 149-206
  
- **projectileStore.js** (líneas 91-109):
  - `spawnProjectile()`: Crea nuevo proyectil
  - Propiedades: position, direction, speed, damage, range, distanceTraveled

- **PlayerCharacter.vue** (líneas 78-105):
  - `onBeforeRender`: Sincroniza mesh con store cada frame

### Propiedades de Tiro (Base):
```javascript
projectiles: {
  shotCooldown: 0.25,    // segundos entre disparos
  shotSpeed: 99.0,       // unidades/segundo
  size: 0.2,             // tamaño del mesh
  damage: 50,            // daño base
  range: 30,             // distancia máxima viajada
}
```

---

## 3. GESTIÓN DE ENEMIGOS

### Tipos de Enemigos:
1. **Asteroid**: Simple, se mueve hacia player, colisiona y muere
2. **UFO**: Mantiene distancia, dispara proyectiles
3. **Boss**: Se mueve hacia player, dispara constantemente

### Flujo de Spawn:
```
useGameDirector.handleCombatStage()
  ↓
currentWaveIndex = 0
  ↓
useEnemyManager.spawnEnemyWave(wave)
  ↓
Para cada enemyGroup en wave:
  - Lee enemyType, count, delay
  - Crea N enemigos con stats base
  - Posición aleatoria (mínimo 10 unidades del player)
  - Estado inicial: 'spawning' (invulnerable, invisible)
  - Agrega a activeEnemies[]
  ↓
useEnemyManager.update() cuenta down spawnTimer
  - Si spawnTimer <= 0: state = 'active'
  ↓
useEnemyAI.update() ejecuta comportamiento según tipo
  ↓
EnemyManager.vue renderiza con opacidad/escala basada en spawnProgress
```

### Flujo de Muerte:
```
Proyectil del player colisiona con enemigo
  ↓
projectileStore.checkCollisions()
  ↓
enemyManager.takeDamage(enemyId, projectile.damage)
  ↓
Si enemy.health <= 0:
  - Remove de activeEnemies[]
  - Generate drops (gold, exp)
  - useCurrentRun.addExp(expDropped)
  - useCurrentRun.currentGold += goldDropped
  ↓
useGameDirector verifica si wave completa:
  - Si activeEnemies.length === 0:
    - isWaveInProgress = false
    - Si hay más waves: roomCurrentWaveIndex++
    - Si no: completeStage()
```

### Archivos clave:
- **useEnemyManager.js** (líneas 48-196):
  - Stats base: líneas 5-45
  - spawnEnemyWave: líneas 74-108
  - takeDamage: líneas 113-144
  
- **useEnemyAI.js** (líneas 7-165):
  - Comportamientos: asteroid (líneas 17-36), ufo (37-94), boss (95-141)
  
- **EnemyManager.vue**: Renderización de enemigos

---

## 4. GAME LOOP PRINCIPAL

### Ubicación: GameOrchestrator.vue

```typescript
// Inicialización (líneas 17-24)
playerControls = usePlayerControls()
gameDirector = useGameDirector()
enemyManager = useEnemyManager()
enemyAI = useEnemyAI()
currentRunStore = useCurrentRunStore()
projectileStore = useProjectileStore()

// Main Loop (líneas 31-55)
const gameTick = ({ delta }: { delta: number }) => {
  const safeDelta = Math.min(delta, 0.1);  // Evitar spikes
  
  if (!currentRunStore.isPlaying) return;
  
  // Orden de ejecución por frame:
  playerControls.update(safeDelta)          // Input + movimiento
  enemyManager.update(safeDelta)            // Estados de spawn
  enemyAI.update(safeDelta)                 // IA de enemigos
  projectileStore.update(safeDelta)         // Colisiones de proyectiles
  gameDirector.update(safeDelta)            // Lógica de progresión
}

// Hook al loop de TresJS (línea 59)
onBeforeRender(gameTick)  // Ejecuta ANTES de renderizar cada frame
```

### Orden de Ejecución:
```
Frame N:
  1. playerControls.update() → calcula pos, rotación, dispara proyectiles
  2. enemyManager.update() → cuenta down spawn timers
  3. enemyAI.update() → ejecuta movimiento/disparo de enemigos
  4. projectileStore.update() → mueve proyectiles, checkea colisiones
  5. gameDirector.update() → verifica progresión de waves/stages
  6. [TresJS renderiza la escena 3D]
```

---

## 5. PAUSA/REANUDACIÓN

### Estados del Juego:
```javascript
gameState: 'init' | 'playing' | 'paused' | 'gameover' | 'victory'

Computed properties:
- isPlaying: gameState === 'playing'
- isPaused: gameState === 'paused'
- isGameOver: gameState === 'gameover'
- isVictory: gameState === 'victory'
```

### Flujo de Pausa:
```
User hace click en botón pause (Resources.vue, línea 14)
  ↓
currentRunStore.gamePause()
  - gameState = 'paused'
  - isPlaying = false
  ↓
GameOrchestrator.gameTick() verifica isPlaying:
  - if (!isPlaying) return  → loop se detiene
  ↓
PauseModal.vue se muestra (opacity-100)
  - Botón Resume llama a gameResume()
  - Botón Quit navega a '/'
```

### Flujo de Reanudación:
```
User hace click Resume en PauseModal.vue (línea 15)
  ↓
currentRunStore.gameResume()
  - gameState = 'playing'
  - isPlaying = true
  ↓
GameOrchestrator.gameTick() vuelve a ejecutarse
  ↓
PauseModal desaparece (opacity-0, pointer-events-none)
```

### Archivos clave:
- **currentRunStore.ts**:
  - gamePause(): línea 369
  - gameResume(): línea 376
  
- **PauseModal.vue**: UI y lógica de pausa
- **Resources.vue**: Botón para pausar (línea 14)

---

## 6. FRAMEWORK: NUXT + TRESJS + PINIA

### Arquitectura de Datos:

```
┌─────────────────────────────────┐
│   Pinia Stores (Estado Global)  │
├─────────────────────────────────┤
│ • currentRunStore               │  ← Estado principal (jugador, nivel, etc)
│ • projectileStore               │  ← Proyectiles activos
│ • enemyManagerStore             │  ← Lista de enemigos
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│   Composables (Lógica)          │
├─────────────────────────────────┤
│ • usePlayerControls()           │
│ • useGameDirector()             │
│ • useEnemyManager()             │
│ • useEnemyAI()                  │
│ • useProjectileStore()          │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│   Vue Components (Renderización)│
├─────────────────────────────────┤
│ • GameOrchestrator (main loop)  │
│ • PlayerCharacter (player mesh) │
│ • EnemyManager (enemy meshes)   │
│ • ProjectileManager (bullets)   │
│ • World (terrain + lights)      │
│ • UI Components (HUD, modals)   │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│   TresJS/Three.js (3D Render)   │
└─────────────────────────────────┘
```

### Optimizaciones TresJS:

1. **shallowRef para datos de alta frecuencia**:
   ```typescript
   playerPosition = shallowRef<Vector3>({ x, y, z })
   // Mutations internas no disparan reactividad
   position.x += dx  // No reactivo
   playerPosition.value = { x, y, z }  // Reactivo (nuevo objeto)
   ```

2. **Template refs para acceso directo a meshes**:
   ```typescript
   playerMeshRef.value.position.x = newX  // Mutación directa, sin Vue reactivity
   ```

3. **onBeforeRender en lugar de onMounted**:
   ```typescript
   const { onBeforeRender } = useLoop()
   onBeforeRender(() => {
     // Ejecuta ANTES de cada render, perfecto para actualizar meshes
   })
   ```

### Entry Point:

```
/app/pages/play/[id].vue
  ↓
currentRunStore.gameStart(levelConfig)
  ↓
<TresCanvas>
  <GameOrchestrator>
    <PlayerCharacter />
    <EnemyManager />
    <ProjectileManager />
    <World />
  </GameOrchestrator>
</TresCanvas>
```

---

## 7. FLUJO COMPLETO DE UN NIVEL

```
1. User navega a /play/1
   └─ Carga LEVEL_1 config

2. onMounted() en [id].vue
   └─ currentRunStore.gameStart(LEVEL_1)
      - endRun() → resetea estado anterior
      - initializeLevel(LEVEL_1)
        - currentStageIndex = 0
        - loadStage(LEVEL_1.stages[0])  [Intro stage]
      - gameState = 'playing'

3. GameOrchestrator.gameTick() empieza a ejecutarse 60 FPS

4. Stage 0 (Intro):
   ├─ useGameDirector.handleIntroStage()
   │  └─ completeStage() → isDoorActive = true
   ├─ DoorManager detecta proximidad al portal
   │  └─ nextStage()

5. Stage 1 (Combat 1):
   ├─ useGameDirector.handleCombatStage()
   │  └─ spawnEnemyWave(waves[0])
   │     └─ 4 asteroides spawnan con delay 1.5s
   ├─ useEnemyAI.update() → asteroides se mueven hacia player
   ├─ Player dispara hacia asteroides
   ├─ Proyectiles colisionan → enemigos toman daño
   ├─ Enemigos mueren → drop exp/gold
   ├─ Cuando todos mueren:
   │  └─ Wave 1 completa → dispara wave 2
   │     └─ 6 asteroides + 2 UFOs spawnan
   ├─ [Repite]
   ├─ Cuando todas las waves completan:
   │  └─ completeStage() → isDoorActive = true
   └─ Player sale por puerta

6. Stages 2-4 (más combate)
   └─ [Repite flujo de Stage 1]

7. Stage 5 (Boss):
   ├─ spawnEnemyWave([boss])
   ├─ Boss se mueve hacia player
   ├─ Boss dispara constantemente
   ├─ Player dispara al boss
   ├─ Boss muere con mucho HP
   ├─ completeStage()
   ├─ nextStage() → no hay más stages
   │  └─ gameVictoryRewards()
   │     └─ saveGold(totalGold + currentGold)
   │  └─ gameVictory() → gameState = 'victory'
   └─ VictoryModal se muestra

8. User hace click Quit
   └─ Navega a '/'
      └─ onUnmounted() en [id].vue
```

---

## 8. RESUMEN DE ARCHIVOS CLAVE

### Stores (Estado):
- **currentRunStore.ts** (515 líneas): Estado global principal
- **projectileStore.js** (159 líneas): Proyectiles + colisiones
- **enemyManagerStore.js** (13 líneas): Simple wrapper de activeEnemies[]

### Composables (Lógica):
- **usePlayerControls.ts** (227 líneas): Input + movimiento + tiro
- **useGameDirector.js** (92 líneas): Orquestación waves/stages
- **useEnemyManager.js** (197 líneas): Spawn + gestión enemigos
- **useEnemyAI.js** (166 líneas): Comportamiento enemigos
- **useCombat.js** (35 líneas): Esqueleto (no usado)
- **useUpgradeSystem.js**: Esqueleto (no implementado)

### Componentes 3D (Renderización):
- **GameOrchestrator.vue** (66 líneas): MAIN LOOP
- **PlayerCharacter.vue** (159 líneas): Mesh + cámara player
- **EnemyManager.vue** (71 líneas): Meshes enemigos
- **ProjectileManager.vue** (28 líneas): Meshes proyectiles
- **World.vue** (40 líneas): Plano + luces
- **DoorManager.vue** (41 líneas): Detección portales

### UI:
- **Resources.vue** (38 líneas): HUD gold + pausa
- **Level.vue** (73 líneas): Barra EXP/nivel + número sala
- **PauseModal.vue** (29 líneas): Menú pausa
- **OverModal.vue** (28 líneas): Game Over screen
- **VictoryModal.vue** (23 líneas): Victory screen

### Configuración:
- **LevelOneConfig.js** (136 líneas): Definición de Level 1
- **nuxt.config.ts**: Config Nuxt + Tres
- **package.json**: Dependencias