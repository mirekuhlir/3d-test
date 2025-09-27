// Slope and surface test area
// ----------------------------
// Responsibility: Create a variety of inclined surfaces (ramps, wedges, plates,
// curved pieces) used for collision behaviour testing. Returns references to
// the created meshes.
import * as THREE from 'three';

function createRampBox(scene, { x, y = 0.35, z, width, depth, thickness = 0.35, angleDeg = 20, axis = 'x', color = 0x999999 }) {
  const geometry = new THREE.BoxGeometry(width, thickness, depth);
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.55 });
  const ramp = new THREE.Mesh(geometry, material);
  ramp.position.set(x, y, z);
  const angleRad = THREE.MathUtils.degToRad(angleDeg);
  if (axis === 'x') ramp.rotation.z = angleRad;
  if (axis === 'z') ramp.rotation.x = -angleRad;
  ramp.castShadow = false;
  ramp.receiveShadow = true;
  scene.add(ramp);
  return ramp;
}

function createWedge(scene, { x, z, width, height, depth, rotationYDeg = 0, color = 0xaaaaaa }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false });
  geometry.translate(-width / 2, 0, -depth / 2);

  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.55 });
  const wedge = new THREE.Mesh(geometry, material);
  wedge.position.set(x, 0, z);
  wedge.rotation.y = THREE.MathUtils.degToRad(rotationYDeg);
  wedge.castShadow = false;
  wedge.receiveShadow = true;
  scene.add(wedge);
  return wedge;
}

function createInclinedPlate(scene, { x, z, width, depth, angleDeg, axis = 'x', thickness = 0.06, color = 0xbbbbbb }) {
  const geometry = new THREE.BoxGeometry(width, thickness, depth);
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.7 });
  const plate = new THREE.Mesh(geometry, material);
  plate.position.set(x, thickness / 2 + 0.002, z);
  const angleRad = THREE.MathUtils.degToRad(angleDeg);
  if (axis === 'x') plate.rotation.z = angleRad;
  if (axis === 'z') plate.rotation.x = -angleRad;
  plate.castShadow = false;
  plate.receiveShadow = true;
  scene.add(plate);
  return plate;
}

function createCylinderSlope(scene, { x, z, radius = 1.2, height = 3, tiltDeg = 25, axis = 'x', color = 0x88c0d0 }) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 24, 1, false);
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.6 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, radius, z);
  const angleRad = THREE.MathUtils.degToRad(tiltDeg);
  if (axis === 'x') mesh.rotation.z = angleRad;
  if (axis === 'z') mesh.rotation.x = angleRad;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createConeSlope(scene, { x, z, radius = 1.2, height = 2, tiltDeg = 35, axis = 'x', color = 0xe76f51 }) {
  const geometry = new THREE.ConeGeometry(radius, height, 24, 1, false);
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.55 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, height / 2, z);
  const angleRad = THREE.MathUtils.degToRad(tiltDeg);
  if (axis === 'x') mesh.rotation.z = angleRad;
  if (axis === 'z') mesh.rotation.x = angleRad;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function addSlopeTestArea(scene) {
  const parts = [];

  parts.push(
    createRampBox(scene, { x: -8, z: 8, width: 3, depth: 2, thickness: 0.35, angleDeg: 10, axis: 'x', color: 0x9b9b9b }),
    createRampBox(scene, { x: -4.5, z: 8, width: 3, depth: 2, thickness: 0.35, angleDeg: 20, axis: 'x', color: 0x9b9b9b }),
    createRampBox(scene, { x: -1, z: 8, width: 3, depth: 2, thickness: 0.35, angleDeg: 35, axis: 'x', color: 0x9b9b9b }),
    createRampBox(scene, { x: 2.5, z: 8, width: 3, depth: 2, thickness: 0.35, angleDeg: 45, axis: 'x', color: 0x9b9b9b }),
    createRampBox(scene, { x: -6, z: 11.5, width: 2, depth: 3, thickness: 0.35, angleDeg: 15, axis: 'z', color: 0xa0a0a0 }),
    createRampBox(scene, { x: -2.5, z: 11.5, width: 2, depth: 3, thickness: 0.35, angleDeg: 30, axis: 'z', color: 0xa0a0a0 }),
  );

  parts.push(
    createWedge(scene, { x: 6, z: 8, width: 2.4, height: 1.2, depth: 2, rotationYDeg: 0, color: 0x5dade2 }),
    createWedge(scene, { x: 9, z: 8, width: 2.4, height: 1.6, depth: 2, rotationYDeg: 180, color: 0x76d7c4 }),
  );

  parts.push(
    createInclinedPlate(scene, { x: -8, z: 15, width: 3, depth: 3, angleDeg: 20, axis: 'x', color: 0xcfcfcf }),
    createInclinedPlate(scene, { x: -3.5, z: 15, width: 3, depth: 3, angleDeg: 35, axis: 'z', color: 0xdfdfdf }),
  );

  parts.push(
    createCylinderSlope(scene, { x: 2, z: 12.5, radius: 1.2, height: 3, tiltDeg: 25, axis: 'x', color: 0x88c0d0 }),
    createConeSlope(scene, { x: 6, z: 12.5, radius: 1.1, height: 2.4, tiltDeg: 35, axis: 'z', color: 0xe76f51 }),
  );

  return parts;
}


