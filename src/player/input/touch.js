// Touch controls for mobile
// -------------------------
// Responsibility: Provide touch-based movement (virtual joystick) and look
// controls for mobile devices. Updates the shared player state in the same way
// as keyboard controls so the physics update loop can stay unchanged.

import { CROUCH_TOGGLE } from '../physics/constants.js';
import { createVirtualJoystick } from '../../ui/mobile/joystick.js';
import { createTouchLookControls } from '../../ui/mobile/look.js';

export function setupTouchInput(state, { camera, controls }) {
  const movement = createVirtualJoystick({
    onChange: ({ x, y }) => {
      state.moveForward = y < -0.1;
      state.moveBackward = y > 0.1;
      state.moveLeft = x < -0.1;
      state.moveRight = x > 0.1;
      state.touchMoveX = x;
      state.touchMoveY = y;
    },
    onLift: () => {
      state.moveForward = false;
      state.moveBackward = false;
      state.moveLeft = false;
      state.moveRight = false;
      state.touchMoveX = 0;
      state.touchMoveY = 0;
    }
  });

  const look = createTouchLookControls({
    camera,
    controls,
    onJump: () => {
      state.wantJump = true;
      state.lastJumpPressedTime = performance.now();
    },
    onCrouchPress: () => {
      if (CROUCH_TOGGLE) {
        state.isCrouching = !state.isCrouching;
      } else {
        state.isCrouching = true;
      }
    },
    onCrouchRelease: () => {
      if (!CROUCH_TOGGLE) {
        state.isCrouching = false;
      }
    }
  });

  return () => {
    movement.dispose();
    look.dispose();
    state.touchMoveX = 0;
    state.touchMoveY = 0;
  };
}


