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

const assetsPlan = {
  models: [
    // { name: 'world', url: '/models/world.glb' },
  ],
  textures: [
    // { name: 'albedo', url: '/textures/ground_albedo.jpg' },
  ]
};

preloadAssets(assetsPlan, (progress) => {
  menu.setProgress(progress);
}).then((assets) => {
  loadedAssets = assets;
  menu.setProgress(1);
  menu.enablePlay();
});

