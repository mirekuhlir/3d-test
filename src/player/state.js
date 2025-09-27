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
    direction: new THREE.Vector3()
  };
}
