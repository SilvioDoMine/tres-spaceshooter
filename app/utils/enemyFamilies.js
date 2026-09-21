import { TACTICAL_FLEET } from '../data/tacticalFleetCatalog.js';
import { SPECIALIST_BASES } from './fleetTactics.js';
// Visual identity is separate from the combat type: rewards, AI, collisions and
// attack sockets retain the original role, including summoned fragments.
export const FAMILY_ROLES = Object.freeze([
  'ufo', 'ufofast', 'kamikaze', 'asteroid', 'miniHarpy', 'miniHive',
  'torusEnemy', 'compositeEnemy', 'miniasteroid', 'miniboss', 'hiveDrone',
]);

export function enemyFamilyModel(type, chapter) {
  return Number.isInteger(chapter) && chapter >= 2 && chapter <= 5 && FAMILY_ROLES.includes(type)
    ? `c${chapter}_${type}` : undefined;
}

export function enemyFamilyUrl(type, model) {
  if (SPECIALIST_BASES.includes(type) && TACTICAL_FLEET[model]) return TACTICAL_FLEET[model].url;
  // A model must belong to this combat role: its hardpoints are an exact match.
  return [2, 3, 4, 5].some(chapter => enemyFamilyModel(type, chapter) === model) && model
    ? `/models/enemies/${model}.glb` : undefined;
}

