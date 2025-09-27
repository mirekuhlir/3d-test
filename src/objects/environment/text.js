// Scene text label
// -----------------
// Responsibility: Create the floating “3D TEST” label in the arena. Consumes a
// preloaded font definition to avoid runtime network requests.
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export function addSceneLabel(scene, fontData, text = '3D TEST') {
  const font = new FontLoader().parse(fontData);
  const geometry = new TextGeometry(text, {
    font,
    size: 1.2,
    height: 0.3,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 2,
  });

  geometry.center();

  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0.45 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 1.2, -6);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}


