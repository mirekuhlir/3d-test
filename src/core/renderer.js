/**
 * Renderer module
 *
 * Overview: Creates and returns a configured `THREE.WebGLRenderer` responsible
 * for rendering a 3D scene into a given HTML `<canvas>` element. The settings
 * aim for good visual fidelity (correct color space, tone mapping) while
 * keeping performance reasonable (capped pixel ratio, viewport sizing,
 * anti-aliasing).
 *
 * Usage: Import `createRenderer(canvas)` and pass a reference to the `<canvas>`
 * you want to render into. The function returns a renderer ready to be used in
 * the render loop.
 */
import * as THREE from 'three';

export function createRenderer(canvas) {
  // Create a WebGLRenderer that draws into the provided canvas, with anti-aliasing
  // for smoother edges and an alpha channel to allow transparent backgrounds when
  // layering over other UI.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  // Set the device pixel ratio and cap it at 2 to balance sharpness and performance.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Match the renderer size to the current window (viewport) dimensions.
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Use sRGB output color space for more accurate on-screen color representation.
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ACES Filmic tone mapping provides a more realistic dynamic range and highlights.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // Controls tone mapping exposure; neutral default is 1.
  renderer.toneMappingExposure = 1;

  // Return a configured renderer ready for use.
  return renderer;
}