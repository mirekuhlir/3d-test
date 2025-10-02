// Game bootstrap
// --------------
// Responsibility: Compose and wire the main gameplay scene — camera, player
// controls, environment, HUD overlays, collision system, dev mode, and the
// render loop. Provides lifecycle helpers to start/stop and dispose the game.
import * as THREE from 'three';
import { createScene } from '../engine/scene.js';
import { createCamera } from '../player/view/camera.js';
import { createFPSControls } from '../player/view/controls.js';
import { createPointerLockOverlay, createCrosshair, createFPSMeter } from '../player/view/overlay.js';
import { addEnvironment } from '../objects/environment/index.js';
import { setupResize } from '../engine/resize.js';
import { createPlayerState } from '../player/physics/state.js';
import { createLoop } from '../engine/loop.js';
import { setupKeyboardInput } from '../player/input/keyboard.js';
import { DEFAULT_GROUND_TOLERANCE } from '../player/physics/constants.js';
import { createCollisionSystem } from '../player/physics/collision.js';
import { updatePlayer } from '../player/physics/update.js';
import { createDevMode } from '../dev/mode.js';
import { isMobileDevice } from '../utils/device.js';
import { setupTouchInput } from '../player/input/touch.js';
import { ensureLandscapeOrientation, setupAutoLandscapeOrientation } from '../utils/orientation.js';

export function createGame({ renderer, assets = {} } = {}) {
  // World and camera
  const scene = createScene();
  const camera = createCamera();

  // First-person controls bound to the renderer canvas
  const controls = createFPSControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  let cleanupKeyboard = null;
  let cleanupTouch = null;

  const usingMobileControls = isMobileDevice();

  // Populate level/environment geometry
  addEnvironment(scene, assets);

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
  let cleanupAutoLandscape = null;

  // Set overlay reference in dev mode
  devMode.setOverlay(overlay);

  // Clicking the canvas either locks base controls or the dev controls
  const onCanvasClick = () => devMode.handleCanvasClick();
  renderer.domElement.addEventListener('click', onCanvasClick);

  if (usingMobileControls) {
    controls.lock = () => {};
    controls.unlock = () => {};
    controls.isLocked = true;
    cleanupTouch = setupTouchInput(state, { camera, controls });
    cleanupAutoLandscape = setupAutoLandscapeOrientation({
      fullscreenFallback: true,
      fullscreenTarget: renderer?.domElement?.parentElement || document?.documentElement
    });
  }

  // Gameplay key bindings (WASD, jump, crouch)
  if (!usingMobileControls) {
    cleanupKeyboard = setupKeyboardInput(state);
  }

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
    cleanupKeyboard?.();
    cleanupTouch?.();
    cleanupAutoLandscape?.();
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

