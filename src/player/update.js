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
export function updatePlayer({ state, controls, isCollidingAtPosition, delta }) {
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

