// Static-scene collision system (BVH)
// -----------------------------------
// Responsibility: Merge all visible mesh geometries in the scene into a single
// world-space mesh, build a BVH for fast spatial queries, and perform capsule
// vs. triangle checks. Designed for static worlds (no runtime mesh edits).
//
// Exposed API:
// - isCollidingAtPosition(position, height, radius, options): boolean
//   Fast hit test that bails out on first contact.
// - getCollisionAtPosition(position, height, radius, options): { hit, normal|null }
//   Returns the most relevant surface normal (closest) for sliding decisions.
//
// Options object (both functions):
// - yLift?: number — temporary vertical offset used for step-up probing.
// - ignoreGround?: boolean — shrinks capsule radius by `groundTolerance` to
//   reduce ground “sticking” during horizontal checks.
// - ignoreGroundTriangles?: boolean — filter nearly-horizontal faces to focus on walls.
// - ignoreWallTriangles?: boolean — consider only ground/ceiling-like faces (skip near-vertical walls).
//
// Performance notes:
// - Broadphase sphere vs AABB quickly prunes BVH nodes before triangle tests.
// - Temporary vectors are reused to avoid per-call allocations.
// - Merged geometry has a persistent BVH via computeBoundsTree().
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

function enableBVHAcceleration() {
  // Patch Three.js prototypes to enable BVH operations and accelerated raycast
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

function buildCollisionGeometry(root) {
  // Collect all visible meshes, bake transforms to world space and merge
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
  // Normalize: ensure identical attribute layout across all geometries
  // - Convert to non-indexed
  // - Keep only 'position' attribute (collision does not need normals/uvs)
  const prepared = geometries.map((geom) => {
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
    const positionAttr = nonIndexed.getAttribute('position');
    const clean = new THREE.BufferGeometry();
    clean.setAttribute('position', positionAttr.clone());
    return clean;
  });
  const merged = mergeGeometries(prepared, false);
  if (!merged) {
    console.warn('Collision merge failed: incompatible geometry attributes');
    return null;
  }
  merged.computeBoundsTree();
  return merged;
}

// Reusable temp objects to reduce allocations during shapecast
const TEMP_triPoint = new THREE.Vector3();
const TEMP_capPoint = new THREE.Vector3();
const TEMP_sphere = new THREE.Sphere();
const TEMP_triNormal = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
// Treat only almost-flat faces as true ground when filtering during horizontal checks.
// A higher threshold prevents medium slopes from being ignored, which previously
// allowed the capsule to "zajet" do šikmých ploch při XZ pohybu.
const GROUND_DOT_THRESHOLD = 0.99; // ~8° od osy Y
const WALL_DOT_THRESHOLD = 0.25;   // ~75° od osy Y (skutečně téměř svislé plochy)



export function createCollisionSystem(root, groundTolerance) {
  enableBVHAcceleration();
  const collisionGeometry = buildCollisionGeometry(root);

  /**
   * Computes collision at a position and returns whether it hits and the most
   * relevant surface normal (used for sliding). `yLift` temporarily raises the
   * capsule (e.g., step-up probing). `ignoreGround` shrinks the radius to avoid
   * tiny ground touches; `ignoreGroundTriangles` filters near-horizontal faces.
   */
  function getCollisionAtPosition(position, playerHeight, playerRadius, options = {}) {
    const { yLift = 0, ignoreGround = false, ignoreGroundTriangles = false, ignoreWallTriangles = false } = options;
    // Shrink radius to reduce incidental ground contact when desired
    const effectiveRadius = ignoreGround ? Math.max(0, playerRadius - groundTolerance) : playerRadius;
    if (!collisionGeometry) return { hit: false, normal: null };

    // Build a vertical capsule aligned with Y at the given position
    const baseY = position.y + yLift;
    const start = new THREE.Vector3(position.x, baseY - playerHeight + effectiveRadius, position.z);
    const end = new THREE.Vector3(position.x, baseY - effectiveRadius, position.z);
    const capsule = new Capsule(start, end, effectiveRadius);

    // Broadphase sphere around the capsule segment
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
        // Optional face filtering
        if (ignoreGroundTriangles || ignoreWallTriangles) {
          tri.getNormal(TEMP_triNormal);
          const alignmentWithUp = TEMP_triNormal.dot(UP);
          // Use stricter threshold for ground-like surfaces to avoid ignoring sloped surfaces
          if (ignoreGroundTriangles && alignmentWithUp > GROUND_DOT_THRESHOLD) {
            // Skip ground-like faces when we're interested in walls
            return false;
          }
          if (ignoreWallTriangles && Math.abs(alignmentWithUp) <= WALL_DOT_THRESHOLD) {
            // Skip near-vertical faces when we only care about ground/ceiling
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
    const { yLift = 0, ignoreGround = false, ignoreGroundTriangles = false, ignoreWallTriangles = false } = options;
    // Shrink radius to reduce incidental ground contact when desired
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
        if (ignoreGroundTriangles || ignoreWallTriangles) {
          tri.getNormal(TEMP_triNormal);
          const alignmentWithUp = TEMP_triNormal.dot(UP);
          if (ignoreGroundTriangles && alignmentWithUp > GROUND_DOT_THRESHOLD) {
            return false;
          }
          if (ignoreWallTriangles && Math.abs(alignmentWithUp) <= WALL_DOT_THRESHOLD) {
            return false;
          }
        }
        const dist = tri.closestPointToSegment(segment, TEMP_triPoint, TEMP_capPoint);
        if (dist <= capsule.radius) {
          hit = true;
          return true; // Early exit: first contact is sufficient for boolean test
        }
        return false;
      }
    });

    return hit;
  }

  return { isCollidingAtPosition, getCollisionAtPosition, collisionGeometry };
}