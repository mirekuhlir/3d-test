// Virtual joystick UI
// --------------------
// Responsibility: Render a thumbstick control for mobile movement input and
// report normalized direction deltas to the caller.

const DEFAULT_RADIUS = Math.min(70, Math.max(56, window.innerWidth * 0.08));
const KNOB_RADIUS = DEFAULT_RADIUS * 0.4;

export function createVirtualJoystick({ onChange = () => {}, onLift = () => {} } = {}) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = 'max(16px, env(safe-area-inset-left, 16px))';
  container.style.bottom = 'max(16px, env(safe-area-inset-bottom, 16px))';
  container.style.width = `${DEFAULT_RADIUS * 2}px`;
  container.style.height = `${DEFAULT_RADIUS * 2}px`;
  container.style.borderRadius = '50%';
  container.style.background = 'rgba(15, 18, 32, 0.35)';
  container.style.border = '2px solid rgba(230, 237, 243, 0.25)';
  container.style.touchAction = 'none';
  container.style.backdropFilter = 'blur(8px)';
  container.style.zIndex = '40';

  const knob = document.createElement('div');
  knob.style.position = 'absolute';
  knob.style.width = `${KNOB_RADIUS * 2}px`;
  knob.style.height = `${KNOB_RADIUS * 2}px`;
  knob.style.borderRadius = '50%';
  knob.style.left = `${DEFAULT_RADIUS - KNOB_RADIUS}px`;
  knob.style.top = `${DEFAULT_RADIUS - KNOB_RADIUS}px`;
  knob.style.background = 'rgba(106, 90, 249, 0.85)';
  knob.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
  knob.style.transition = 'transform 80ms ease-out';

  container.appendChild(knob);
  document.body.appendChild(container);

  let activeId = null;
  let offsetX = 0;
  let offsetY = 0;

  function updateKnob(x, y) {
    knob.style.transform = `translate(${x}px, ${y}px)`;
  }

  function resetKnob(notify = true) {
    offsetX = 0;
    offsetY = 0;
    updateKnob(0, 0);
    if (notify) {
      onChange({ x: 0, y: 0 });
      onLift();
    }
  }

  function handleTouchStart(event) {
    if (activeId !== null) return;
    const touch = event.changedTouches[0];
    activeId = touch.identifier;
    processTouchMove(touch);
    event.preventDefault();
  }

  function handleTouchMove(event) {
    if (activeId === null) return;
    for (const touch of event.changedTouches) {
      if (touch.identifier === activeId) {
        processTouchMove(touch);
        event.preventDefault();
        return;
      }
    }
  }

  function handleTouchEnd(event) {
    if (activeId === null) return;
    for (const touch of event.changedTouches) {
      if (touch.identifier === activeId) {
        activeId = null;
        resetKnob(true);
        event.preventDefault();
        return;
      }
    }
  }

  function processTouchMove(touch) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;

    const distance = Math.hypot(dx, dy);
    const maxDistance = Math.max(20, DEFAULT_RADIUS - KNOB_RADIUS);
    const clampedDist = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);
    offsetX = Math.cos(angle) * clampedDist;
    offsetY = Math.sin(angle) * clampedDist;
    updateKnob(offsetX, offsetY);

    const normalizedX = (offsetX / maxDistance) || 0;
    const normalizedY = (offsetY / maxDistance) || 0;
    onChange({ x: normalizedX, y: normalizedY });
  }

  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd, { passive: false });
  container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // Also respond to pointer events for devices emulating touch with mouse
  let pointerActive = false;
  function processPointer(event) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    const distance = Math.hypot(dx, dy);
    const maxDistance = Math.max(20, DEFAULT_RADIUS - KNOB_RADIUS);
    const clampedDist = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);
    offsetX = Math.cos(angle) * clampedDist;
    offsetY = Math.sin(angle) * clampedDist;
    updateKnob(offsetX, offsetY);

    const normalizedX = (offsetX / maxDistance) || 0;
    const normalizedY = (offsetY / maxDistance) || 0;
    onChange({ x: normalizedX, y: normalizedY });
  }

  const onPointerDown = (event) => {
    pointerActive = true;
    processPointer(event);
    event.preventDefault();
  };
  const onPointerMove = (event) => {
    if (!pointerActive) return;
    processPointer(event);
    event.preventDefault();
  };
  const onPointerUp = () => {
    if (!pointerActive) return;
    pointerActive = false;
    resetKnob(true);
  };
  const onPointerCancel = () => {
    if (!pointerActive) return;
    pointerActive = false;
    resetKnob(true);
  };

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);

  function dispose() {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('touchcancel', handleTouchEnd);
    container.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    container.remove();
  }

  return {
    dispose: () => {
      pointerActive = false;
      activeId = null;
      dispose();
    }
  };
}


