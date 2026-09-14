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
import { weaponMounts, worldHardpoint } from '~/utils/combatPatterns';
import { emitMuzzleFlash } from '~/utils/weaponVisuals';
import { useEquipmentEffectsStore } from '~/stores/useEquipmentEffectsStore';

export function usePlayerControls() {
  const currentRun = useCurrentRunStore();
  const projectileStore = useProjectileStore();
  const dilation = useSpatialDilation();
  const equipmentEffects = useEquipmentEffectsStore();

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
      // Os hardpoints disparam pela rotação lógica da nave: com o tiro pronto ela
      // encaixa direto no centro do alvo (o modelo visual suaviza o giro)
      const readyToFire = currentRun.shotCooldown <= 0;

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

        // Tiro pronto: mira exata no mesmo frame, como antes dos hardpoints, para
        // pequenos passos não impedirem o disparo. Em cooldown: acompanha suave.
        rotation.y += readyToFire ? diff : diff * Math.min(1, rotationSpeed * delta);
      }

      // Verifica se o cooldown do tiro terminou
      if (readyToFire) {
        if (nearestEnemy && nearestEnemy.position) {
          const skills = useSkillStore();
          const volley = equipmentEffects.prepareVolley();
          const multi = skills.getSkillLevel('multishot') || 0;
          const damage = usePlayerStats().damage;
          const dirX = nearestEnemy.position.x - position.x, dirZ = nearestEnemy.position.z - position.z;
          const magnitude = Math.hypot(dirX, dirZ);
          if (magnitude > 0) {
            const direction = { x: dirX / magnitude, z: dirZ / magnitude };
            const piercing = skills.getSkillLevel('piercing_shot') || 0;
            const hits = (piercing ? SkillsList.piercing_shot.levels[piercing].value : 1) + volley.extraHits;
            const bounces = (skills.getSkillLevel('ricochet_shot') || 0) + volley.extraBounces;
            const power = usePlayerStats().getDamageMultiplier;
            const rear = skills.getSkillLevel('back_shot') || 0;
            const diagonal = skills.getSkillLevel('diagonal_shot') || 0;
            const mounts = weaponMounts(multi, rear, diagonal);
            mounts.forEach((mount, shotIndex) => {
              const { origin, direction: heading } = worldHardpoint(position, rotation.y, mount);
              const center = mount.index === Math.floor(mount.count / 2);
              const extra = mount.role === 'rear' ? mount.bonus : !center;
              const efficiency = !multi || !extra ? 1 : SkillsList.multishot.levels[multi].value;
              const factor = mount.role === 'rear' ? SkillsList.back_shot.levels[rear].value
                : mount.role === 'diagonal' ? SkillsList.diagonal_shot.levels[diagonal].value : 1;
              const special = mount.role === 'front' && center;
              const burstMultiplier = special ? volley.damageMultiplier : 1;
              projectileStore.spawnProjectile('player', origin, heading, 'player', 'player',
                hits, bounces, damage * factor * efficiency * burstMultiplier, [], {
                  power: power * burstMultiplier, silent: shotIndex > 0, ion: equipmentEffects.effects.weaponStyle === 'ion',
                  burst: special && volley.burst, beam: special && volley.burst, beamMount: mount, beamAge: 0, beamTick: 0, beamDuration: .65, aoeRadius: 0,
                });
              emitMuzzleFlash(mount.id, special && volley.burst);
              if (special && volley.echo) {
                projectileStore.spawnProjectile('player', origin, heading, 'player', 'player',
                  hits, bounces, damage, [], { power, silent: true, echo: true, spawnDelay: .10, canCrit: volley.echoCanCrit });
              }
            });
            // Reseta o cooldown do tiro
            currentRun.shotCooldown = equipmentEffects.effectiveShotCooldown(currentRun.shotCooldownTotal);
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
