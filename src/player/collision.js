import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

function enableBVHAcceleration() {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

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

// Reusable temp objects to reduce allocations during shapecast
const TEMP_triPoint = new THREE.Vector3();
const TEMP_capPoint = new THREE.Vector3();
const TEMP_sphere = new THREE.Sphere();
const TEMP_triNormal = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Creates a collision system from a static scene hierarchy and a ground tolerance.
 * Returns an API with `isCollidingAtPosition` suitable for capsule-vs-triangle checks.
 */
export function createCollisionSystem(root, groundTolerance) {
  enableBVHAcceleration();
  const collisionGeometry = buildCollisionGeometry(root);

  /**
   * Computes collision at a position and returns whether it hits and the most relevant surface normal.
   */
  function getCollisionAtPosition(position, playerHeight, playerRadius, options = {}) {
    const { yLift = 0, ignoreGround = false, ignoreGroundTriangles = false } = options;
    const effectiveRadius = ignoreGround ? Math.max(0, playerRadius - groundTolerance) : playerRadius;
    if (!collisionGeometry) return { hit: false, normal: null };

    const baseY = position.y + yLift;
    const start = new THREE.Vector3(position.x, baseY - playerHeight + effectiveRadius, position.z);
    const end = new THREE.Vector3(position.x, baseY - effectiveRadius, position.z);
    const capsule = new Capsule(start, end, effectiveRadius);

    const segment = new THREE.Line3(capsule.start, capsule.end);
    const halfLength = capsule.start.distanceTo(capsule.end) * 0.5;

    TEMP_sphere.center.copy(capsule.start).add(capsule.end).multiplyScalar(0.5);
    TEMP_sphere.radius = halfLength + capsule.radius;

    let anyHit = false;
    let minDist = Infinity;
    let normal = null;

    collisionGeometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsSphere(TEMP_sphere),
      intersectsTriangle: (tri) => {
        if (ignoreGroundTriangles) {
          tri.getNormal(TEMP_triNormal);
          const alignmentWithUp = TEMP_triNormal.dot(UP);
          if (alignmentWithUp > 0.8) {
            return false;
          }
        }
        const dist = tri.closestPointToSegment(segment, TEMP_triPoint, TEMP_capPoint);
        if (dist <= capsule.radius) {
          anyHit = true;
          if (dist < minDist) {
            // capture the most relevant normal (closest surface)
            tri.getNormal(TEMP_triNormal);
            normal = TEMP_triNormal.clone();
            minDist = dist;
          }
        }
        return false;
      }
    });

    return { hit: anyHit, normal };
  }

  function isCollidingAtPosition(position, playerHeight, playerRadius, options = {}) {
    const { yLift = 0, ignoreGround = false, ignoreGroundTriangles = false } = options;
    const effectiveRadius = ignoreGround ? Math.max(0, playerRadius - groundTolerance) : playerRadius;
    if (!collisionGeometry) return false;

    // Define capsule aligned with Y: start at feet + radius, end at head - radius
    const baseY = position.y + yLift;
    const start = new THREE.Vector3(position.x, baseY - playerHeight + effectiveRadius, position.z);
    const end = new THREE.Vector3(position.x, baseY - effectiveRadius, position.z);
    const capsule = new Capsule(start, end, effectiveRadius);

    const segment = new THREE.Line3(capsule.start, capsule.end);
    const halfLength = capsule.start.distanceTo(capsule.end) * 0.5;

    TEMP_sphere.center.copy(capsule.start).add(capsule.end).multiplyScalar(0.5);
    TEMP_sphere.radius = halfLength + capsule.radius;

    let hit = false;
    collisionGeometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsSphere(TEMP_sphere),
      intersectsTriangle: (tri) => {
        if (ignoreGroundTriangles) {
          tri.getNormal(TEMP_triNormal);
          const alignmentWithUp = TEMP_triNormal.dot(UP);
          if (alignmentWithUp > 0.8) {
            return false;
          }
        }
        const dist = tri.closestPointToSegment(segment, TEMP_triPoint, TEMP_capPoint);
        if (dist <= capsule.radius) {
          hit = true;
          return true; // abort traversal early
        }
        return false;
      }
    });

    return hit;
  }

  return { isCollidingAtPosition, getCollisionAtPosition, collisionGeometry };
}

