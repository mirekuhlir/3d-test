// Main gameplay scene: player controls, environment, HUD and loop.
import * as THREE from 'three';
import { createScene } from '../core/scene.js';
import { createCamera } from '../player/camera.js';
import { createFPSControls } from '../player/controls.js';
import { createPointerLockOverlay, createCrosshair, createFPSMeter } from '../player/overlay.js';
import { addEnvironment } from '../objects/environment.js';
import { setupResize } from '../systems/resize.js';
import { createPlayerState } from '../player/state.js';
import { createLoop } from '../core/loop.js';
import { setupKeyboardInput } from '../player/keyboard.js';
import { DEFAULT_GROUND_TOLERANCE } from '../player/constants.js';
import { createCollisionSystem } from '../player/collision.js';
import { updatePlayer } from '../player/update.js';
import { createDevMode } from '../dev/mode.js';

export function createGame({ renderer, assets = {} } = {}) {
  const scene = createScene();
  const camera = createCamera();

  const controls = createFPSControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  let cleanupKeyboard = null;

  addEnvironment(scene);

  // Example usage of loaded assets (if provided):
  // if (assets.models?.world) scene.add(assets.models.world.scene);

  const state = createPlayerState();
  const { isCollidingAtPosition, getCollisionAtPosition } = createCollisionSystem(scene,DEFAULT_GROUND_TOLERANCE );

  // Initialize dev mode
  const devMode = createDevMode({
    renderer,
    scene,
    baseCamera: camera,
    baseControls: controls,
    overlay: null, // overlay will be created later
    state,
    pauseGameplay: () => {
      cleanupKeyboard?.();
    },
    resumeGameplay: () => {
      cleanupKeyboard = setupKeyboardInput(state);
    }
  });

  const overlay = createPointerLockOverlay(controls, () => devMode.isActive());
  const crosshair = createCrosshair(controls);
  const fps = createFPSMeter();
  const cleanupResize = setupResize({ renderer, camera });

  // Set overlay reference in dev mode
  devMode.setOverlay(overlay);

  const onCanvasClick = () => devMode.handleCanvasClick();
  renderer.domElement.addEventListener('click', onCanvasClick);

  cleanupKeyboard = setupKeyboardInput(state);

  // Attach dev button to overlay
  devMode.attachDevButton(overlay);

  const loop = createLoop({
    renderer,
    scene,
    camera,
    getCamera: () => devMode.getCamera(),
    update: (delta) => {
      if (!devMode.isActive()) {
        updatePlayer({ state, controls, isCollidingAtPosition, getCollisionAtPosition, delta });
      }
      devMode.update(delta);
      fps.tick();
    }
  });

  function dispose() {
    loop.stop();
    cleanupKeyboard();
    renderer.domElement.removeEventListener('click', onCanvasClick);
    fps.destroy();
    overlay.remove();
    crosshair.remove();
    devMode.dispose();
    cleanupResize();
    // Optionally dispose scene resources here if needed.
  }

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    dispose
  };
}

