// Ground plane and grid helpers
// ------------------------------
// Responsibility: Attach the ground plane mesh and a world-space grid helper
// for orientation. Returns references so collision staging can reuse them if
// desired.
import * as THREE from 'three';

export function addGround(scene) {
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x343a40,
    roughness: 0.95,
    metalness: 0,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = false;

  const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);

  scene.add(ground, grid);

  return { ground, grid };
}


