export function createPointerLockOverlay(controls) {
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
  overlay.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:22px; font-weight:600; margin-bottom:6px;">Klikni pro ovládání myší</div>
      <div style="opacity:0.85">WASD: pohyb • Space: skok • Ctrl/C: skrčit</div>
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
    overlay.style.display = 'flex';
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
