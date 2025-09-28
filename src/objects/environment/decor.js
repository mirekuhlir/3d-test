// Decorative scatter meshes
// --------------------------
// Responsibility: Populate the wider arena with colourful boxes while keeping
// the main route free. Returns the created meshes so callers can reuse them for
// collision extraction if required.
import * as THREE from 'three';

const PALETTE = [0xcccccc, 0x777777, 0x666666, 0xff8c00, 0xff0000];

const CLUSTER_CONFIGS = [
  {
    anchor: new THREE.Vector3(-36, 0, 32),
    direction: new THREE.Vector3(1, 0, 0.1),
    count: 9,
    spacing: 2.3,
    baseHeight: 1.0,
    stepHeight: 0.55,
    maxHeight: 4.2,
    plateauCount: 3,
    exclusionRadius: 10,
  },
  {
    anchor: new THREE.Vector3(24, 0, -30),
    direction: new THREE.Vector3(0.2, 0, 1),
    count: 10,
    spacing: 2.4,
    baseHeight: 1.1,
    stepHeight: 0.52,
    maxHeight: 4.0,
    plateauCount: 4,
    exclusionRadius: 10,
  },
  {
    anchor: new THREE.Vector3(-24, 0, -40),
    direction: new THREE.Vector3(1, 0, -1),
    count: 8,
    spacing: 2.5,
    baseHeight: 1.0,
    stepHeight: 0.6,
    maxHeight: 4.1,
    plateauCount: 2,
    exclusionRadius: 9,
  },
  {
    anchor: new THREE.Vector3(36, 0, 18),
    direction: new THREE.Vector3(-1, 0, 0.2),
    count: 11,
    spacing: 2.3,
    baseHeight: 0.9,
    stepHeight: 0.52,
    maxHeight: 4.3,
    plateauCount: 3,
    exclusionRadius: 9,
  },
  {
    anchor: new THREE.Vector3(14, 0, 38),
    direction: new THREE.Vector3(0.7, 0, -1),
    count: 9,
    spacing: 2.4,
    baseHeight: 0.9,
    stepHeight: 0.55,
    maxHeight: 4.0,
    plateauCount: 3,
    exclusionRadius: 9,
  },
  {
    anchor: new THREE.Vector3(-8, 0, 40),
    direction: new THREE.Vector3(0.8, 0, -0.4),
    count: 8,
    spacing: 2.2,
    baseHeight: 1.1,
    stepHeight: 0.5,
    maxHeight: 3.8,
    plateauCount: 3,
    exclusionRadius: 8,
  },
  {
    anchor: new THREE.Vector3(32, 0, -34),
    direction: new THREE.Vector3(-0.6, 0, 1),
    count: 10,
    spacing: 2.6,
    baseHeight: 1.0,
    stepHeight: 0.5,
    maxHeight: 4.1,
    plateauCount: 4,
    exclusionRadius: 10,
  },
  {
    anchor: new THREE.Vector3(-38, 0, -16),
    direction: new THREE.Vector3(1, 0, 0.3),
    count: 9,
    spacing: 2.5,
    baseHeight: 1.2,
    stepHeight: 0.55,
    maxHeight: 4.2,
    plateauCount: 3,
    exclusionRadius: 9,
  },
  {
    anchor: new THREE.Vector3(6, 0, -40),
    direction: new THREE.Vector3(1, 0, 0.6),
    count: 9,
    spacing: 2.4,
    baseHeight: 1.0,
    stepHeight: 0.58,
    maxHeight: 4.3,
    plateauCount: 3,
    exclusionRadius: 9,
  },
  {
    anchor: new THREE.Vector3(-2, 0, 24),
    direction: new THREE.Vector3(1, 0, -0.6),
    count: 8,
    spacing: 2.1,
    baseHeight: 1.0,
    stepHeight: 0.6,
    maxHeight: 3.9,
    plateauCount: 2,
    exclusionRadius: 8,
  },
  {
    anchor: new THREE.Vector3(18, 0, 6),
    direction: new THREE.Vector3(1, 0, 0.2),
    count: 10,
    spacing: 2.0,
    baseHeight: 1.1,
    stepHeight: 0.45,
    maxHeight: 3.7,
    plateauCount: 5,
    exclusionRadius: 8,
  },
  {
    anchor: new THREE.Vector3(-30, 0, -4),
    direction: new THREE.Vector3(0.1, 0, 1),
    count: 9,
    spacing: 2.3,
    baseHeight: 1.0,
    stepHeight: 0.52,
    maxHeight: 3.8,
    plateauCount: 3,
    exclusionRadius: 9,
  },
];

function createPlatformCluster(scene, meshes, config) {
  const {
    anchor,
    direction,
    count,
    spacing,
    baseHeight,
    stepHeight,
    maxHeight,
    plateauCount = 0,
  } = config;

  const normalizedDirection = direction.clone().setY(0);
  if (normalizedDirection.lengthSq() === 0) {
    normalizedDirection.set(1, 0, 0);
  }
  normalizedDirection.normalize();

  const plateauSegment = Math.max(0, Math.min(count, plateauCount));
  const climbCount = Math.max(0, count - plateauSegment);
  const plateauHeight = climbCount > 0
    ? Math.min(baseHeight + (climbCount - 1) * stepHeight + Math.random() * 0.3, maxHeight)
    : Math.min(baseHeight + Math.random() * 0.3, maxHeight);

  for (let i = 0; i < count; i += 1) {
    const width = 1.6 + Math.random() * 0.8;
    const depth = 1.6 + Math.random() * 0.8;
    const isPlateau = i >= climbCount;
    const targetHeight = isPlateau
      ? plateauHeight
      : Math.min(baseHeight + i * stepHeight, maxHeight - 0.2);
    const height = Math.min(targetHeight + Math.random() * 0.3, maxHeight);

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      metalness: 0.1,
      roughness: 0.6,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const offset = normalizedDirection.clone().multiplyScalar(spacing * i);
    const position = anchor.clone().add(offset);

    mesh.position.set(position.x, height / 2, position.z);
    scene.add(mesh);
    meshes.push(mesh);
  }
}

export function addScatterDecor(scene, count = 150, radius = 90) {
  const meshes = [];

  const isInsideClusterZone = (x, z) =>
    CLUSTER_CONFIGS.some(({ anchor, exclusionRadius }) => {
      const dx = x - anchor.x;
      const dz = z - anchor.z;
      return dx * dx + dz * dz < exclusionRadius * exclusionRadius;
    });

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

    let x;
    let z;
    let attempts = 0;
    do {
      x = (Math.random() - 0.5) * radius * 2;
      z = (Math.random() - 0.5) * radius * 2;
      if (Math.abs(x) < 12) x = 12 * Math.sign(x || 1) + (Math.random() - 0.5) * 20;
      if (Math.abs(z) < 12) z = 12 * Math.sign(z || 1) + (Math.random() - 0.5) * 20;
      attempts += 1;
    } while (isInsideClusterZone(x, z) && attempts < 6);

    mesh.position.set(x, sy / 2, z);
    scene.add(mesh);
    meshes.push(mesh);
  }

  CLUSTER_CONFIGS.forEach((config) => {
    createPlatformCluster(scene, meshes, config);
  });

  return meshes;
}


