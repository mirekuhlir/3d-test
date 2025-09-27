/**
 * Rendering configuration
 *
 * RENDER_SCALE controls the internal render buffer size relative to the
 * displayed CSS size. Set to 1 for native resolution, 0.5 for half resolution,
 * etc. Lower values improve performance at the expense of sharpness.
 */
export const RENDER_SCALE = 1; // e.g. 0.5 for half-res

/**
 * MAX_DEVICE_PIXEL_RATIO clamps the effective device pixel ratio used by the
 * renderer. Set this to 1 to avoid high-DPI overhead and rely solely on
 * RENDER_SCALE for resolution control. Increase if you want sharper rendering
 * on retina displays while still being able to scale down via RENDER_SCALE.
 */
export const MAX_DEVICE_PIXEL_RATIO = 1; // e.g. 2 to allow some HiDPI sharpness

