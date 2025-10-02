// Pointer-lock FPS controls wrapper
// ---------------------------------
// Responsibility: Provide a thin factory around Three.js PointerLockControls
// to control the player/camera using mouse look and relative movement.
import { Euler } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const _euler = new Euler(0, 0, 0, 'YXZ');
const HALF_PI = Math.PI / 2;
const CHANGE_EVENT = { type: 'change' };

export function createFPSControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);
  return controls;
}

export function applyLookDelta(controls, yawDelta, pitchDelta) {
  const camera = controls?.camera ?? controls?.getObject?.();
  if (!camera) return;

  _euler.setFromQuaternion(camera.quaternion);
  _euler.y += yawDelta;
  _euler.x += pitchDelta;

  const minPolar = controls?.minPolarAngle ?? 0;
  const maxPolar = controls?.maxPolarAngle ?? Math.PI;
  _euler.x = Math.max(HALF_PI - maxPolar, Math.min(HALF_PI - minPolar, _euler.x));

  camera.quaternion.setFromEuler(_euler);
  controls?.dispatchEvent?.(CHANGE_EVENT);
}


