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
// A intro fica fora da contagem; as entradas seguintes são todas as salas jogáveis.
export const intro = () => ({ stageId: '1_Combat_Intro', type: 'intro', width: 10, height: 20, waves: [], door: door(), playerStartPosition: start() });

// Cada encontro mantém seu tier original mesmo quando uma wave vira uma sala.
// Capítulos 1–4 são rápidos; do 5 em diante o autor pode manter waves ou usar boss-rush.
export function chapterStages(stages, chapter, structure = chapter <= 4 ? 'quick' : 'waves') {
  if (!['quick', 'waves', 'boss-rush'].includes(structure)) throw new Error(`Unknown chapter structure: ${structure}`);
  let tier = 0, room = 0;
  return stages.flatMap(stage => {
    if (stage.type === 'intro') return [{ ...stage }];
    tier += 1;
    const combatTier = stage.combatTier ?? tier;
    if (structure === 'boss-rush' && stage.type !== 'boss') throw new Error('Boss-rush accepts only boss rooms');
    const encounters = structure === 'quick' ? stage.waves.map(w => [w]) : [stage.waves];
    return encounters.map(waves => ({ ...stage, combatTier,
      stageId: `${++room}_${stage.type === 'boss' ? 'Boss' : 'Combat'}`,
      waves: waves.map(w => ({ ...w, enemies: w.enemies.map(g => ({ ...g })) })),
    }));
  });
}
