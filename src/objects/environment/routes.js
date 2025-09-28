// Parkour routes
// --------------
// Responsibility: Provide reusable helpers for constructing parkour platforms
// arranged in sequences. Each function returns the created meshes for collision
// staging.
import * as THREE from 'three';

function createPlatform(scene, { x, z, topY, width, depth, color = 0x999999, thickness = 0.35 }) {
  const geometry = new THREE.BoxGeometry(width, thickness, depth);
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.55 });
  const platform = new THREE.Mesh(geometry, material);
  platform.position.set(x, topY - thickness / 2, z);
  platform.castShadow = false;
  platform.receiveShadow = true;
  scene.add(platform);
  return platform;
}

export function addMainRoute(scene) {
  const color = 0x3adb76;
  const specs = [
    { x: -10, z: 0, topY: 0.8, width: 2.4, depth: 2 },
    { x: -6.8, z: 1.6, topY: 1.4, width: 2.2, depth: 1.8 },
    { x: -4.2, z: -0.8, topY: 2, width: 2, depth: 1.8 },
    { x: -1.2, z: 1, topY: 2.6, width: 2, depth: 1.6 },
    { x: 1.8, z: -1.2, topY: 3.2, width: 2, depth: 1.6 },
    { x: 4.6, z: 0.8, topY: 3.5, width: 1.8, depth: 1.4 },
    { x: 7.2, z: -1.4, topY: 3.9, width: 1.6, depth: 1.4 },
    { x: 9.8, z: 0.4, topY: 4.4, width: 1.6, depth: 1.4 },
    { x: 12.2, z: -0.6, topY: 4.8, width: 1.5, depth: 1.3 },
    { x: 14.4, z: 1, topY: 5.2, width: 1.4, depth: 1.2 },
    { x: 16.6, z: -1.2, topY: 5.6, width: 1.4, depth: 1.2 },
    { x: 18.4, z: 0.6, topY: 6, width: 1.3, depth: 1.1 },
  ];
  return specs.map((spec) => createPlatform(scene, { ...spec, color }));
}

export function addAlternateRoute(scene) {
  const color = 0xffbe0b;
  const specs = [
    { x: 6, z: -6, topY: 0.9, width: 2.2, depth: 2 },
    { x: 8.4, z: -3.6, topY: 1.5, width: 2, depth: 1.8 },
    { x: 10.6, z: -1, topY: 2.1, width: 2, depth: 1.6 },
    { x: 12.8, z: 1.4, topY: 2.7, width: 1.8, depth: 1.6 },
    { x: 14.8, z: 3.6, topY: 3.3, width: 1.6, depth: 1.4 },
    { x: 16.6, z: 6, topY: 3.9, width: 1.5, depth: 1.4 },
    { x: 18.4, z: 8.4, topY: 4.5, width: 1.4, depth: 1.3 },
    { x: 20.2, z: 10.6, topY: 5.1, width: 1.3, depth: 1.2 },
    { x: 21.8, z: 13, topY: 5.7, width: 1.2, depth: 1.1 },
    { x: 23.4, z: 15.4, topY: 6.3, width: 1.1, depth: 1 },
    { x: 24.8, z: 17.6, topY: 6.9, width: 1, depth: 0.9 },
  ];
  return specs.map((spec) => createPlatform(scene, { ...spec, color }));
}


