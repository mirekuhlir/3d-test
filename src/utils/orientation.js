import { isMobileDevice } from './device.js';

const LANDSCAPE_VARIANTS = ['landscape-primary', 'landscape-secondary', 'landscape'];

function getScreen() {
  if (typeof window === 'undefined') return undefined;
  return window.screen;
}

function getOrientationLockHandlers() {
  const screenObj = getScreen();
  if (!screenObj) return [];

  const handlers = [];
  const orientation = screenObj.orientation;

  if (orientation?.lock) {
    handlers.push(async (value) => {
      await orientation.lock(value);
      return true;
    });
  }

  const legacyLock =
    screenObj.lockOrientation ||
    screenObj.mozLockOrientation ||
    screenObj.msLockOrientation ||
    screenObj.orientation?.lock;

  if (legacyLock) {
    handlers.push(async (value) => {
      const result = legacyLock.call(screenObj, value);
      if (result === true) return true;
      if (result === false) return false;
      if (result && typeof result.then === 'function') {
        const resolved = await result;
        return resolved === undefined ? true : !!resolved;
      }
      return !!result;
    });
  }

  return handlers;
}

function isFullscreenError(error) {
  if (!error) return false;
  const name = error.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('fullscreen') || message.includes('full-screen');
}

async function tryLockLandscapeOnce() {
  const lockHandlers = getOrientationLockHandlers();
  if (!lockHandlers.length) {
    return { success: false, reason: 'unsupported' };
  }

  let lastError = null;
  let fullscreenRequired = false;

  for (const lock of lockHandlers) {
    for (const value of LANDSCAPE_VARIANTS) {
      try {
        const result = await lock(value);
        if (result !== false) {
          return { success: true };
        }
      } catch (error) {
        lastError = error;
        if (isFullscreenError(error)) {
          fullscreenRequired = true;
        }
      }
    }
  }

  if (fullscreenRequired) {
    return { success: false, reason: 'fullscreen-required', error: lastError };
  }

  return { success: false, reason: 'error', error: lastError };
}

function getFullscreenElement() {
  if (typeof document === 'undefined') return null;
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    document.mozFullScreenElement ||
    null
  );
}

async function requestFullscreen(target) {
  if (typeof document === 'undefined') return false;
  const element = target || document.documentElement;
  if (!element) return false;

  const request =
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||
    element.msRequestFullscreen ||
    element.mozRequestFullScreen;

  if (!request) return false;

  try {
    const result = request.call(element);
    if (result && typeof result.then === 'function') {
      await result;
    }
    return true;
  } catch (error) {
    void error;
    return false;
  }
}

function isLandscape() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(orientation: landscape)').matches;
}

export async function ensureLandscapeOrientation({ fullscreenFallback = true, fullscreenTarget } = {}) {
  if (typeof window === 'undefined' || !isMobileDevice()) return false;

  const attempt = await tryLockLandscapeOnce();
  if (attempt.success) return true;

  if (fullscreenFallback && attempt.reason === 'fullscreen-required' && !getFullscreenElement()) {
    const entered = await requestFullscreen(fullscreenTarget);
    if (entered) {
      const secondAttempt = await tryLockLandscapeOnce();
      if (secondAttempt.success) return true;
    }
  }

  return isLandscape();
}

export function setupAutoLandscapeOrientation({ fullscreenFallback = false, fullscreenTarget } = {}) {
  if (typeof window === 'undefined' || !isMobileDevice()) {
    return () => {};
  }

  let disposed = false;

  const ensure = () => {
    if (disposed) return;
    ensureLandscapeOrientation({ fullscreenFallback, fullscreenTarget }).catch(() => {});
  };

  const cleanupStack = [];
  const orientation = window.screen?.orientation;

  if (orientation?.addEventListener) {
    const handleOrientationChange = () => ensure();
    orientation.addEventListener('change', handleOrientationChange);
    cleanupStack.push(() => orientation.removeEventListener('change', handleOrientationChange));
  } else if (typeof window.addEventListener === 'function') {
    const handleLegacyOrientationChange = () => ensure();
    window.addEventListener('orientationchange', handleLegacyOrientationChange);
    cleanupStack.push(() => window.removeEventListener('orientationchange', handleLegacyOrientationChange));
  }

  if (typeof window.matchMedia === 'function') {
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const handleMediaChange = (event) => {
      if (event.matches) ensure();
    };

    if (portraitQuery.addEventListener) {
      portraitQuery.addEventListener('change', handleMediaChange);
      cleanupStack.push(() => portraitQuery.removeEventListener('change', handleMediaChange));
    } else if (portraitQuery.addListener) {
      portraitQuery.addListener(handleMediaChange);
      cleanupStack.push(() => portraitQuery.removeListener(handleMediaChange));
    }
  }

  ensure();

  return () => {
    disposed = true;
    cleanupStack.forEach((cleanup) => cleanup());
  };
}


