// Player state container
// ----------------------
// Responsibility: Hold gameplay input flags, physical parameters, and runtime
// vectors used by the player update loop. This is a minimal mutable store.
import * as THREE from 'three';
import {
  PLAYER_NORMAL_HEIGHT,
  PLAYER_CROUCH_HEIGHT,
  GRAVITY,
  MOVE_ACCEL,
  DAMPING,
  JUMP_SPEED,
  PLAYER_RADIUS
} from './constants.js';

export function createPlayerState() {
  return {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isCrouching: false,
    canJump: false,

    normalHeight: PLAYER_NORMAL_HEIGHT,
    crouchHeight: PLAYER_CROUCH_HEIGHT,
    radius: PLAYER_RADIUS,

    // Current player capsule height (maintain across frames for correct
    // camera movement when height changes – we want the "feet" to stay
    // in the same place while the capsule top position changes)
    currentHeight: PLAYER_NORMAL_HEIGHT,

    gravity: GRAVITY,
    moveAccel: MOVE_ACCEL,
    damping: DAMPING,
    jumpSpeed: JUMP_SPEED,

    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),

    // Air control: when player jumps without directional input, disable mid-air WASD acceleration
    airControlEnabled: true,

    // Jump snapshot info
    jumpDirX: 0,
    jumpDirZ: 0,
    didJumpThisFrame: false
  };
}
