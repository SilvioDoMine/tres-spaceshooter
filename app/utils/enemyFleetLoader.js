import { FLEET_MODEL_REVISIONS } from '../data/fleetModelRevisions.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ENEMY_FLEET } from './enemyFleet.js';
import { enemyFamilyUrl } from './enemyFamilies.js';

const cache = new Map();
export async function loadFleetModel(type, model) {
  const familyUrl = enemyFamilyUrl(type, model);
  const entry = ENEMY_FLEET[type];
  // The public filename stays stable, so changed base GLBs need a content version.
  const url = familyUrl ? `${familyUrl}?v=${FLEET_MODEL_REVISIONS[model] ?? 'initial'}` : `${entry.url}${entry.revision ? `?v=${entry.revision}` : ''}`;
  if (!cache.has(url)) cache.set(url, new GLTFLoader().loadAsync(url).then(gltf => gltf.scene).catch(error => {
    cache.delete(url);
    throw error;
  }));
  const source = await cache.get(url);
  const root = source.clone(true), materials = new Map();
  root.traverse(part => {
    if (!part.isMesh) return;
    const clone = material => {
      if (!materials.has(material)) materials.set(material, material.clone());
      return materials.get(material);
    };
    part.material = Array.isArray(part.material) ? part.material.map(clone) : clone(part.material);
  });
  // Geometry/textures belong to the cache; only materials belong to this instance.
  return { root, dispose: () => materials.forEach(material => material.dispose()) };
}
