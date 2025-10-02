// Touch look controls
// --------------------
// Responsibility: Allow touch dragging on the right side of the screen to
// drive camera yaw/pitch, and provide jump/crouch buttons for mobile.

import { applyLookDelta } from '../../player/view/controls.js';
import { isTouchCapable } from '../../utils/device.js';

const LOOK_SENSITIVITY = 0.0028;

export function createTouchLookControls({ camera, controls, onJump = () => {}, onCrouchPress = () => {}, onCrouchRelease = () => {} }) {
  const preferPointerEvents = typeof window !== 'undefined' && window.PointerEvent && !isTouchCapable();
  const region = document.createElement('div');
  region.style.position = 'fixed';
  region.style.right = '0';
  region.style.bottom = '0';
  region.style.width = '60vw';
  region.style.maxWidth = '520px';
  region.style.height = '100vh';
  region.style.touchAction = 'none';
  region.style.zIndex = '35';
  region.style.background = 'rgba(255,255,255,0)';

  const jumpButton = document.createElement('button');
  jumpButton.textContent = 'Jump';
  styleButton(jumpButton);
  jumpButton.style.bottom = 'max(16px, env(safe-area-inset-bottom, 16px))';
  jumpButton.style.right = 'max(16px, env(safe-area-inset-right, 16px))';
  jumpButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onJump();
  }, { passive: false });
  if (preferPointerEvents) {
    jumpButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      onJump();
    });
  }

  const crouchButton = document.createElement('button');
  crouchButton.textContent = 'Crouch';
  styleButton(crouchButton);
  crouchButton.style.bottom = 'calc(max(16px, env(safe-area-inset-bottom, 16px)) + 110px)';
  crouchButton.style.right = 'max(16px, env(safe-area-inset-right, 16px))';
  crouchButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onCrouchPress();
  }, { passive: false });
  crouchButton.addEventListener('touchend', (event) => {
    event.preventDefault();
    onCrouchRelease();
  }, { passive: false });
  crouchButton.addEventListener('touchcancel', (event) => {
    event.preventDefault();
    onCrouchRelease();
  }, { passive: false });
  if (preferPointerEvents) {
    crouchButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      onCrouchPress();
    });
    crouchButton.addEventListener('pointerup', (event) => {
      event.preventDefault();
      onCrouchRelease();
    });
    crouchButton.addEventListener('pointercancel', () => {
      onCrouchRelease();
    });
    crouchButton.addEventListener('pointerleave', () => {
      if (!crouchButton.hasPointerCapture?.()) {
        onCrouchRelease();
      }
    });
  }

  document.body.appendChild(region);
  document.body.appendChild(jumpButton);
  document.body.appendChild(crouchButton);

  let touchId = null;
  let lastX = 0;
  let lastY = 0;

  function handleTouchStart(event) {
    if (touchId !== null) return;
    const touch = event.changedTouches[0];
    touchId = touch.identifier;
    lastX = touch.clientX;
    lastY = touch.clientY;
    event.preventDefault();
  }

  function handleTouchMove(event) {
    if (touchId === null) return;
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchId) {
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;
        applyTouchDelta(dx, dy);
        lastX = touch.clientX;
        lastY = touch.clientY;
        event.preventDefault();
        return;
      }
    }
  }

  function handleTouchEnd(event) {
    if (touchId === null) return;
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchId) {
        touchId = null;
        event.preventDefault();
        return;
      }
    }
  }

  function applyTouchDelta(dx, dy) {
    const yawDelta = -dx * LOOK_SENSITIVITY;
    const pitchDelta = -dy * LOOK_SENSITIVITY;
    applyLookDelta(controls, yawDelta, pitchDelta);
    syncCameraQuaternion();
  }

  function syncCameraQuaternion() {
    const obj = controls.getObject();
    camera.quaternion.copy(obj.quaternion);
  }

  region.addEventListener('touchstart', handleTouchStart, { passive: false });
  region.addEventListener('touchmove', handleTouchMove, { passive: false });
  region.addEventListener('touchend', handleTouchEnd, { passive: false });
  region.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  let onPointerMove = null;
  let onPointerUp = null;
  let onPointerCancel = null;
  if (preferPointerEvents) {
    region.addEventListener('pointerdown', (event) => {
      touchId = 'pointer';
      lastX = event.clientX;
      lastY = event.clientY;
    });
    onPointerMove = (event) => {
      if (touchId !== 'pointer') return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      applyTouchDelta(dx, dy);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    onPointerUp = () => {
      if (touchId !== 'pointer') return;
      touchId = null;
    };
    onPointerCancel = () => {
      if (touchId !== 'pointer') return;
      touchId = null;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  }

  function dispose() {
    region.removeEventListener('touchstart', handleTouchStart);
    region.removeEventListener('touchmove', handleTouchMove);
    region.removeEventListener('touchend', handleTouchEnd);
    region.removeEventListener('touchcancel', handleTouchEnd);
    region.remove();
    jumpButton.remove();
    crouchButton.remove();
    if (preferPointerEvents) {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    }
  }

  return {
    dispose
  };
}

function styleButton(btn) {
  btn.style.position = 'fixed';
  btn.style.width = 'min(100px, max(80px, 16vw))';
  btn.style.height = 'min(100px, max(80px, 16vw))';
  btn.style.borderRadius = '50%';
  btn.style.border = 'none';
  btn.style.background = 'rgba(106, 90, 249, 0.85)';
  btn.style.color = '#fff';
  btn.style.fontSize = 'clamp(14px, 3.2vw, 18px)';
  btn.style.fontWeight = '600';
  btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
  btn.style.touchAction = 'none';
  btn.style.zIndex = '50';
}


