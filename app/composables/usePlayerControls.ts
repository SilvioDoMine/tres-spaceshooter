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
import { onMounted, onUnmounted, watch } from 'vue';
import { shotFormation, muzzlePosition, rotateShot } from '~/utils/combatPatterns';

export function usePlayerControls() {
  const currentRun = useCurrentRunStore();
  const projectileStore = useProjectileStore();
  const dilation = useSpatialDilation();

  // Estado interno para rastrear quais teclas estão pressionadas
  const keysPressed = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!currentRun.isPlaying) return;
    const key = event.key;
    if (key === ' ' || key === 'Shift') {
      event.preventDefault();
      return;
    }
    if (keysPressed.hasOwnProperty(key)) {
      keysPressed[key as keyof typeof keysPressed] = true;
      calculateMovementVector();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === ' ' || key === 'Shift') {
      event.preventDefault();
      return;
    }
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
   * O combate acontece somente no plano X/Z.
   */
  const calculateMovementVector = () => {
    if (!currentRun.isPlaying) {
      currentRun.setMoveVector(0, 0, 0);
      return;
    }
    let dx = 0; // Mudança no eixo X (Horizontal)
    let dz = 0; // Mudança no eixo Z (Profundidade/Frente)

    // W = Cima na tela (Z-), S = Baixo na tela (Z+)
    // (Alinhado com o joystick: arrastar para cima na tela = Z-, para baixo = Z+)
    if (keysPressed.w || keysPressed.ArrowUp) dz -= 1;   // Cima na tela (Z-)
    if (keysPressed.s || keysPressed.ArrowDown) dz += 1; // Baixo na tela (Z+)

    // A = Esquerda (X-), D = Direita (X+)
    if (keysPressed.a || keysPressed.ArrowLeft) dx -= 1;  // Esquerda
    if (keysPressed.d || keysPressed.ArrowRight) dx += 1; // Direita

    // Normalização no plano para que mover na diagonal não seja mais rápido.
    const magnitude = Math.sqrt(dx * dx + dz * dz);
    if (magnitude > 0) {
      dx /= magnitude;
      dz /= magnitude;
    }

    // ✅ setMoveVector dispara reatividade apenas quando teclas mudam
    currentRun.setMoveVector(dx, 0, dz);
  };

  // Clear held keys on every pause (including upgrade menus), so resuming
  // cannot replay a movement command issued behind a modal.
  watch(() => currentRun.isPlaying, (playing) => {
    if (playing) return;
    for (const key of Object.keys(keysPressed) as (keyof typeof keysPressed)[]) keysPressed[key] = false;
    currentRun.setMoveVector(0, 0, 0);
  }, { flush: 'sync' });

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

    // Calcula o deslocamento no plano X/Z.
    const spatial = dilation.update(position, movement, delta);
    if(spatial.damage>0){currentRun.takeDamage(spatial.damage);if(currentRun.currentHealth<=0)return}
    const dx = spatial.x * speed * delta;
    const dz = spatial.z * speed * delta;

    // Verifica se pode mover, por exemplo está no limite do mapa
    // Resolve each horizontal axis independently so diagonal movement slides
    // along a boundary instead of freezing the ship and its weapon cooldown.
    const allowedX = currentRun.canPlayerMoveTo(position.x + dx, position.y, position.z);
    const allowedZ = currentRun.canPlayerMoveTo(position.x, position.y, position.z + dz);

    // ✅ MUTAÇÃO DIRETA: Atualiza valores sem disparar reatividade
    // Com shallowRef, mutations internas não disparam watchers
    if (allowedX) position.x += dx;
    position.y = 0;
    if (allowedZ) position.z += dz;

    // Rotação suave na direção do movimento
    if (dx !== 0 || dz !== 0) {
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
    if ((dx !== 0 || dz !== 0) === false) {
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
          const skills = useSkillStore();
          const multi = skills.getSkillLevel('multishot') || 0;
          const damage = PlayerBaseStats.projectiles.damage * usePlayerStats().getDamageMultiplier;
          const dirX = nearestEnemy.position.x - position.x, dirZ = nearestEnemy.position.z - position.z;
          const magnitude = Math.hypot(dirX, dirZ);
          if (magnitude > 0) {
            const direction = { x: dirX / magnitude, z: dirZ / magnitude };
            const piercing = skills.getSkillLevel('piercing_shot') || 0;
            const hits = piercing ? SkillsList.piercing_shot.levels[piercing].value : 1;
            const bounces = skills.getSkillLevel('ricochet_shot') || 0;
            const power = usePlayerStats().getDamageMultiplier;
            let sounded = false;
            const fire = (heading: {x:number,z:number}, baseSide = 0, multiplier = 1, rearSide = 0, count = 1 + multi, formationPenalty = true) => {
              shotFormation(count).forEach((slot, index) => {
                const origin = muzzlePosition(position, heading, slot.side + baseSide, slot.forward);
                const efficiency = !formationPenalty || !multi || index === Math.floor(count/2) ? 1 : SkillsList.multishot.levels[multi].value;
                projectileStore.spawnProjectile('player', origin, heading, 'player', 'player',
                  hits, bounces, damage * multiplier * efficiency, [], {
                    power, silent: sounded,
                    rearTurn: rearSide ? { origin: {...origin}, forward: {...heading}, side: slot.side < 0 ? -1 : 1,
                      radius: .65 + Math.abs(slot.side)*.25, traveled: 0 } : null,
                  });
                sounded = true;
              });
            };
            fire(direction);
            const rear = skills.getSkillLevel('back_shot') || 0;
            if (rear) {
              fire(direction, 0, SkillsList.back_shot.levels[rear].value, 1, rear, false);
            }
            const diagonal = skills.getSkillLevel('diagonal_shot') || 0;
            if (diagonal) {
              const angles = diagonal >= 2 ? [-Math.PI/2, -Math.PI/4, Math.PI/4, Math.PI/2] : [-Math.PI/4, Math.PI/4];
              angles.forEach(angle => fire(rotateShot(direction, angle), 0, SkillsList.diagonal_shot.levels[diagonal].value));
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
