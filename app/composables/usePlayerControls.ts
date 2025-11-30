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
import { useCurrentRunStore } from '~/stores/currentRun';
import { onMounted, onUnmounted } from 'vue';

export function usePlayerControls() {
  const currentRun = useCurrentRunStore();

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
  onMounted(() => {
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
