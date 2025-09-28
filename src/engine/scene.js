// Scene factory
// -------------
// Responsibility: Create a Three.js scene with a default sky-like background.
import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  return scene;
}