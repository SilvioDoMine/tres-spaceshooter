import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ENEMY_FLEET } from './enemyFleet.js';

const cache = new Map();
export async function loadFleetModel(type) {
  const url = ENEMY_FLEET[type].url;
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
