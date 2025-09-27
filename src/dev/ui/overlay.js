export function createDevPointerOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '30';
  overlay.style.background = 'transparent';
  overlay.style.display = 'none';
  overlay.style.cursor = 'crosshair';
  document.body.appendChild(overlay);
  return overlay;
}
