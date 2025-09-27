// Asset preloader
// ----------------
// Responsibility: Load GLTF models and 2D textures ahead of time and report
// aggregate progress back to the UI. Uses a shared THREE.LoadingManager so
// progress reflects all sub-loads. Exposes a single async function
// `preloadAssets(plan, onProgress)` that returns a simple registry of models,
// textures and font JSON definitions by name.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function loadFontJson(url) {
  return fetch(url, { cache: 'force-cache' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${url}`);
    }
    return response.json();
  });
}

/**
 * Preload assets in background and report progress.
 *
 * @param {{models?: Array<{name: string, url: string}>, textures?: Array<{name: string, url: string}>, fonts?: Array<{name: string, url: string}>}} plan
 * @param {(progress: number, info?: { url: string|null, loaded: number, total: number }) => void} [onProgress]
 * @returns {Promise<{ models: Record<string, any>, textures: Record<string, THREE.Texture>, fonts: Record<string, any> }>} Loaded assets
 */
export async function preloadAssets({ models = [], textures = [], fonts = [] } = {}, onProgress) {
  const manager = new THREE.LoadingManager();

  if (onProgress) {
    manager.onProgress = (url, loaded, total) => {
      const normalized = total ? loaded / total : 1;
      onProgress(normalized, { url, loaded, total });
    };
  }

  const gltfLoader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);

  const results = { models: {}, textures: {}, fonts: {} };

  const modelPromises = models.map(async ({ name, url }) => {
    const gltf = await gltfLoader.loadAsync(url);
    results.models[name] = gltf;
  });

  const texturePromises = textures.map(async ({ name, url }) => {
    const tex = await textureLoader.loadAsync(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    results.textures[name] = tex;
  });

  const fontPromises = fonts.map(async ({ name, url }) => {
    const data = await loadFontJson(url);
    results.fonts[name] = data;
  });

  await Promise.all([...modelPromises, ...texturePromises, ...fontPromises]);

  onProgress?.(1, { url: null, loaded: 1, total: 1 });
  return results;
}

