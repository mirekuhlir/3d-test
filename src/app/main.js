import '../style.css';
import { createRenderer } from '../core/renderer.js';
import { createMenu } from './menu.js';
import { preloadAssets } from './assets.js';
import { createGame } from './game.js';

const canvas = document.getElementById('app');
const renderer = createRenderer(canvas);

let gameInstance = null;
let loadedAssets = null;

const menu = createMenu({
  renderer,
  onPlay: () => {
    menu.stop();
    menu.destroy();

    gameInstance = createGame({ renderer, assets: loadedAssets || {} });
    gameInstance.start();
  }
});

menu.start();

// Auto-discover assets with Vite's glob import.
// Place files under `src/assets/models` and `src/assets/textures`.
const textureModules = import.meta.glob('../assets/textures/**/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });
const modelModules = import.meta.glob('../assets/models/**/*.{glb,gltf}', { eager: true, as: 'url' });

function toPlan(globResult) {
  return Object.entries(globResult).map(([path, url]) => {
    const name = path.split('/').pop().replace(/\.[^.]+$/, '');
    return { name, url };
  });
}

const assetsPlan = {
  models: toPlan(modelModules),
  textures: toPlan(textureModules),
};

preloadAssets(assetsPlan, (progress) => {
  menu.setProgress(progress);
}).then((assets) => {
  loadedAssets = assets;
  menu.setProgress(1);
  menu.enablePlay();
});

