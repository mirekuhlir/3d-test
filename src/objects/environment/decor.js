// Decorative scatter meshes
// --------------------------
// Responsibility: Populate the wider arena with colourful boxes while keeping
// the main route free. Returns the created meshes so callers can reuse them for
// collision extraction if required.
import * as THREE from 'three';

const PALETTE = [0x4cc9f0, 0xf72585, 0xb5179e, 0x4895ef, 0x4361ee, 0x2ec4b6, 0xffbe0b];

export function addScatterDecor(scene, count = 110, radius = 90) {
  const meshes = [];

  for (let i = 0; i < count; i += 1) {
    const sx = 1 + Math.random() * 4;
    const sy = 0.8 + Math.random() * 4;
    const sz = 1 + Math.random() * 4;
    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const material = new THREE.MeshStandardMaterial({
      color: PALETTE[i % PALETTE.length],
      metalness: 0.1,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    let x = (Math.random() - 0.5) * radius * 2;
    let z = (Math.random() - 0.5) * radius * 2;
    if (Math.abs(x) < 12) x = 12 * Math.sign(x || 1) + (Math.random() - 0.5) * 20;
    if (Math.abs(z) < 12) z = 12 * Math.sign(z || 1) + (Math.random() - 0.5) * 20;

    mesh.position.set(x, sy / 2, z);
    scene.add(mesh);
    meshes.push(mesh);
  }

  return meshes;
}


