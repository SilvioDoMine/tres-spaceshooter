// Blocos de construção das salas, compartilhados por todos os capítulos.
export const door = () => ({ position: { x: 0, y: 0, z: -9 }, size: { width: 4, height: 8 } });
export const start = (z = 0) => ({ x: 0, y: 0, z });
export const group = (enemyType, count, delay = .8) => ({ enemyType, count, delay });
export const wave = (...enemies) => ({ enemies });
export const combat = (room, waves, type = 'combat') => ({
  stageId: `${room}_${type === 'boss' ? 'Boss' : 'Combat'}`,
  type,
  width: 30,
  height: type === 'boss' ? 30 : 24,
  waves,
  door: door(),
  playerStartPosition: start(),
});
// A intro fica fora da contagem; as entradas seguintes são as salas jogáveis 1–20.
export const intro = () => ({ stageId: '1_Combat_Intro', type: 'intro', width: 10, height: 20, waves: [], door: door(), playerStartPosition: start() });
