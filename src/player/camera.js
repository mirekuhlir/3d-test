// First-person camera factory
// ---------------------------
// Responsibility: Create a perspective camera tuned for FPS gameplay. The
// field of view, aspect ratio, clipping planes, and initial eye height are set.
import * as THREE from 'three';

export function createCamera() {
  // fov=75°, aspect from window, near=0.1 for close objects, far=200 for level scale
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 1.6, 0);
  return camera;
}
