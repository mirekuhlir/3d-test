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
