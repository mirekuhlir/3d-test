import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

export function createFlyControls(camera, domElement) {
  const controls = new FlyControls(camera, domElement);
  controls.movementSpeed = 10;
  controls.rollSpeed = Math.PI / 6;
  controls.dragToLook = true;
  controls.autoForward = false;
  return controls;
}

