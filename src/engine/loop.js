/**
 * Creates a simple render loop (game loop) for Three.js.
 *
 * What it does:
 * - Drives frames using requestAnimationFrame.
 * - Measures frame time via THREE.Clock and clamps delta to a max of 50 ms for stability.
 * - Calls the user-supplied `update(delta)` each frame before rendering.
 * - Exposes `start()` and `stop()` methods to control the loop.
 *
 * Parameters:
 * - renderer: THREE.WebGLRenderer — renderer used to draw the scene
 * - scene: THREE.Scene — the scene to render
 * - camera: THREE.Camera — the camera to render with
 * - update: (delta: number) => void — called every frame with delta time in seconds
 * - getCamera?: () => THREE.Camera — optional camera source (e.g., dev mode)
 *
 * Returns:
 * - { start: () => void, stop: () => void }
 *
 * Example usage:
 *   const loop = createLoop({ renderer, scene, camera, update });
 *   loop.start();
 */
import * as THREE from 'three';

export function createLoop({ renderer, scene, camera, getCamera, update }) {
  // Clock for measuring time between frames (delta time)
  const clock = new THREE.Clock();
  // ID of the current requestAnimationFrame; null means the loop is not running
  let rafId = null;

  function onFrame() {
    // Delta in seconds; clamped to 0.05s (~20 FPS minimum) to avoid unstable
    // physics or tunneling on slow frames.
    const delta = Math.min(clock.getDelta(), 0.05);
    // User update logic before rendering (may mutate scene/camera)
    update(delta);
    // Render the current frame
    const activeCamera = typeof getCamera === 'function' ? getCamera() : camera;
    renderer.render(scene, activeCamera);
    // Schedule the next frame
    rafId = requestAnimationFrame(onFrame);
  }

  return {
    start() {
      // Start the loop only if it is not already running
      if (rafId === null) {
        // Reset initial delta after a pause to avoid an excessively large first delta
        clock.getDelta();
        rafId = requestAnimationFrame(onFrame);
      }
    },
    stop() {
      // Stop the loop if it is currently running
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
}