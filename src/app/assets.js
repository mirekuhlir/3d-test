// Asset preloader
// ----------------
// Responsibility: Load GLTF models and 2D textures ahead of time and report
// aggregate progress back to the UI. Uses a shared THREE.LoadingManager so
// progress reflects all sub-loads. Exposes a single async function
// `preloadAssets(plan, onProgress)` that returns a simple registry of models
// and textures by name.

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
  // Manager aggregates load callbacks from all loaders we attach it to
  const manager = new THREE.LoadingManager();

  if (onProgress) {
    // Normalized [0..1] progress forwarded to the caller
    manager.onProgress = (url, loaded, total) => {
      onProgress(total ? loaded / total : 1, { url, loaded, total });
    };
  }

  // Reuse a single manager for both model and texture loaders
  const gltfLoader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);

  const results = { models: {}, textures: {} };

  // Queue model loads (GLB/GLTF)
  const modelPromises = models.map(async ({ name, url }) => {
    const gltf = await gltfLoader.loadAsync(url);
    results.models[name] = gltf;
  });

  // Queue texture loads (PNG/JPG/...)
  const texturePromises = textures.map(async ({ name, url }) => {
    const tex = await textureLoader.loadAsync(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    results.textures[name] = tex;
  });

  // Wait for all requested assets to complete
  await Promise.all([...modelPromises, ...texturePromises]);

  // Ensure a final 100% progress tick
  onProgress?.(1, { url: null, loaded: 1, total: 1 });
  return results;
}

