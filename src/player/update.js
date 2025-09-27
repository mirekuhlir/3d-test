// Player update loop (movement + collision)
// ----------------------------------------
// Responsibility: Integrate physics, convert input into acceleration, and
// resolve collisions using capsule-vs-scene checks. Supports step-up probing
// and wall sliding using surface normals.
//
// API:
// export function updatePlayer({
//   state,                         // player state store (flags, velocities, params)
//   controls,                      // PointerLockControls for movement
//   isCollidingAtPosition,         // boolean collision test
//   getCollisionAtPosition,        // collision test with surface normal
//   delta                          // seconds since last frame
// })
import * as THREE from 'three';
import { STEP_MAX_HEIGHT, STAND_HEADROOM } from './constants.js';

// Temp vectors to avoid allocations each frame
const TMP_FORWARD = new THREE.Vector3();
const TMP_RIGHT = new THREE.Vector3();
const TMP_UP = new THREE.Vector3(0, 1, 0);
const TMP_DISP = new THREE.Vector3();
const TMP_SLIDE = new THREE.Vector3();
const TMP_N = new THREE.Vector3();
/**
 * Updates player movement and collision per frame.
 *
 * Responsibilities:
 * - Apply damping and gravity
 * - Translate input flags into a normalized move direction
 * - Accelerate horizontally when controls are locked
 * - Perform horizontal movement with collision checks (capsule vs. scene)
 * - Apply vertical movement with collision resolution and ground snap
 */
export function updatePlayer({ state, controls, isCollidingAtPosition, getCollisionAtPosition, delta }) {
  // Apply damping (friction)
  state.velocity.x -= state.velocity.x * state.damping * delta;
  state.velocity.z -= state.velocity.z * state.damping * delta;

  // Gravity
  state.velocity.y -= state.gravity * delta;

  // Movement input
  state.direction.z = Number(state.moveForward) - Number(state.moveBackward);
  state.direction.x = Number(state.moveRight) - Number(state.moveLeft);
  state.direction.normalize();

  // Acquire player object once per frame (camera holder / capsule center)
  const obj = controls.getObject();

  // Prevent standing up into an obstacle:
  // Our capsule is defined so that its TOP is at obj.position.y.
  // To check head clearance, we probe by lifting the capsule upward by the amount
  // needed to reach standing head height + a small safety margin. We keep the
  // capsule compact (crouch height) to focus on headroom and ignore near-horizontal
  // triangles (floors). This prevents false positives from the ground.
  if (!state.isCrouching) {
    const desiredHeadY = state.normalHeight + STAND_HEADROOM;
    const lift = Math.max(0, desiredHeadY - obj.position.y);
    if (lift > 0) {
      const blockedStand = isCollidingAtPosition(
        obj.position,
        state.crouchHeight, // compact probe capsule, we only care about headroom
        state.radius,
        { yLift: lift, ignoreGroundTriangles: true, ignoreGround: true }
      );
      if (blockedStand) {
        state.isCrouching = true;
      }
    }
  }

  // Choose collision capsule height based on (potentially adjusted) crouch state
  const targetHeight = state.isCrouching ? state.crouchHeight : state.normalHeight;
  if (controls.isLocked) {
    // Allow horizontal acceleration if grounded or air-control is enabled
    const allowAirAccel = state.canJump || state.airControlEnabled;
    if (allowAirAccel && state.direction.lengthSq() > 0) {
      state.velocity.z -= state.direction.z * state.moveAccel * delta;
      state.velocity.x -= state.direction.x * state.moveAccel * delta;
    }

    const moveX = -state.velocity.x * delta;
    const moveZ = -state.velocity.z * delta;

    if (moveX !== 0 || moveZ !== 0) {
      // Step probing granularity: smaller = smoother but more collision queries
      const stepIncrement = Math.min(0.03, STEP_MAX_HEIGHT);

      const tryCombinedMove = () => {
        controls.moveRight(moveX);
        controls.moveForward(moveZ);
      };
      const undoCombinedMove = () => {
        controls.moveForward(-moveZ);
        controls.moveRight(-moveX);
      };

      // Try combined X+Z move first to allow sliding along walls
      tryCombinedMove();
      const hitInfo = getCollisionAtPosition(obj.position, targetHeight, state.radius, { ignoreGroundTriangles: true });
      if (hitInfo.hit) {
        // Revert and try combined step-up
        undoCombinedMove();
        let steppedCombined = false;
        for (let h = stepIncrement; h <= STEP_MAX_HEIGHT + 1e-6; h += stepIncrement) {
          obj.position.y += h;
          tryCombinedMove();
          const blockedInfo = getCollisionAtPosition(obj.position, targetHeight, state.radius);
          if (!blockedInfo.hit) {
            steppedCombined = true;
            break;
          }
          undoCombinedMove();
          obj.position.y -= h;
        }

        if (!steppedCombined) {
          // If we have a wall normal, project intended displacement (world) onto tangent and try sliding
          if (hitInfo.normal) {
            // Build horizontal forward/right in world space
            controls.getDirection(TMP_FORWARD.set(0, 0, 0));
            TMP_FORWARD.y = 0;
            if (TMP_FORWARD.lengthSq() < 1e-6) {
              TMP_FORWARD.set(0, 0, -1);
            } else {
              TMP_FORWARD.normalize();
            }
            TMP_RIGHT.copy(TMP_FORWARD).cross(TMP_UP).normalize();

            // Attempted world displacement this frame
            TMP_DISP.copy(TMP_RIGHT).multiplyScalar(moveX).addScaledVector(TMP_FORWARD, moveZ);

            // Use horizontal component of wall normal
            TMP_N.copy(hitInfo.normal);
            TMP_N.y = 0;
            if (TMP_N.lengthSq() > 1e-6) {
              TMP_N.normalize();
              // Slide: disp_tangent = disp - n*(disp·n)
              const dispDotN = TMP_DISP.dot(TMP_N);
              TMP_SLIDE.copy(TMP_DISP).addScaledVector(TMP_N, -dispDotN);

              // Ensure a minimum sliding amount even when nearly perpendicular.
              // Empirical: 0.35 keeps motion responsive near walls.
              const MIN_TANGENTIAL_RATIO = 0.35;
              const origLen = TMP_DISP.length();
              const slideLen = TMP_SLIDE.length();
              const minLen = origLen * MIN_TANGENTIAL_RATIO;
              if (slideLen < 1e-6) {
                // pick an arbitrary tangent perpendicular to N (horizontal)
                TMP_SLIDE.copy(TMP_RIGHT); // reasonably stable
                TMP_SLIDE.multiplyScalar(Math.sign(TMP_RIGHT.dot(TMP_DISP)) * minLen);
              } else if (slideLen < minLen) {
                TMP_SLIDE.multiplyScalar(minLen / slideLen);
              }

              // Convert slide displacement back to local moveRight/moveForward components
              const projMoveX = TMP_SLIDE.dot(TMP_RIGHT);
              const projMoveZ = TMP_SLIDE.dot(TMP_FORWARD);

              if (projMoveX !== 0 || projMoveZ !== 0) {
                controls.moveRight(projMoveX);
                controls.moveForward(projMoveZ);
                const stillBlocked = isCollidingAtPosition(obj.position, targetHeight, state.radius, { ignoreGroundTriangles: true });
                if (stillBlocked) {
                  // revert if still blocked
                  controls.moveForward(-projMoveZ);
                  controls.moveRight(-projMoveX);
                } else {
                  // Update velocities to align with the slide for next frame
                  state.velocity.x = -projMoveX / delta;
                  state.velocity.z = -projMoveZ / delta;
                  return; // managed to slide; skip axis-separated fallback
                }
              }
            }
          }
          // Fallback: try axis-separated moves with their own step-up
          if (moveX !== 0) {
            controls.moveRight(moveX);
            if (isCollidingAtPosition(obj.position, targetHeight, state.radius, { ignoreGroundTriangles: true })) {
              controls.moveRight(-moveX);
              let steppedX = false;
              for (let h = stepIncrement; h <= STEP_MAX_HEIGHT + 1e-6; h += stepIncrement) {
                obj.position.y += h;
                controls.moveRight(moveX);
                const blockedX = isCollidingAtPosition(obj.position, targetHeight, state.radius);
                if (!blockedX) {
                  steppedX = true;
                  break;
                }
                controls.moveRight(-moveX);
                obj.position.y -= h;
              }
              if (!steppedX) {
                state.velocity.x = 0;
              }
            }
          }

          if (moveZ !== 0) {
            controls.moveForward(moveZ);
            if (isCollidingAtPosition(obj.position, targetHeight, state.radius, { ignoreGroundTriangles: true })) {
              controls.moveForward(-moveZ);
              let steppedZ = false;
              for (let h = stepIncrement; h <= STEP_MAX_HEIGHT + 1e-6; h += stepIncrement) {
                obj.position.y += h;
                controls.moveForward(moveZ);
                const blockedZ = isCollidingAtPosition(obj.position, targetHeight, state.radius);
                if (!blockedZ) {
                  steppedZ = true;
                  break;
                }
                controls.moveForward(-moveZ);
                obj.position.y -= h;
              }
              if (!steppedZ) {
                state.velocity.z = 0;
              }
            }
          }
        }
      }
    }
  }

  // Vertical movement and floor/box collision
  // Reuse the same `obj` acquired earlier for consistency
  const vyBefore = state.velocity.y; // remember sign to detect landing
  obj.position.y += state.velocity.y * delta;
  // Block vertical movement if colliding with boxes
  if (isCollidingAtPosition(obj.position, targetHeight, state.radius)) {
    obj.position.y -= state.velocity.y * delta;
    state.velocity.y = 0;
    if (vyBefore < 0) {
      state.canJump = true; // landed
      state.airControlEnabled = true;
    }
  }
  if (obj.position.y <= targetHeight) {
    state.velocity.y = 0;
    obj.position.y = targetHeight;
    state.canJump = true; // snap to ground if below floor
    state.airControlEnabled = true;
  }
}

