export function setupKeyboardInput(state) {
  function onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        state.moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        state.moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        state.moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        state.moveRight = true;
        break;
      case 'Space':
        if (state.canJump === true) {
          state.velocity.y += state.jumpSpeed;
          state.canJump = false;
          // Snapshot input direction for jump handling in update loop
          const dirZ = Number(state.moveForward) - Number(state.moveBackward);
          const dirX = Number(state.moveRight) - Number(state.moveLeft);
          state.jumpDirX = dirX;
          state.jumpDirZ = dirZ;
          state.didJumpThisFrame = true;
          // Enable air control only if there was directional input when the jump started
          state.airControlEnabled = (dirX !== 0 || dirZ !== 0);
        }
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        state.isCrouching = true;
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        state.moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        state.moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        state.moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        state.moveRight = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        state.isCrouching = false;
        break;
    }
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  };
}
