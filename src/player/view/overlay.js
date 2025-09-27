// Gameplay overlays
// ------------------
// Responsibility: Create UI overlays layered over the canvas — a pointer-lock
// prompt, a crosshair that shows only while locked, and a lightweight FPS meter.
import { CROUCH_TOGGLE } from '../physics/constants.js';

export function createPointerLockOverlay(controls, isDevModeActive = () => false) {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.flexDirection = 'column';
  overlay.style.gap = '12px';
  overlay.style.background = 'rgba(11, 16, 32, 0.6)';
  overlay.style.backdropFilter = 'blur(2px)';
  overlay.style.color = '#e6edf3';
  overlay.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
  overlay.style.userSelect = 'none';
  const crouchModeLabel = CROUCH_TOGGLE ? 'toggle' : 'hold';
  overlay.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:22px; font-weight:600; margin-bottom:6px;">Click to control with mouse</div>
      <div style="opacity:0.85;">WASD: move • Space: jump/stand up • Ctrl/C: crouch (${crouchModeLabel})</div>
    </div>
  `;
  overlay.style.cursor = 'pointer';
  overlay.style.zIndex = '10';

  overlay.addEventListener('click', () => {
    if (!controls.isLocked) controls.lock();
  });

  controls.addEventListener('lock', () => {
    overlay.style.display = 'none';
  });
  controls.addEventListener('unlock', () => {
    // Don't show overlay in dev mode
    if (isDevModeActive()) {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'flex';
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function createCrosshair(controls) {
  const crosshair = document.createElement('div');
  crosshair.style.position = 'fixed';
  crosshair.style.left = '50%';
  crosshair.style.top = '50%';
  crosshair.style.transform = 'translate(-50%, -50%)';
  crosshair.style.width = '8px';
  crosshair.style.height = '8px';
  crosshair.style.borderRadius = '50%';
  crosshair.style.border = '2px solid rgba(230, 237, 243, 0.95)';
  crosshair.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.3)';
  crosshair.style.pointerEvents = 'none';
  crosshair.style.zIndex = '5';
  crosshair.style.display = 'none';

  controls.addEventListener('lock', () => {
    crosshair.style.display = 'block';
  });
  controls.addEventListener('unlock', () => {
    crosshair.style.display = 'none';
  });

  document.body.appendChild(crosshair);
  return crosshair;
}

/**
 * Creates a lightweight on-screen FPS meter.
 *
 * The meter renders as a small fixed element in the top-left corner and
 * exposes a `tick()` method that should be called once per rendered frame.
 * It uses a smoothed instantaneous FPS (EMA) and throttles DOM updates to
 * at most 4 times per second to reduce layout work.
 */
export function createFPSMeter() {
  const fpsEl = document.createElement('div');
  fpsEl.style.position = 'fixed';
  fpsEl.style.left = '10px';
  fpsEl.style.top = '10px';
  fpsEl.style.padding = '4px 8px';
  fpsEl.style.borderRadius = '6px';
  fpsEl.style.background = 'rgba(0, 0, 0, 0.35)';
  fpsEl.style.color = '#e6edf3';
  fpsEl.style.fontSize = '12px';
  fpsEl.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, Liberation Mono, monospace';
  fpsEl.style.lineHeight = '1';
  fpsEl.style.userSelect = 'none';
  fpsEl.style.pointerEvents = 'none';
  fpsEl.style.zIndex = '20';
  fpsEl.textContent = 'FPS: --';

  document.body.appendChild(fpsEl);

  let lastFrameTimeMs = performance.now();
  let lastDomUpdateMs = lastFrameTimeMs;
  let smoothedFps = 0;
  const smoothingFactor = 0.12; // EMA smoothing factor

  function tick() {
    const now = performance.now();
    const deltaMs = now - lastFrameTimeMs;
    lastFrameTimeMs = now;
    const currentFps = deltaMs > 0 ? 1000 / deltaMs : 0;

    if (smoothedFps === 0) {
      smoothedFps = currentFps;
    } else {
      smoothedFps += (currentFps - smoothedFps) * smoothingFactor;
    }

    if (now - lastDomUpdateMs >= 250) {
      fpsEl.textContent = `FPS: ${Math.round(smoothedFps)}`;
      lastDomUpdateMs = now;
    }
  }

  function destroy() {
    fpsEl.remove();
  }

  return { tick, destroy, el: fpsEl };
}
