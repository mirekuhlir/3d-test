import './style.css';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { createRenderer } from './core/renderer.js';
import { createScene } from './core/scene.js';
import { createCamera } from './player/camera.js';
import { createFPSControls } from './player/controls.js';
import { createPointerLockOverlay, createCrosshair } from './player/overlay.js';
import { addEnvironment } from './objects/environment.js';
import { setupResize } from './systems/resize.js';
import { createPlayerState } from './player/state.js';
import { createLoop } from './core/loop.js';
import { setupKeyboardInput } from './player/keyboard.js';

// Configurable tolerance for ignoring floor contact during horizontal movement.
// Adjust within [0.015, 0.03] if you still experience minor sticking on the ground.
const DEFAULT_GROUND_TOLERANCE = 0.025;
const MIN_GROUND_TOLERANCE = 0.015;
const MAX_GROUND_TOLERANCE = 0.03;

function getGroundTolerance() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('tol');
  const parsed = param != null ? parseFloat(param) : NaN;
  if (Number.isFinite(parsed)) {
    return Math.min(MAX_GROUND_TOLERANCE, Math.max(MIN_GROUND_TOLERANCE, parsed));
  }
  return DEFAULT_GROUND_TOLERANCE;
}

const GROUND_TOLERANCE = getGroundTolerance();

const canvas = document.getElementById('app');

const renderer = createRenderer(canvas);
const scene = createScene();
const camera = createCamera();

const controls = createFPSControls(camera, renderer.domElement);
scene.add(controls.getObject());

addEnvironment(scene);
createPointerLockOverlay(controls);
createCrosshair(controls);
setupResize({ renderer, camera });

const state = createPlayerState();

// Enable BVH helpers on THREE classes (raycast acceleration; bounds tree on geometry)
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Build a merged static collision geometry and compute BVH once (scene is static)
function buildCollisionGeometry(root) {
  const geometries = [];
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj.isMesh && obj.geometry && obj.visible !== false) {
      const cloned = obj.geometry.clone();
      cloned.applyMatrix4(obj.matrixWorld);
      geometries.push(cloned);
    }
  });
  if (geometries.length === 0) return null;
  const merged = mergeGeometries(geometries, false);
  merged.computeBoundsTree();
  return merged;
}

const collisionGeometry = buildCollisionGeometry(scene);

const _triPoint = new THREE.Vector3();
const _capPoint = new THREE.Vector3();
const _sphere = new THREE.Sphere();
const _triNormal = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function isCollidingAtPosition(position, playerHeight, playerRadius, options = {}) {
  const { yLift = 0, ignoreGround = false, ignoreGroundTriangles = false } = options;
  // Alternative approach to avoid sticking on ground during horizontal checks:
  // Lift the capsule slightly (yLift) so the floor contact is ignored.
  // Keep radius unchanged for consistent wall collisions.
  const effectiveRadius = ignoreGround ? Math.max(0, playerRadius - GROUND_TOLERANCE) : playerRadius;
  if (!collisionGeometry) return false;
  // Define capsule aligned with Y: start at feet + radius, end at head - radius
  const baseY = position.y + yLift;
  const start = new THREE.Vector3(position.x, baseY - playerHeight + effectiveRadius, position.z);
  const end = new THREE.Vector3(position.x, baseY - effectiveRadius, position.z);
  const capsule = new Capsule(start, end, effectiveRadius);

  const segment = new THREE.Line3(capsule.start, capsule.end);
  const halfLength = capsule.start.distanceTo(capsule.end) * 0.5;

  _sphere.center.copy(capsule.start).add(capsule.end).multiplyScalar(0.5);
  _sphere.radius = halfLength + capsule.radius;

  let hit = false;
  collisionGeometry.boundsTree.shapecast({
    intersectsBounds: (box) => box.intersectsSphere(_sphere),
    intersectsTriangle: (tri) => {
      if (ignoreGroundTriangles) {
        tri.getNormal(_triNormal);
        const alignmentWithUp = _triNormal.dot(UP);
        if (alignmentWithUp > 0.8) {
          return false;
        }
      }
      const dist = tri.closestPointToSegment(segment, _triPoint, _capPoint);
      if (dist <= capsule.radius) {
        hit = true;
        return true; // abort traversal early
      }
      return false;
    }
  });

  return hit;
}

renderer.domElement.addEventListener('click', () => {
  if (!controls.isLocked) controls.lock();
});

const cleanupKeyboard = setupKeyboardInput(state);

const loop = createLoop({
  renderer,
  scene,
  camera,
  update: (delta) => {
    // Apply damping (friction)
    state.velocity.x -= state.velocity.x * state.damping * delta;
    state.velocity.z -= state.velocity.z * state.damping * delta;

    // Gravity
    state.velocity.y -= state.gravity * delta;

    // Movement input
    state.direction.z = Number(state.moveForward) - Number(state.moveBackward);
    state.direction.x = Number(state.moveRight) - Number(state.moveLeft);
    state.direction.normalize();

    const targetHeight = state.isCrouching ? state.crouchHeight : state.normalHeight;
    if (controls.isLocked) {
      if (state.direction.lengthSq() > 0) {
        state.velocity.z -= state.direction.z * state.moveAccel * delta;
        state.velocity.x -= state.direction.x * state.moveAccel * delta;
      }

      const obj = controls.getObject();
      // Attempt horizontal movement on X (right/left)
      const moveX = -state.velocity.x * delta;
      if (moveX !== 0) {
        controls.moveRight(moveX);
        if (isCollidingAtPosition(obj.position, targetHeight, state.radius, { ignoreGroundTriangles: true })) {
          controls.moveRight(-moveX);
          state.velocity.x = 0;
        }
      }
      // Attempt horizontal movement on Z (forward/back)
      const moveZ = -state.velocity.z * delta;
      if (moveZ !== 0) {
        controls.moveForward(moveZ);
        if (isCollidingAtPosition(obj.position, targetHeight, state.radius, { ignoreGroundTriangles: true })) {
          controls.moveForward(-moveZ);
          state.velocity.z = 0;
        }
      }
    }

    // Vertical movement and floor/box collision
    const obj = controls.getObject();
    const vyBefore = state.velocity.y;
    obj.position.y += state.velocity.y * delta;
    // Block vertical movement if colliding with boxes
    if (isCollidingAtPosition(obj.position, targetHeight, state.radius)) {
      obj.position.y -= state.velocity.y * delta;
      state.velocity.y = 0;
      if (vyBefore < 0) {
        state.canJump = true;
      }
    }
    if (obj.position.y <= targetHeight) {
      state.velocity.y = 0;
      obj.position.y = targetHeight;
      state.canJump = true;
    }
  }
});

loop.start();

