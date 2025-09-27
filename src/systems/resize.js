import { RENDER_SCALE, MAX_DEVICE_PIXEL_RATIO } from '../core/config.js';

export function setupResize({ renderer, camera }) {
  function onResize() {
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    camera.aspect = cssWidth / cssHeight;
    camera.updateProjectionMatrix();
    const effectiveDPR = Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
    renderer.setPixelRatio(effectiveDPR);
    const width = Math.floor(cssWidth * RENDER_SCALE);
    const height = Math.floor(cssHeight * RENDER_SCALE);
    renderer.setSize(width, height, false);
  }

  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}