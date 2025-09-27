import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export function createFPSControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);
  return controls;
}


