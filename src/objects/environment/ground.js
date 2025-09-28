// Ground plane and grid helpers
// ------------------------------
// Responsibility: Attach the ground plane mesh and a world-space grid helper
// for orientation. Returns references so collision staging can reuse them if
// desired.
import * as THREE from 'three';

export function addGround(scene) {
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f7379,
    roughness: 0.95,
    metalness: 0,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = false;

  const grid = new THREE.GridHelper(200, 200, 0xffffff, 0xb0b0b0);
  grid.position.y = 0.01;

  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.depthWrite = false;
    material.depthTest = false;
  });

  scene.add(ground, grid);

  return { ground, grid };
}


