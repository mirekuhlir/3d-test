import '../style.css';
import { createRenderer } from '../core/renderer.js';
import { createScene } from '../core/scene.js';
import { createCamera } from '../player/camera.js';
import { createFPSControls } from '../player/controls.js';
import { createPointerLockOverlay, createCrosshair } from '../player/overlay.js';
import { addEnvironment } from '../objects/environment.js';
import { setupResize } from '../systems/resize.js';
import { createPlayerState } from '../player/state.js';
import { createLoop } from '../core/loop.js';
import { setupKeyboardInput } from '../player/keyboard.js';
import { getGroundTolerance } from '../player/config.js';
import { createCollisionSystem } from '../player/collision.js';
import { updatePlayer } from '../player/update.js';

const canvas = document.getElementById('app');

const renderer = createRenderer(canvas);
const scene = createScene();
const camera = createCamera();

const controls = createFPSControls(camera, renderer.domElement);
scene.add(controls.getObject());

addEnvironment(scene);
createPointerLockOverlay(controls);
createCrosshair(controls);
setupResize({ renderer, camera });

const state = createPlayerState();

const GROUND_TOLERANCE = getGroundTolerance();
const { isCollidingAtPosition } = createCollisionSystem(scene, GROUND_TOLERANCE);

renderer.domElement.addEventListener('click', () => {
  if (!controls.isLocked) controls.lock();
});

const cleanupKeyboard = setupKeyboardInput(state);

const loop = createLoop({
  renderer,
  scene,
  camera,
  update: (delta) => {
    updatePlayer({ state, controls, isCollidingAtPosition, delta });
  }
});

loop.start();

