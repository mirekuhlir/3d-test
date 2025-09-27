// Application entry point
// -----------------------
// Responsibility: Initialize the renderer, show the main menu with a tiny
// animated background, preload assets (models/textures) while updating a UI
// progress bar, and start the gameplay scene on Play.
import '../style.css';
import { createRenderer } from '../engine/renderer.js';
import { createMenu } from '../ui/menu.js';
import { preloadAssets } from './assets.js';
import { createGame } from './game.js';
import { assetsPlan } from '../assets/index.js';

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

// Begin background preloading; update the menu bar
preloadAssets(assetsPlan, (progress) => {
  menu.setProgress(progress);
}).then((assets) => {
  loadedAssets = assets;
  menu.setProgress(1);
  menu.enablePlay();
});

