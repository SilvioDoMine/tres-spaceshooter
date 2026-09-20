import { LEVEL_1 } from './LevelOneConfig.js';
import { LEVEL_2 } from './LevelTwoConfig.js';
import { LEVEL_3 } from './LevelThreeConfig.js';
import { LEVEL_4 } from './LevelFourConfig.js';
import { LEVEL_5 } from './LevelFiveConfig.js';

// Capítulos jogáveis, na ordem de desbloqueio. O id é o mesmo de /play/:id.
export const LEVELS = { 1: LEVEL_1, 2: LEVEL_2, 3: LEVEL_3, 4: LEVEL_4, 5: LEVEL_5 };
export const CHAPTER_COUNT = Object.keys(LEVELS).length;

// Textos do lobby (carrossel e cartão do adversário)
export const CHAPTER_INFO = {
  1: { boss: 'SENTINELA', subtitle: 'Patrulha orbital', description: 'Limpe todas as salas' },
  2: { boss: 'HARPIA', subtitle: 'Interceptador pesado', description: 'Estaleiro na nebulosa' },
  3: { boss: 'COLOSSO', subtitle: 'Comando da frota', description: 'Rompa o comando da frota' },
  4: { boss: 'LEVIATÃ', subtitle: 'Couraçado de cerco', description: 'Atravesse a linha de cerco' },
  5: { boss: 'CATEDRAL', subtitle: 'Nave-mãe', description: 'Resista às ondas da nave-mãe' },
};
