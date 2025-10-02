// Device helpers
// --------------
// Responsibility: Provide small runtime checks to detect touch-capable or
// mobile-class devices so the game can switch input schemes automatically.

export function isTouchCapable() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileMatch = /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i.test(ua);
  if (mobileMatch) return true;
  // Fallback: treat small touch devices as mobile
  if (isTouchCapable() && typeof window !== 'undefined') {
    const screenWidth = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    return screenWidth > 0 && screenWidth <= 900;
  }
  return false;
}

export function shouldUseMobileUI() {
  return isMobileDevice();
}


