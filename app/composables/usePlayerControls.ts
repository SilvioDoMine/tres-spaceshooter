/**
 * Hook para controlar a direção de movimento do jogador, simulando um joystick virtual.
 *
 * OTIMIZAÇÃO TresJS:
 * - Usa shallowRef para evitar reatividade profunda em loops de 60 FPS
 * - Mutação direta no game loop sem disparar watchers desnecessários
 * - Atualiza store apenas quando input muda (não a cada frame)
 *
 * @param joystickId O ID do elemento HTML que servirá como joystick.
 * @returns Um objeto reativo com o vetor de entrada e o estado de movimento.
 */
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useProjectileStore } from '~/stores/projectileStore';
import { onMounted, onUnmounted } from 'vue';

export function usePlayerControls() {
  const currentRun = useCurrentRunStore();
  const projectileStore = useProjectileStore();

  // Estado interno para rastrear quais teclas estão pressionadas
  const keysPressed = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    ' ': false, // Espaço para subir (Y+)
    Shift: false, // Shift para descer (Y-)
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (keysPressed.hasOwnProperty(key)) {
      keysPressed[key as keyof typeof keysPressed] = true;
      calculateMovementVector();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key;
    if (keysPressed.hasOwnProperty(key)) {
      keysPressed[key as keyof typeof keysPressed] = false;
      calculateMovementVector();
    }
  };

  /**
   * Calcula o vetor de movimento (direção) normalizado baseado nas teclas.
   * ✅ Otimizado: Só dispara reatividade quando input MUDA (não a cada frame)
   *
   * Sistema de coordenadas (alinhado com o joystick mobile):
   * - W/ArrowUp = Frente (aumenta Z+)
   * - S/ArrowDown = Trás (diminui Z-)
   * - A/ArrowLeft = Esquerda (diminui X-)
   * - D/ArrowRight = Direita (aumenta X+)
   * - Space = Cima (Y+)
   * - Shift = Baixo (Y-)
   */
  const calculateMovementVector = () => {
    let dx = 0; // Mudança no eixo X (Horizontal)
    let dy = 0; // Mudança no eixo Y (Vertical)
    let dz = 0; // Mudança no eixo Z (Profundidade/Frente)

    // W = Cima na tela (Z-), S = Baixo na tela (Z+)
    // (Alinhado com o joystick: arrastar para cima na tela = Z-, para baixo = Z+)
    if (keysPressed.w || keysPressed.ArrowUp) dz -= 1;   // Cima na tela (Z-)
    if (keysPressed.s || keysPressed.ArrowDown) dz += 1; // Baixo na tela (Z+)

    // A = Esquerda (X-), D = Direita (X+)
    if (keysPressed.a || keysPressed.ArrowLeft) dx -= 1;  // Esquerda
    if (keysPressed.d || keysPressed.ArrowRight) dx += 1; // Direita

    // Space = Cima (Y+), Shift = Baixo (Y-)
    if (keysPressed[' ']) dy += 1;    // Cima
    if (keysPressed.Shift) dy -= 1;   // Baixo

    // Normalização 3D (para que mover na diagonal/vertical não seja mais rápido)
    const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (magnitude > 0) {
      dx /= magnitude;
      dy /= magnitude;
      dz /= magnitude;
    }

    // ✅ setMoveVector dispara reatividade apenas quando teclas mudam
    currentRun.setMoveVector(dx, dy, dz);
  };

  // O composable é responsável por configurar e limpar os listeners
  onMounted(async () => {
    await nextTick();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });

  /**
   * Função update: É aqui que a posição real é calculada (chamada pelo useGameLoop).
   * ✅ OTIMIZAÇÃO: Mutação direta sem disparar reatividade a cada frame
   * @param {number} delta - O tempo decorrido desde o último frame.
   */
  const update = (delta: number) => {
    // Acessa os valores diretamente da store
    const position = currentRun.getPlayerPosition();
    const rotation = currentRun.getPlayerRotation();
    const movement = currentRun.getMoveVector();
    const speed = currentRun.currentMoveSpeed;

    // Calcula o deslocamento em 3D
    const dx = movement.x * speed * delta;
    const dy = movement.y * speed * delta;
    const dz = movement.z * speed * delta;

    // ✅ MUTAÇÃO DIRETA: Atualiza valores sem disparar reatividade
    // Com shallowRef, mutations internas não disparam watchers
    position.x += dx;
    position.y += dy;
    position.z += dz;

    // Rotação suave na direção do movimento
    if (dx !== 0 || dy !== 0 || dz !== 0) {
      // Calcula o ângulo desejado baseado na direção do movimento
      const targetRotation = Math.atan2(-movement.x, -movement.z);

      // Interpolação suave da rotação atual para a rotação desejada
      const rotationSpeed = 8; // Quanto maior, mais rápido gira (ajuste ao gosto)

      // Calcula a diferença angular (shortest path)
      let diff = targetRotation - rotation.y;

      // Normaliza a diferença para [-PI, PI] (caminho mais curto)
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      // Aplica a interpolação suave
      rotation.y += diff * rotationSpeed * delta;
    }

    // Atualiza o cooldown do tiro
    if (currentRun.shotCooldown > 0) {
      currentRun.shotCooldown -= delta;
      if (currentRun.shotCooldown < 0) {
        currentRun.shotCooldown = 0;
      }
    }

    // Se o jogador tiver parado, vamos atirar um projetil se estiver dentro do cd correto
    if ((dx !== 0 || dy !== 0 || dz !== 0) === false) {
      // Aponta para o inimigo mais próximo e rotaciona o personagem nessa direção
      const nearestEnemy = projectileStore.nearestEnemyFromPlayer();

      if (nearestEnemy && nearestEnemy.position) {
        const dirX = nearestEnemy.position.x - position.x;
        const dirZ = nearestEnemy.position.z - position.z;

        // Calcula o ângulo desejado usando atan2
        const targetRotation = Math.atan2(-dirX, -dirZ);

        // Interpolação suave da rotação atual para a rotação do inimigo
        const rotationSpeed = 20;

        // Calcula a diferença angular (shortest path)
        let diff = targetRotation - rotation.y;

        // Normaliza a diferença para [-PI, PI] (caminho mais curto)
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        // Aplica a interpolação suave
        rotation.y += diff * rotationSpeed * delta;
      }

      // Verifica se o cooldown do tiro terminou
      if (currentRun.shotCooldown <= 0) {
        if (nearestEnemy && nearestEnemy.position) {
          // Se tem a skill de tiro traseiro, atira pra trás também
          const { hasSkill, getSkillLevel } = useSkillStore();
          const hasMultishot = hasSkill('multishot');
          const skillLevelMultishot = getSkillLevel('multishot');
          const multishotTimeout = 50; // ms entre os tiros do multishot

          // Calcula o vetor de direção do jogador para o inimigo
          const dirX = nearestEnemy.position.x - position.x;
          const dirZ = nearestEnemy.position.z - position.z;

          // Normaliza o vetor (magnitude = 1)
          const magnitude = Math.sqrt(dirX * dirX + dirZ * dirZ);

          if (magnitude > 0) {
            const direction = {
              x: dirX / magnitude,
              y: 0, // Y fixo, plano X-Z
              z: dirZ / magnitude
            };

            // contagem de hits que o projetil pode dar
            let hits = 1;
            // contagem de ricochetes que o projetil pode dar
            let bounces = 0;
            
            if (hasSkill('piercing_shot')) {
              const skillLevel = getSkillLevel('piercing_shot');
              hits += skillLevel; // Cada nível adicional adiciona 1 hit extra
            }

            if (hasSkill('ricochet_shot')) {
              const skillLevel = getSkillLevel('ricochet_shot');
              bounces += skillLevel; // Cada nível adicional adiciona 1 bounce extra
              console.log('Ricochet shots bounces:', bounces);
            }

            // Atira um projetil na direção do inimigo mais próximo
            projectileStore.spawnProjectile(
              'player', // type
              { x: position.x, y: position.y, z: position.z }, // position
              direction, // direção normalizada
              'player',
              'player',
              hits,
              bounces,
            );

            if (hasMultishot) {
              let localDelay = 0;
              for (let i = 1; i <= skillLevelMultishot; i++) {
                setTimeout(() => {
                  projectileStore.spawnProjectile(
                    'player', // type
                    { x: position.x, y: position.y, z: position.z }, // position
                    direction, // direção normalizada
                    'player',
                    'player',
                    hits,
                    bounces,
                  );
                }, localDelay + multishotTimeout);
                localDelay += multishotTimeout;
              }
            }

            if (hasSkill('back_shot')) {
              // If level 1, shoots one backwards middle centered
              // Level 2, shoots two backwards side by side
              const skillLevel = getSkillLevel('back_shot');

              if (skillLevel == 1) {
                // Tiro reto para trás
                const backDirection = {
                  x: -direction.x,
                  y: 0,
                  z: -direction.z
                };

                projectileStore.spawnProjectile(
                  'player',
                  { x: position.x, y: position.y, z: position.z },
                  backDirection,
                  'player',
                  'player',
                  hits,
                  bounces,
                );

                if (hasMultishot) {
                  let localDelay = 0;
                  for (let i = 1; i <= skillLevelMultishot; i++) {
                    setTimeout(() => {
                      projectileStore.spawnProjectile(
                        'player', // type
                        { x: position.x, y: position.y, z: position.z }, // position
                        backDirection, // direção normalizada
                        'player',
                        'player',
                        hits,
                        bounces,
                      );
                    }, localDelay + multishotTimeout);
                    localDelay += multishotTimeout;
                  }
                }
              }

              if (skillLevel >= 2) {
                // Dois tiros pra trás lado a lado na mesma direção pra trás
                const sideOffset = 0.5; // Ajuste a distância lateral entre os tiros

                const leftBackPosition = {
                  x: position.x + sideOffset * Math.cos(rotation.y + Math.PI / 2),
                  y: position.y,
                  z: position.z + sideOffset * Math.sin(rotation.y + Math.PI / 2)
                };

                const rightBackPosition = {
                  x: position.x + sideOffset * Math.cos(rotation.y - Math.PI / 2),
                  y: position.y,
                  z: position.z + sideOffset * Math.sin(rotation.y - Math.PI / 2)
                };

                const backDirection = {
                  x: -direction.x,
                  y: 0,
                  z: -direction.z
                };

                projectileStore.spawnProjectile(
                  'player',
                  leftBackPosition,
                  backDirection,
                  'player',
                  'player',
                  hits,
                  bounces,
                );

                projectileStore.spawnProjectile(
                  'player',
                  rightBackPosition,
                  backDirection,
                  'player',
                  'player',
                  hits,
                  bounces,
                );

                if (hasMultishot) {
                  let localDelay = 0;
                  for (let i = 1; i <= skillLevelMultishot; i++) {
                    setTimeout(() => {
                      projectileStore.spawnProjectile(
                        'player', // type
                        leftBackPosition, // position
                        backDirection, // direção normalizada
                        'player',
                        'player',
                        hits,
                        bounces,
                      );

                      projectileStore.spawnProjectile(
                        'player', // type
                        rightBackPosition, // position
                        backDirection, // direção normalizada
                        'player',
                        'player',
                        hits,
                        bounces,
                      );
                    }, localDelay + multishotTimeout);
                    localDelay += multishotTimeout;
                  }
                }
              }
            }

            if (hasSkill('diagonal_shot')) {
              const skillLevel = getSkillLevel('diagonal_shot');

              if (skillLevel === 1) {
                // Tiro em cone diagonal na frente do player
                const angleOffset = Math.PI / 4; // 45 graus em radianos

                const leftDirection = {
                  x: direction.x * Math.cos(angleOffset) - direction.z * Math.sin(angleOffset),
                  y: 0,
                  z: direction.x * Math.sin(angleOffset) + direction.z * Math.cos(angleOffset)
                };

                const rightDirection = {
                  x: direction.x * Math.cos(-angleOffset) - direction.z * Math.sin(-angleOffset),
                  y: 0,
                  z: direction.x * Math.sin(-angleOffset) + direction.z * Math.cos(-angleOffset)
                };

                projectileStore.spawnProjectile(
                  'player',
                  { x: position.x, y: position.y, z: position.z },
                  leftDirection,
                  'player',
                  'player',
                  hits,
                  bounces,
                );

                projectileStore.spawnProjectile(
                  'player',
                  { x: position.x, y: position.y, z: position.z },
                  rightDirection,
                  'player',
                  'player',
                  hits,
                  bounces,
                );

                if (hasMultishot) {
                  let localDelay = 0;
                  for (let i = 1; i <= skillLevelMultishot; i++) {
                    setTimeout(() => {
                      projectileStore.spawnProjectile(
                        'player', // type
                        { x: position.x, y: position.y, z: position.z }, // position
                        leftDirection, // direção normalizada
                        'player',
                        'player',
                        hits,
                        bounces,
                      );

                      projectileStore.spawnProjectile(
                        'player', // type
                        { x: position.x, y: position.y, z: position.z }, // position
                        rightDirection, // direção normalizada
                        'player',
                        'player',
                        hits,
                        bounces,
                      );
                    }, localDelay + multishotTimeout);
                    localDelay += multishotTimeout;
                  }
                }
              }

              if (skillLevel >= 2) {
                // Disparamos 4 tiros em cone diagonal na frente do player
                // 2 para esquerda e direita a 90 graus
                // 2 para esquerda e direita a 45 graus
                const angles = [
                  Math.PI / 2,    // direita
                  Math.PI / 4,    // nordeste
                  -Math.PI / 4,   // noroeste
                  -Math.PI / 2    // esquerda
                ];

                angles.forEach((angleOffset) => {
                  const diagonalDirection = {
                    x: direction.x * Math.cos(angleOffset) - direction.z * Math.sin(angleOffset),
                    y: 0,
                    z: direction.x * Math.sin(angleOffset) + direction.z * Math.cos(angleOffset)
                  };

                  projectileStore.spawnProjectile(
                    'player',
                    { x: position.x, y: position.y, z: position.z },
                    diagonalDirection,
                    'player',
                    'player',
                    hits,
                    bounces,
                  );

                  if (hasMultishot) {
                    let localDelay = 0;
                    for (let i = 1; i <= skillLevelMultishot; i++) {
                      setTimeout(() => {
                        projectileStore.spawnProjectile(
                          'player', // type
                          { x: position.x, y: position.y, z: position.z }, // position
                          diagonalDirection, // direção normalizada
                          'player',
                          'player',
                          hits,
                          bounces,
                        );
                      }, localDelay + multishotTimeout);
                      localDelay += multishotTimeout;
                    }
                  }
                });
              }
            }

            // Reseta o cooldown do tiro
            currentRun.shotCooldown = currentRun.shotCooldownTotal;
          }
        }
      }
    }

    // NOTA: Se precisar sincronizar com UI/debug (ex: mostrar posição na tela),
    // chame periodicamente (ex: a cada 10 frames):
    // if (frameCount % 10 === 0) {
    //   currentRun.setPlayerPosition(position.x, position.y, position.z);
    // }

    // Lógica adicional:
    // - Detecção de Colisão: usePhysics().checkCollision(position)
    // - Atualização da Direção (para onde o modelo deve olhar)
  };

  // NOTA: Para controles de Joystick/Touch, a lógica de `calculateMovementVector`
  // seria executada pelo componente UI (`VirtualJoystick.vue`) que chamaria
  // `currentRun.setMoveVector(x, y, z)` diretamente.

  return {
    update, // Exportamos apenas a função update
  };
}
