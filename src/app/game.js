// Game bootstrap
// --------------
// Responsibility: Compose and wire the main gameplay scene — camera, player
// controls, environment, HUD overlays, collision system, dev mode, and the
// render loop. Provides lifecycle helpers to start/stop and dispose the game.
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
  // World and camera
  const scene = createScene();
  const camera = createCamera();

  // First-person controls bound to the renderer canvas
  const controls = createFPSControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  let cleanupKeyboard = null;

  // Populate level/environment geometry
  addEnvironment(scene);

  // Example usage of loaded assets (if provided):
  // if (assets.models?.world) scene.add(assets.models.world.scene);

  const state = createPlayerState();
  // Build a static BVH-based collision system from the scene
  const { isCollidingAtPosition, getCollisionAtPosition } = createCollisionSystem(scene, DEFAULT_GROUND_TOLERANCE);

  // Initialize dev mode (free-fly camera + debug helpers)
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

  // Player-facing UI overlays
  const overlay = createPointerLockOverlay(controls, () => devMode.isActive());
  const crosshair = createCrosshair(controls);
  const fps = createFPSMeter();
  const cleanupResize = setupResize({ renderer, camera });

  // Set overlay reference in dev mode
  devMode.setOverlay(overlay);

  // Clicking the canvas either locks base controls or the dev controls
  const onCanvasClick = () => devMode.handleCanvasClick();
  renderer.domElement.addEventListener('click', onCanvasClick);

  // Gameplay key bindings (WASD, jump, crouch)
  cleanupKeyboard = setupKeyboardInput(state);

  // Attach dev button to overlay
  devMode.attachDevButton(overlay);

  // Central frame loop; switches camera when dev mode is active
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
    // Full teardown for a clean restart
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

