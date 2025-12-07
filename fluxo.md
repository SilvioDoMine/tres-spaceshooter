# FLUJOS DETALLADOS DEL ESPACIO SHOOTER

## DIAGRAMA 1: ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                         NUXT PAGE [id].vue                      │
│              /app/pages/play/[id].vue (línea 48-80)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ onMounted()
                           ↓
        ┌──────────────────────────────────────┐
        │  currentRunStore.gameStart(LEVEL_1)  │
        │  - endRun()                          │
        │  - initializeLevel()                 │
        │  - loadStage(stage[0])               │
        │  - gameState = 'playing'             │
        └──────────────┬───────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────┐
        │  <TresCanvas clear-color="...">  │
        │    <GameOrchestrator>            │ ← MAIN LOOP (GameOrchestrator.vue)
        │      <GameDoorManager />         │
        │      <GamePlayerCharacter />     │
        │      <GameEnemyManager />        │
        │      <GameProjectileManager />   │
        │      <GameWorld />               │
        │    </GameOrchestrator>           │
        │  </TresCanvas>                   │
        └──────────┬───────────────────────┘
                   │
        ┌──────────┴────────────────────────────────────────┐
        │                                                   │
        ↓                                                   ↓
    HUD Components                             Main Loop (60 FPS)
    ├── UiResources                        See DIAGRAMA 2
    ├── UiLevel
    └── Modals:
        ├── GamePauseModal
        ├── GameOverModal
        └── GameVictoryModal
```

## DIAGRAMA 2: MAIN GAME LOOP (GameOrchestrator.vue)

```
┌─────────────────────────────────────────────────────────────────┐
│                    onBeforeRender(gameTick)                     │
│                   (Ejecuta cada frame, 60 FPS)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ delta = tiempo desde último frame
                     │ safeDelta = min(delta, 0.1)
                     │
                     ├─→ if (!currentRunStore.isPlaying) return
                     │
                     ↓
    ┌────────────────────────────────────┐
    │  1. playerControls.update(delta)   │
    │     /composables/usePlayerControls│
    │     - Lee keysPressed{}            │
    │     - Actualiza position           │
    │     - Rotación hacia movimiento    │
    │     - Cuenta cooldown tiro         │
    │     - Dispara proyectiles          │
    │     - Actualiza store              │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  2. enemyManager.update(delta)     │
    │     /composables/useEnemyManager   │
    │     - Cuenta spawn timers          │
    │     - Cambia state: spawning→active│
    │     - Actualiza spawnProgress      │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  3. enemyAI.update(delta)          │
    │     /composables/useEnemyAI        │
    │     Para cada enemigo (si active): │
    │     - asteroid: mueve hacia player │
    │     - ufo: mantiene distancia,     │
    │       dispara cada 2 seg           │
    │     - boss: mueve + dispara const. │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  4. projectileStore.update(delta)  │
    │     /stores/projectileStore        │
    │     - Mueve proyectiles            │
    │     - Verifica colisiones:         │
    │       * player→enemy: dmg, delete  │
    │       * enemy→player: dmg, delete  │
    │     - Remueve por rango            │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  5. gameDirector.update(delta)     │
    │     /composables/useGameDirector   │
    │     Según stage.type:              │
    │     - intro: completa inmediato    │
    │     - combat: spawn waves,         │
    │       verifica si todas muertas    │
    │     - upgrade: (TODO)              │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │  [TresJS renderiza la escena]      │
    │  Llama a onBeforeRender en todos   │
    │  los componentes individuales:     │
    │  - PlayerCharacter.onBeforeRender()│
    │  - DoorManager.onBeforeRender()    │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────┐
    │ [Componentes Vue se re-renderean   │
    │  si sus datos reactivos cambiaron] │
    │                                    │
    │ - EnemyManager.vue (lista)         │
    │ - ProjectileManager.vue (lista)    │
    │ - UiResources.vue (gold)           │
    │ - UiLevel.vue (exp bar)            │
    └────────────────────────────────────┘
```

## DIAGRAMA 3: FLUJO DE MOVIMIENTO DEL PLAYER

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT → TECLADO / GAMEPAD                    │
│    window.addEventListener('keydown', handleKeyDown)           │
│    window.addEventListener('keyup', handleKeyUp)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│             handleKeyDown/Up (usePlayerControls.ts)             │
│  - W/ArrowUp → dz = -1                                          │
│  - S/ArrowDown → dz = +1                                        │
│  - A/ArrowLeft → dx = -1                                        │
│  - D/ArrowRight → dx = +1                                       │
│  - Space → dy = +1 (arriba)                                     │
│  - Shift → dy = -1 (abajo)                                      │
│                                                                  │
│  keysPressed[key] = true/false                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│           calculateMovementVector() (solo si cambió input)       │
│  1. Acumula cambios en dx, dy, dz                               │
│  2. Normaliza vector 3D (mag = sqrt(dx²+dy²+dz²))               │
│     Si magnitude > 0: dx/=mag, dy/=mag, dz/=mag                 │
│  3. currentRun.setMoveVector(dx, dy, dz)                        │
│     └─ Dispara reactividad SOLO cuando input cambia             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│       playerControls.update(delta) [60 FPS en game loop]        │
│  Líneas 104-217 en usePlayerControls.ts                         │
│                                                                  │
│  1. Lee valores sin mutación:                                   │
│     position = currentRun.getPlayerPosition()                   │
│     rotation = currentRun.getPlayerRotation()                   │
│     movement = currentRun.getMoveVector()                       │
│     speed = currentRun.currentMoveSpeed.value                   │
│                                                                  │
│  2. Calcula desplazamiento:                                     │
│     dx = movement.x * speed * delta                             │
│     dy = movement.y * speed * delta                             │
│     dz = movement.z * speed * delta                             │
│                                                                  │
│  3. MUTACIÓN DIRECTA (sin reactividad, shallowRef):             │
│     position.x += dx                                            │
│     position.y += dy                                            │
│     position.z += dz                                            │
│                                                                  │
│  4. Rotación suave interpolada (LERP):                          │
│     targetRotation = atan2(-movement.x, -movement.z)            │
│     diff = targetRotation - rotation.y                          │
│     Normalizar diff a [-PI, PI]                                 │
│     rotation.y += diff * rotationSpeed * delta                  │
│                                                                  │
│  5. Cooldown de tiro:                                           │
│     if (shotCooldown > 0) shotCooldown -= delta                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│      PlayerCharacter.onBeforeRender() [60 FPS, sincronizado]   │
│  Líneas 79-104 en PlayerCharacter.vue                           │
│                                                                  │
│  Mutación DIRECTA en mesh Three.js (SIN Vue reactivity):        │
│                                                                  │
│  playerMeshRef.value.position.x = position.x                   │
│  playerMeshRef.value.position.y = position.y                   │
│  playerMeshRef.value.position.z = position.z                   │
│  playerMeshRef.value.rotation.y = rotation.y                   │
│  hpMeshRef.value.position = position + (0, 2, 0)               │
│  rangeCircleRef.value.position = position + (0, 0.1, 0)        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
           [3D RENDER COMPLETO]
```

## DIAGRAMA 4: FLUJO DE TIRO

```
┌───────────────────────────────────────────────────────────────┐
│              Player está PARADO (dx=0, dy=0, dz=0)            │
│         En usePlayerControls.update() línea 150-206          │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │  Buscar enemigo más cercano    │
        │  nearestEnemy = projectileStore│
        │  .nearestEnemyFromPlayer()     │
        │                                │
        │  - Itera activeEnemies[]       │
        │  - Ignora si state='spawning'  │
        │  - Calcula distancia XZ        │
        │  - Si dist > range: return null│
        │  - Sino retorna el más cercano │
        └────────────┬───────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │  Si nearestEnemy existe:       │
        │                                │
        │  1. Rota player hacia enemigo  │
        │     dirX = enemy.x - player.x  │
        │     dirZ = enemy.z - player.z  │
        │     targetRotation =           │
        │       atan2(-dirX, -dirZ)      │
        │     [LERP con rotationSpeed]   │
        │                                │
        │  2. Si shotCooldown <= 0:      │
        │     - Normaliza dirección      │
        │     - spawnProjectile()        │
        │     - shotCooldown = 0.25      │
        │                                │
        │     projectileStore.spawn(     │
        │       type: 'player',          │
        │       position: player.pos,    │
        │       direction: {x,y,z},      │
        │       ownerId: 'player',       │
        │       ownerType: 'player'      │
        │     )                          │
        └────────────┬───────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │   projectileStore.update()     │
        │   [60 FPS en game loop]        │
        │                                │
        │   Para cada projectile:        │
        │   - position.x += dir.x * spd  │
        │   - position.z += dir.z * spd  │
        │   - distanceTraveled += spd    │
        │                                │
        │   Si distanceTraveled >= range:│
        │   - remove del array           │
        │                                │
        │   checkCollisions():           │
        │   - Si ownerType='player':     │
        │     - Vs cada activeEnemy      │
        │     - Si collision:            │
        │       * enemy.takeDamage()     │
        │       * remove projectile      │
        └────────────┬───────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │   ProjectileManager.vue render │
        │   v-for projectile:            │
        │   <TresMesh                    │
        │     :position="[proj.x,1,z]"  │
        │     :color="proj.color"        │
        │     <TresBoxGeometry />        │
        │   </TresMesh>                  │
        └────────────────────────────────┘
```

## DIAGRAMA 5: GESTIÓN DE ENEMIGOS

```
┌────────────────────────────────────────────────────────────────┐
│     useGameDirector.handleCombatStage() [game loop]            │
│     Si no isWaveInProgress && currentWaveIndex < waves.length: │
│     → spawnEnemyWave(waves[currentWaveIndex])                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────────┐
│    useEnemyManager.spawnEnemyWave(waveConfig)                 │
│    Líneas 74-108 en useEnemyManager.js                        │
│                                                                 │
│    Para cada enemyGroup en waveConfig.enemies:                 │
│    {enemyType, count, delay}                                   │
│                                                                 │
│    Para i = 0 to count-1:                                      │
│    1. Obtener stats base: baseStats[enemyType]                 │
│    2. Generar posición random:                                 │
│       generateRandomSpawnPosition()                            │
│       - x/z aleatorio en stage bounds                          │
│       - Mínimo 10 unidades del player                          │
│    3. Crear objeto enemigo:                                    │
│       {                                                         │
│         id: `${type}_${date}_${i}`,                            │
│         type: 'asteroid'|'ufo'|'boss',                         │
│         position: {x, y:0, z},                                 │
│         state: 'spawning',                                     │
│         spawnTimer: delay,                                     │
│         totalSpawnTime: delay,                                 │
│         spawnProgress: 0,                                      │
│         ...baseStats  // color, size, speed, health, etc       │
│       }                                                         │
│    4. activeEnemies.push(newEnemy)                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────────┐
│   useEnemyManager.update(delta) [60 FPS]                      │
│   Líneas 54-72 en useEnemyManager.js                           │
│                                                                 │
│   Para cada enemy en activeEnemies:                            │
│   Si state === 'spawning':                                     │
│   - enemy.spawnTimer -= delta                                  │
│   - spawnProgress = 1 - (spawnTimer / totalSpawnTime)          │
│   - Si spawnTimer <= 0:                                        │
│     * state = 'active'                                         │
│     * spawnProgress = 1                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────────┐
│   useEnemyAI.update(delta) [60 FPS]                           │
│   Líneas 144-165 en useEnemyAI.js                              │
│                                                                 │
│   Para cada enemy en activeEnemies:                            │
│   Si state === 'spawning': skip                                │
│                                                                 │
│   Ejecutar behavior[enemy.type](enemy, delta):                 │
│                                                                 │
│   ASTEROID (líneas 17-36):                                     │
│   - dirX = player.x - enemy.x                                  │
│   - dirZ = player.z - enemy.z                                  │
│   - length = sqrt(dirX² + dirZ²)                               │
│   - Si length > 1:                                             │
│     * enemy.x += (dirX/length) * speed * delta                 │
│     * enemy.z += (dirZ/length) * speed * delta                 │
│   - Si length <= 1: colisión                                   │
│     * player.takeDamage(enemy.onHitDamage)                     │
│     * enemy.takeDamage(enemy.health) [muere]                   │
│                                                                 │
│   UFO (líneas 37-94):                                          │
│   - Igual movimiento, pero mantiene distanceKeep               │
│   - Si length <= distanceKeep: no se mueve                     │
│   - cooldownShot -= delta                                      │
│   - Si cooldownShot <= 0 && length <= distanceKeep:            │
│     * Normaliza dirección                                      │
│     * projectileStore.spawnProjectile('ufo', ...)              │
│     * cooldownShot = cooldownTotalShot (2 seg)                 │
│                                                                 │
│   BOSS (líneas 95-141):                                        │
│   - Similar a UFO, pero sin distanceKeep                       │
│   - Se mueve siempre hacia player                              │
│   - Dispara constantemente                                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────────┐
│   EnemyManager.vue renderización [Vue render cuando cambian]  │
│   Líneas 38-71 en EnemyManager.vue                             │
│                                                                 │
│   <TresGroup>                                                  │
│     v-for (enemy, index) in activeEnemies:                     │
│     <TresMesh                                                  │
│       :position="[enemy.x, enemy.y, enemy.z]"                 │
│       :scale="getEnemyVisuals(enemy).scale"                   │
│     >                                                          │
│       <TresMeshStandardMaterial                                │
│         :color="baseStats[enemy.type].color"                  │
│         :opacity="getEnemyVisuals(enemy).opacity"              │
│       />                                                       │
│       <TresBoxGeometry                                         │
│         :args="[size, size, size]"                            │
│       />                                                       │
│       <!-- HP Text mostrado si active -->                      │
│       <Text3D v-if="active" :text="`HP: ${health}`" />        │
│     </TresMesh>                                                │
│   </TresGroup>                                                 │
└────────────────────────────────────────────────────────────────┘
```

## DIAGRAMA 6: COLISIONES Y MUERTE DE ENEMIGOS

```
┌────────────────────────────────────────────────────────────────┐
│    projectileStore.update(delta) [60 FPS]                     │
│    Líneas 36-52 en projectileStore.js                          │
│                                                                 │
│    checkCollisions() [líneas 55-85]:                           │
│    Para cada projectile:                                       │
│      Si ownerType === 'player':                                │
│        Para cada enemy en activeEnemies:                       │
│          Si collision(projectile, enemy):                      │
│            - enemyManager.takeDamage(enemy.id, damage)         │
│            - remove projectile                                 │
│      Si ownerType === 'enemy':                                 │
│        Si collision(projectile, player):                       │
│          - currentRunStore.takeDamage(damage)                  │
│          - remove projectile                                   │
│                                                                 │
│    isColliding() [línea 87-89]:                                │
│      return dist(pos1, pos2) < threshold                       │
│      (actualmente threshold hardcoded a 1)                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────────┐
│    enemyManager.takeDamage(enemyId, damage)                   │
│    Líneas 113-144 en useEnemyManager.js                        │
│                                                                 │
│    Encontrar enemy por id                                      │
│    Si state === 'spawning': return [invulnerable]              │
│                                                                 │
│    enemy.health -= damage                                      │
│                                                                 │
│    Si health <= 0:                                             │
│    1. Remove enemy de activeEnemies[]                          │
│    2. Generate gold drops:                                     │
│       goldDropped = random(min...max)                          │
│       currentGold += goldDropped                               │
│    3. Generate exp drops:                                      │
│       expDropped = random(min...max)                           │
│       currentRunStore.addExp(expDropped)                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────────┐
│    currentRunStore.addExp(amount) [línea 424]                 │
│                                                                 │
│    currentExp += amount                                        │
│    while (currentExp >= expToNextLevel):                       │
│      levelUp()                                                 │
│                                                                 │
│    levelUp() [línea 432]:                                      │
│    - currentLevel += 1                                         │
│    - currentExp -= expToNextLevel                              │
│    - expToNextLevel = getExpForLevel(currentLevel)             │
│    - baseExp * level^1.5                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────────┐
│    gameDirector.handleCombatStage() [siguiente frame]         │
│    Líneas 28-75 en useGameDirector.js                          │
│                                                                 │
│    Si isWaveInProgress && activeEnemies.length === 0:          │
│    1. isWaveInProgress = false                                 │
│    2. Si currentWaveIndex + 1 < waves.length:                  │
│       - roomCurrentWaveIndex += 1 [siguiente onda]             │
│       - En el siguiente frame:                                 │
│         spawnEnemyWave(waves[nextWaveIndex])                   │
│    3. Sino:                                                    │
│       - completeStage() [completa la sala]                     │
│         * isStageCompleted = true                              │
│         * isDoorActive = true                                  │
│         * Velocidad movimiento *= 3 (si no intro)              │
└────────────────────────────────────────────────────────────────┘
```

## DIAGRAMA 7: PROGRESIÓN DE SALAS (STAGES)

```
┌───────────────────────────────────────────────────────┐
│          currentRunStore.gameStart(levelConfig)       │
│  Línea 361 en currentRunStore.ts                      │
│                                                       │
│  initializeLevel(levelConfig):                        │
│  - levelConfig.value = config                         │
│  - currentStageIndex = 0                              │
│  - loadStage(config.stages[0]) [primer stage]         │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌───────────────────────────────────────────────────────┐
│    currentRunStore.loadStage(stage)                   │
│    Línea 274 en currentRunStore.ts                    │
│                                                       │
│  - currentStage = stage                               │
│  - isStageCompleted = false                           │
│  - stageTimer = 0                                     │
│  - doorPosition = stage.door.position                 │
│  - playerPosition = stage.playerStartPosition         │
│  - isWaveInProgress = false                           │
│  - roomCurrentWaveIndex = 0                           │
│  - currentMoveSpeed = baseSpeed                       │
└────────────┬────────────────────────────────────────┘
             │
             ↓ game loop inicia
┌───────────────────────────────────────────────────────┐
│    useGameDirector.update(delta)                      │
│    Línea 8 en useGameDirector.js                      │
│                                                       │
│    Según stage.type:                                  │
│    - 'intro': handleIntroStage()                      │
│    - 'combat': handleCombatStage()                    │
│    - 'boss': handleCombatStage() [mismo que combat]   │
│    - 'upgrade': handleUpgradenStage() [TODO]          │
└────────────┬────────────────────────────────────────┘
             │
             ├─── [INTRO STAGE] ───────────────────┐
             │                                     │
             │ handleIntroStage() [línea 77]:      │
             │ Si !isStageCompleted:               │
             │ - completeStage()                   │
             │   * isDoorActive = true             │
             │                                     │
             │ [Player corre hacia puerta]         │
             │                                     │
             └────────────┬────────────────────────┘
                          │
                          ↓
             ┌────────────────────────────────────┐
             │  DoorManager.onBeforeRender()      │
             │  Línea 9 en DoorManager.vue        │
             │                                    │
             │  Si isDoorActive:                  │
             │  - distance(player, door) < 1      │
             │  - currentRunStore.nextStage()     │
             └────────────┬───────────────────────┘
                          │
             ├─── [COMBAT STAGE] ───────────────┐
             │                                   │
             │ handleCombatStage() [línea 28]:   │
             │ Si !isWaveInProgress:             │
             │ - spawnEnemyWave(waves[idx])      │
             │ - isWaveInProgress = true         │
             │                                   │
             │ [Game loop: enemies spawn, move]  │
             │ [Player dispara, matan enemigos]  │
             │                                   │
             │ Si isWaveInProgress &&            │
             │    activeEnemies.length === 0:    │
             │ - isWaveInProgress = false        │
             │ - idx += 1                        │
             │ [en siguiente frame: spawn wave2] │
             │                                   │
             │ Si no hay más waves:              │
             │ - completeStage()                 │
             │ - isDoorActive = true             │
             │                                   │
             │ [Player corre a puerta, entra]    │
             │                                   │
             └────────────┬───────────────────────┘
                          │
                          ↓
             ┌────────────────────────────────────┐
             │  nextStage() [línea 300]           │
             │                                    │
             │  Si idx+1 < stages.length:         │
             │  - currentStageIndex += 1          │
             │  - loadStage(stages[idx+1])        │
             │  [Vuelve al inicio del loop]       │
             │                                    │
             │  Sino (no hay más stages):         │
             │  - gameVictoryRewards()            │
             │  - gameVictory()                   │
             │  [Victoria!]                       │
             └────────────────────────────────────┘

NIVEL 1 CONFIG (LevelOneConfig.js):
stages[0]: Intro (10x20)
stages[1]: Combat (40x30) - 2 waves
  wave 0: 4 asteroides
  wave 1: 6 asteroides + 2 UFOs
stages[2]: Combat (30x20) - 2 waves
  wave 0: 4 asteroides + 2 UFOs
  wave 1: 6 asteroides + 2 UFOs
stages[3]: Combat (20x30) - 2 waves
  wave 0: 4 UFOs + 6 asteroides
  wave 1: 6 UFOs + 8 asteroides
stages[4]: Boss (40x40) - 1 wave
  wave 0: 1 Boss
```

## DIAGRAMA 8: SISTEMA DE XP Y UPGRADE

```
┌──────────────────────────────────────────────┐
│  Enemigo derrotado                          │
│  [useEnemyManager.takeDamage]                │
│                                              │
│  enemy.health <= 0:                          │
│  → drops.exp = {min, max} de baseStats       │
│  → expDropped = random(min...max)            │
│  → currentRunStore.addExp(expDropped)        │
└────────────┬───────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│  addExp(amount) [línea 424 currentRunStore]  │
│                                              │
│  currentExp += amount                        │
│                                              │
│  WHILE currentExp >= expToNextLevel:         │
│    levelUp()                                 │
│      - currentLevel += 1                     │
│      - currentExp -= expToNextLevel          │
│      - expToNextLevel = getExpForLevel(...)  │
│      - Nivel_X_XP = 100 * X^1.5              │
└────────────┬───────────────────────────────┘
             │
             ↓ [Vue reactivity dispara]
┌──────────────────────────────────────────────┐
│  Level.vue detecta cambios (línea 8-16)      │
│                                              │
│  Calcula progressPercentage:                 │
│  percentage = (currentExp/expToNextLevel)*100│
│                                              │
│  Anima barra desde 0% a 100%                 │
│  Si % < previousProgress (level-up):         │
│  - Desactiva transición CSS                  │
│  - Resetea barra a 0%                        │
│  - Reactiva transición                       │
│                                              │
│  Muestra: "Lv. {{currentLevel}}"             │
│  [barra verde] x {{currentExp}}/{{needXP}}   │
└────────────────────────────────────────────┘

TABLA DE XP POR NIVEL:
Nivel 1: 0 XP  → 100 XP (0 * 1^1.5)
Nivel 2: 100 XP → 190 XP (100 * 2^1.5 ≈ 283)
Nivel 3: 283 XP → 316 XP (100 * 3^1.5 ≈ 520)
Nivel 4: 520 XP → 480 XP (100 * 4^1.5 = 800)
Nivel 5: 800 XP → 684 XP (100 * 5^1.5 ≈ 1118)

SKILLS DISPONIBLES (playerStats.ts línea 30):
- damage_percentage (comun)
- health_percentage (común)
- health_regeneration (común)
- general_speed (común)
- ricochet_shot (rara)
- diagonal_shot (rara)
- back_shot (rara)
- piercing_shot (rara)
- range_extension (épica)
- multishot (épica)
- short_range_shot (legendaria)

[TODO: Sistema de upgrades aún no implementado]
```

## DIAGRAMA 9: FLUJO PAUSA/REANUDACIÓN

```
┌────────────────────────────────────────────────────────┐
│       ESTADO NORMAL: gameState = 'playing'             │
│       isPlaying = true → game loop ejecuta             │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ User hace click botón pause
                     │ (Resources.vue, línea 14)
                     │
                     ↓
┌────────────────────────────────────────────────────────┐
│     currentRunStore.gamePause() [línea 369]            │
│                                                         │
│     if (isPlaying):                                    │
│       gameState.value = 'paused'                       │
│                                                         │
│     Computed: isPlaying → false                        │
└────────────┬──────────────────────────────────────────┘
             │
             ↓ [Reactividad dispara]
┌────────────────────────────────────────────────────────┐
│   GameOrchestrator.gameTick() verifica:                │
│   if (!currentRunStore.isPlaying) return               │
│   → Loop se detiene                                    │
└────────────┬──────────────────────────────────────────┘
             │
             ↓ [Vue re-render en PauseModal.vue]
┌────────────────────────────────────────────────────────┐
│   PauseModal.vue [línea 8]                             │
│   :class="isPaused ? 'opacity-100' : 'opacity-0'"      │
│                                                         │
│   Muestra modal con:                                   │
│   - "Game Paused"                                      │
│   - Botón "Resume"                                     │
│   - Botón "Quit"                                       │
│                                                         │
│   Botón Resume → click listener:                       │
│   @click="currentRunStore.gameResume()"                │
└────────────┬──────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│   currentRunStore.gameResume() [línea 376]             │
│                                                         │
│   if (isPaused):                                       │
│     gameState.value = 'playing'                        │
│                                                         │
│   Computed: isPlaying → true                           │
└────────────┬──────────────────────────────────────────┘
             │
             ↓ [Reactividad dispara]
┌────────────────────────────────────────────────────────┐
│   GameOrchestrator.gameTick() ahora:                   │
│   if (!isPlaying) return → BYPASSED                    │
│   → Continúa ejecutando el loop                        │
└────────────┬──────────────────────────────────────────┘
             │
             ↓ [Vue re-render en PauseModal.vue]
┌────────────────────────────────────────────────────────┐
│   PauseModal.vue:                                      │
│   :class="isPaused ? 'opacity-100' : 'opacity-0'"      │
│   opacity-0 + pointer-events-none                      │
│   → Modal desaparece                                   │
└────────────────────────────────────────────────────────┘

BOTON QUIT:
<NuxtLink to="/">
  <button>Quit</button>
</NuxtLink>
→ Navega a home page
→ onUnmounted en [id].vue dispara
→ (comentado) currentRunStore.endRun()

GAME OVER:
Si player.health <= 0:
→ currentRunStore.takeDamage(x)
→ currentRunStore.gameOver()
→ OverModal.vue se muestra
→ Botones: "Try again" o "Quit"
   - Try again: gameStart(levelConfig)
   - Quit: navega a /

VICTORIA:
Si nextStage() sin más stages:
→ gameVictoryRewards()
→ gameVictory()
→ VictoryModal.vue se muestra
→ Solo botón "Quit": navega a /
```

