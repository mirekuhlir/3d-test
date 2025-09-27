// Simple asset preloader with progress callbacks.
// Loads GLTF models and textures using a shared THREE.LoadingManager.
// Exposes a single async function `preloadAssets(plan, onProgress)`.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Preload assets in background and report progress.
 *
 * @param {{models?: Array<{name: string, url: string}>, textures?: Array<{name: string, url: string}>}} plan
 * @param {(progress: number, info?: { url: string|null, loaded: number, total: number }) => void} [onProgress]
 * @returns {Promise<{ models: Record<string, any>, textures: Record<string, THREE.Texture> }>} Loaded assets
 */
export async function preloadAssets({ models = [], textures = [] } = {}, onProgress) {
  const manager = new THREE.LoadingManager();

  if (onProgress) {
    manager.onProgress = (url, loaded, total) => {
      onProgress(total ? loaded / total : 1, { url, loaded, total });
    };
  }

  const gltfLoader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);

  const results = { models: {}, textures: {} };

  const modelPromises = models.map(async ({ name, url }) => {
    const gltf = await gltfLoader.loadAsync(url);
    results.models[name] = gltf;
  });

  const texturePromises = textures.map(async ({ name, url }) => {
    const tex = await textureLoader.loadAsync(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    results.textures[name] = tex;
  });

  await Promise.all([...modelPromises, ...texturePromises]);

  onProgress?.(1, { url: null, loaded: 1, total: 1 });
  return results;
}

