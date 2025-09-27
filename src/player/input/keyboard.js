// Keyboard bindings for gameplay
// ------------------------------
// Responsibility: Translate keydown/keyup events into state flags used by the
// player update loop (WASD movement, jumping, crouching). Also snapshots
// directional input at jump start to drive air-control behavior.
import { CROUCH_TOGGLE } from '../physics/constants.js';

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
        // Defer actual jump to update loop (so we can ground-check ignoring walls)
        if (!event.repeat) {
          state.wantJump = true;
          state.lastJumpPressedTime = performance.now();
        }
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        if (CROUCH_TOGGLE) {
          if (!event.repeat) {
            state.isCrouching = !state.isCrouching;
          }
        } else {
          state.isCrouching = true;
        }
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
        if (!CROUCH_TOGGLE) {
          state.isCrouching = false;
        }
        break;
    }
  }

  // Attach listeners to the document; return a cleanup function for disposal
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  };
}
