// Lighting setup for the play space
// ----------------------------------
// Responsibility: Attach the ambient, directional and hemisphere lights that
// keep the arena evenly lit without shadow casting overhead.
import * as THREE from 'three';

export function addEnvironmentLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(6, 10, 4);
  const hemiLight = new THREE.HemisphereLight(0xaaccff, 0x222233, 0.5);

  scene.add(ambientLight, directionalLight, hemiLight);

  return { ambientLight, directionalLight, hemiLight };
}


