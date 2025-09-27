// Application entry point
// -----------------------
// Responsibility: Initialize the renderer, show the main menu with a tiny
// animated background, preload assets (models/textures) while updating a UI
// progress bar, and start the gameplay scene on Play.
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
    // Stop and remove the menu when the user starts the game
    menu.stop();
    menu.destroy();

    // Spin up the game and pass any preloaded assets
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
  // Convert a map of path->url into { name, url } entries for the preloader
  return Object.entries(globResult).map(([path, url]) => {
    const name = path.split('/').pop().replace(/\.[^.]+$/, '');
    return { name, url };
  });
}

const assetsPlan = {
  models: toPlan(modelModules),
  textures: toPlan(textureModules),
};

// Begin background preloading; update the menu bar
preloadAssets(assetsPlan, (progress) => {
  menu.setProgress(progress);
}).then((assets) => {
  loadedAssets = assets;
  menu.setProgress(1);
  menu.enablePlay();
});

