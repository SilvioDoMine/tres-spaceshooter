// Fast Game: capítulos já concluídos podem rodar a 1x, 2x ou 3x (funções puras).
export const GAME_SPEEDS = [1, 2, 3];

/** Velocidade salva inválida volta para 1x. */
export function sanitizeGameSpeed(value) {
  const speed = Number(value);
  return GAME_SPEEDS.includes(speed) ? speed : 1;
}

/** Toque no botão: 1x → 2x → 3x → 1x. */
export function nextGameSpeed(current) {
  const index = GAME_SPEEDS.indexOf(sanitizeGameSpeed(current));
  return GAME_SPEEDS[(index + 1) % GAME_SPEEDS.length];
}

// Sala limpa: a nave corre 3x até a porta; no Fast Game o boost cai 40% para ainda dar para manobrar
export const CLEARED_ROOM_SPEED_BOOST = 3;
export const FAST_GAME_BOOST_REDUCTION = 0.4;

/** Multiplicador da velocidade de movimento com a sala limpa, na velocidade de jogo escolhida. */
export function clearedRoomSpeedBoost(gameSpeed) {
  return CLEARED_ROOM_SPEED_BOOST * (sanitizeGameSpeed(gameSpeed) > 1 ? 1 - FAST_GAME_BOOST_REDUCTION : 1);
}

/** Só acelera capítulos que o jogador já venceu. */
export function canFastGame(progress, chapter) {
  return Array.isArray(progress?.completed) && progress.completed.includes(Number(chapter));
}
