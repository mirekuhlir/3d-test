// Ground tolerance configuration for collision handling
// These values help prevent minor sticking on the ground during horizontal checks.
export const DEFAULT_GROUND_TOLERANCE = 0.025;
export const MIN_GROUND_TOLERANCE = 0.015;
export const MAX_GROUND_TOLERANCE = 0.03;

/**
 * Parse ground tolerance from URL param `tol` and clamp to a safe range.
 */
export function getGroundTolerance() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('tol');
  const parsed = param != null ? parseFloat(param) : NaN;
  if (Number.isFinite(parsed)) {
    return Math.min(MAX_GROUND_TOLERANCE, Math.max(MIN_GROUND_TOLERANCE, parsed));
  }
  return DEFAULT_GROUND_TOLERANCE;
}

