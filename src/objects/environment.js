import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

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

  // Helper: create a floating platform whose top surface is at `topY`
  function createPlatform({ x, z, topY, width, depth, color = 0x999999, thickness = 0.35 }) {
    const platformGeometry = new THREE.BoxGeometry(width, thickness, depth);
    const platformMaterial = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.55 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, topY - thickness / 2, z);
    platform.castShadow = false;
    platform.receiveShadow = true;
    scene.add(platform);
  }

  // More scattered boxes (larger) — keep center area clearer for parkour path
  const boxMaterialPalette = [0x4cc9f0, 0xf72585, 0xb5179e, 0x4895ef, 0x4361ee, 0x2ec4b6, 0xffbe0b];
  const NUM_SCATTERED = 110;
  for (let i = 0; i < NUM_SCATTERED; i += 1) {
    const sx = 1.0 + Math.random() * 4.0;
    const sy = 0.8 + Math.random() * 4.0;
    const sz = 1.0 + Math.random() * 4.0;
    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const material = new THREE.MeshStandardMaterial({
      color: boxMaterialPalette[i % boxMaterialPalette.length],
      metalness: 0.1,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // Keep random boxes away from the central corridor (|x|,|z| > 12) so parkour remains navigable
    const R = 90;
    let x = (Math.random() - 0.5) * R * 2;
    let z = (Math.random() - 0.5) * R * 2;
    if (Math.abs(x) < 12) x = 12 * Math.sign(x || 1) + (Math.random() - 0.5) * 20;
    if (Math.abs(z) < 12) z = 12 * Math.sign(z || 1) + (Math.random() - 0.5) * 20;
    mesh.position.set(x, sy / 2, z);
    scene.add(mesh);
  }

  // Parkour route: a few ascending platforms with reachable vertical gaps (~0.6–0.8)
  const routeColor = 0x3adb76;
  const route = [
    { x: -10.0, z: 0.0, topY: 0.8, width: 2.4, depth: 2.0 },
    { x: -6.8, z: 1.6, topY: 1.4, width: 2.2, depth: 1.8 },
    { x: -4.2, z: -0.8, topY: 2.0, width: 2.0, depth: 1.8 },
    { x: -1.2, z: 1.0, topY: 2.6, width: 2.0, depth: 1.6 },
    { x: 1.8, z: -1.2, topY: 3.2, width: 2.0, depth: 1.6 },
  ];
  route.forEach(step => createPlatform({ ...step, color: routeColor }));

  // A secondary shorter route to the other side
  const altColor = 0xffbe0b;
  const route2 = [
    { x: 6.0, z: -6.0, topY: 0.9, width: 2.2, depth: 2.0 },
    { x: 8.4, z: -3.6, topY: 1.5, width: 2.0, depth: 1.8 },
    { x: 10.6, z: -1.0, topY: 2.1, width: 2.0, depth: 1.6 },
    { x: 12.8, z: 1.4, topY: 2.7, width: 1.8, depth: 1.6 },
  ];
  route2.forEach(step => createPlatform({ ...step, color: altColor }));

  // 3D text in the scene
  const fontLoader = new FontLoader();
  const fontUrl = 'https://unpkg.com/three@0.166.1/examples/fonts/helvetiker_regular.typeface.json';

  fontLoader.load(
    fontUrl,
    (font) => {
      const textGeometry = new TextGeometry('3D TEST', {
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

      textGeometry.center();

      const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.25,
        roughness: 0.45,
      });

      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 1.2, -6);
      textMesh.receiveShadow = true;
      scene.add(textMesh);
    },
    undefined,
    (error) => {
      console.error('Failed to load font for 3D text:', error);
    }
  );
}