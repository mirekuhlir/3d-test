// Player and physics constants
// ----------------------------
// Responsibility: Tunable parameters for movement feel and collision capsule.
// Values are chosen for responsive FPS-style navigation.
export const GRAVITY = 30; // units/s^2
export const MOVE_ACCEL = 50; // acceleration when holding a movement key
export const DAMPING = 10; // air/ground friction
export const JUMP_SPEED = 12;
export const COYOTE_TIME = 0.08; // small grace period to allow jump a moment after leaving ground
export const JUMP_BUFFER_TIME = 0.12; // buffer jump input slightly before landing

export const PLAYER_NORMAL_HEIGHT = 1.6;
export const PLAYER_CROUCH_HEIGHT = 1.0;
export const PLAYER_RADIUS = 0.35;

// Maximum height the player can automatically "step up" when colliding with a low ledge
export const STEP_MAX_HEIGHT = 0.35;

// Ground tolerance configuration for collision handling
// These values help prevent minor sticking on the ground during horizontal checks.
export const DEFAULT_GROUND_TOLERANCE = 0.025;

// Input behavior
// When true, crouch acts as toggle (press once to crouch/stand) instead of hold-to-crouch
export const CROUCH_TOGGLE = true;

// Extra headroom required to allow standing up (in meters). Helps avoid getting stuck under low ceilings.
export const STAND_HEADROOM = 0.02;

// Crouch/stand transition durations (seconds)
// Controls how long it takes to smoothly change the capsule height
export const CROUCH_DURATION = 0.3; // 300ms to crouch down
export const STAND_DURATION = 0.6; // 600ms to stand up
