import * as THREE from 'three';

export function addEnvironment(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(6, 10, 4);
  scene.add(directionalLight);

  const hemiLight = new THREE.HemisphereLight(0xaaccff, 0x222233, 0.5);
  scene.add(hemiLight);

  // Ground
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.95, metalness: 0.0 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = false;
  scene.add(ground);

  // Grid helper for orientation
  const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
  scene.add(grid);

  // Boxes scattered around
  const boxMaterialPalette = [0x4cc9f0, 0xf72585, 0xb5179e, 0x4895ef, 0x4361ee, 0x2ec4b6, 0xffbe0b];
  for (let i = 0; i < 30; i += 1) {
    const sx = 0.6 + Math.random() * 1.6;
    const sy = 0.6 + Math.random() * 3.0;
    const sz = 0.6 + Math.random() * 1.6;
    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const material = new THREE.MeshStandardMaterial({
      color: boxMaterialPalette[i % boxMaterialPalette.length],
      metalness: 0.1,
      roughness: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (Math.random() - 0.5) * 80;
    mesh.position.z = (Math.random() - 0.5) * 80;
    mesh.position.y = sy / 2;
    scene.add(mesh);
  }
}