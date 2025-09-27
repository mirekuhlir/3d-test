// Resize system
// -------------
// Responsibility: Keep camera projection and renderer buffers in sync with
// window size and configured DPR/render scale. Returns a cleanup function.
import { RENDER_SCALE, MAX_DEVICE_PIXEL_RATIO } from './config.js';

export function setupResize({ renderer, camera }) {
  function onResize() {
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    camera.aspect = cssWidth / cssHeight;
    camera.updateProjectionMatrix();
    // Clamp device pixel ratio to avoid excessive resolution on HiDPI screens
    const effectiveDPR = Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
    renderer.setPixelRatio(effectiveDPR);
    const width = Math.floor(cssWidth * RENDER_SCALE);
    const height = Math.floor(cssHeight * RENDER_SCALE);
    renderer.setSize(width, height, false); // don't change CSS size, only drawing buffer
  }

  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}