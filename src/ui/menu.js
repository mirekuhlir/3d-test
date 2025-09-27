// Main menu scene
// ---------------
// Responsibility: Display a lightweight DOM-based main menu layered over a
// minimal Three.js background animation. Shows preload progress, enables the
// Play button when ready, and cleans up on exit.
import * as THREE from 'three';
import { createScene } from '../engine/scene.js';
import { createCamera } from '../player/view/camera.js';
import { createLoop } from '../engine/loop.js';
import { setupResize } from '../engine/resize.js';

function createMenuOverlay(onPlay) {
  // Root overlay container
  const root = document.createElement('div');
  root.style.position = 'absolute';
  root.style.inset = '0';
  root.style.display = 'flex';
  root.style.alignItems = 'center';
  root.style.justifyContent = 'center';
  root.style.flexDirection = 'column';
  root.style.gap = '16px';
  root.style.background = 'linear-gradient(180deg, rgba(11,16,32,0.55), rgba(11,16,32,0.75))';
  root.style.backdropFilter = 'blur(2px)';
  root.style.color = '#e6edf3';
  root.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
  root.style.userSelect = 'none';
  root.style.zIndex = '30';

  const title = document.createElement('div');
  title.textContent = 'Main Menu';
  title.style.fontSize = '28px';
  title.style.fontWeight = '700';

  // Progress bar + text status
  const progressWrap = document.createElement('div');
  progressWrap.style.width = '320px';
  progressWrap.style.height = '10px';
  progressWrap.style.borderRadius = '6px';
  progressWrap.style.background = 'rgba(255,255,255,0.18)';
  const progressBar = document.createElement('div');
  progressBar.style.height = '100%';
  progressBar.style.width = '0%';
  progressBar.style.borderRadius = '6px';
  progressBar.style.background = 'linear-gradient(90deg, #00d4ff, #6a5af9)';
  progressWrap.appendChild(progressBar);

  const progressText = document.createElement('div');
  progressText.textContent = 'Loading… 0%';
  progressText.style.opacity = '0.9';

  // Play action. Initially disabled until preloading finishes
  const playBtn = document.createElement('button');
  playBtn.textContent = 'Play';
  playBtn.style.padding = '10px 20px';
  playBtn.style.borderRadius = '8px';
  playBtn.style.border = 'none';
  playBtn.style.fontWeight = '600';
  playBtn.style.background = '#2ea043';
  playBtn.style.color = '#fff';
  playBtn.style.cursor = 'not-allowed';
  playBtn.disabled = true;

  playBtn.addEventListener('click', () => {
    if (!playBtn.disabled) onPlay?.();
  });

  root.appendChild(title);
  root.appendChild(progressWrap);
  root.appendChild(progressText);
  root.appendChild(playBtn);
  document.body.appendChild(root);

  return {
    setProgress(p) {
      // Clamp and apply percent width + label
      const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
      progressBar.style.width = `${pct}%`;
      progressText.textContent = pct >= 100 ? 'Ready' : `Loading… ${pct}%`;
    },
    enablePlay() {
      playBtn.disabled = false;
      playBtn.style.cursor = 'pointer';
    },
    destroy() {
      root.remove();
    }
  };
}

export function createMenu({ renderer, onPlay }) {
  // Background 3D scene visible behind the overlay
  const scene = createScene();
  const camera = createCamera();
  camera.position.set(0, 1.4, 3);

  // Simple animated object to keep the menu lively
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a5af9, metalness: 0.2, roughness: 0.5 });
  const geo = new THREE.TorusKnotGeometry(0.8, 0.25, 120, 16);
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(2, 3, 1.5);
  scene.add(dir);
  scene.add(mesh);

  // Keep renderer/camera sized to the window while the menu is open
  const cleanupResize = setupResize({ renderer, camera });

  const ui = createMenuOverlay(onPlay);

  const loop = createLoop({
    renderer,
    scene,
    camera,
    update: (delta) => {
      // Gentle spin animation
      mesh.rotation.x += delta * 0.4;
      mesh.rotation.y += delta * 0.6;
    }
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    setProgress: (p) => ui.setProgress(p),
    enablePlay: () => ui.enablePlay(),
    destroy: () => {
      // Dispose both UI and 3D assets
      ui.destroy();
      cleanupResize();
      geo.dispose();
      mat.dispose();
    }
  };
}

