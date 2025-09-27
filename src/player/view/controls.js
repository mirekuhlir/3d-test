// Pointer-lock FPS controls wrapper
// ---------------------------------
// Responsibility: Provide a thin factory around Three.js PointerLockControls
// to control the player/camera using mouse look and relative movement.
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export function createFPSControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);
  return controls;
}


