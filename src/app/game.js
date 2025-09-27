// Main gameplay scene: player controls, environment, HUD and loop.
import { createScene } from '../core/scene.js';
import { createCamera } from '../player/camera.js';
import { createFPSControls } from '../player/controls.js';
import { createPointerLockOverlay, createCrosshair, createFPSMeter } from '../player/overlay.js';
import { addEnvironment } from '../objects/environment.js';
import { setupResize } from '../systems/resize.js';
import { createPlayerState } from '../player/state.js';
import { createLoop } from '../core/loop.js';
import { setupKeyboardInput } from '../player/keyboard.js';
import { getGroundTolerance } from '../player/config.js';
import { createCollisionSystem } from '../player/collision.js';
import { updatePlayer } from '../player/update.js';

export function createGame({ renderer, assets = {} } = {}) {
  const scene = createScene();
  const camera = createCamera();

  const controls = createFPSControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  addEnvironment(scene);

  // Example usage of loaded assets (if provided):
  // if (assets.models?.world) scene.add(assets.models.world.scene);

  const overlay = createPointerLockOverlay(controls);
  const crosshair = createCrosshair(controls);
  const fps = createFPSMeter();
  const cleanupResize = setupResize({ renderer, camera });

  const state = createPlayerState();
  const GROUND_TOLERANCE = getGroundTolerance();
  const { isCollidingAtPosition, getCollisionAtPosition } = createCollisionSystem(scene, GROUND_TOLERANCE);

  const onCanvasClick = () => {
    if (!controls.isLocked) controls.lock();
  };
  renderer.domElement.addEventListener('click', onCanvasClick);

  const cleanupKeyboard = setupKeyboardInput(state);

  const loop = createLoop({
    renderer,
    scene,
    camera,
    update: (delta) => {
      updatePlayer({ state, controls, isCollidingAtPosition, getCollisionAtPosition, delta });
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
    cleanupResize();
    // Optionally dispose scene resources here if needed.
  }

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    dispose
  };
}

