// Lightweight main menu scene with DOM UI and a tiny 3D animation in the background.
import * as THREE from 'three';
import { createScene } from '../core/scene.js';
import { createCamera } from '../player/camera.js';
import { createLoop } from '../core/loop.js';
import { setupResize } from '../systems/resize.js';

function createMenuOverlay(onPlay) {
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
  title.textContent = 'Hlavní menu';
  title.style.fontSize = '28px';
  title.style.fontWeight = '700';

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
  progressText.textContent = 'Načítám… 0%';
  progressText.style.opacity = '0.9';

  const playBtn = document.createElement('button');
  playBtn.textContent = 'Hrát';
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
      const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
      progressBar.style.width = `${pct}%`;
      progressText.textContent = pct >= 100 ? 'Připraveno' : `Načítám… ${pct}%`;
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
  const scene = createScene();
  const camera = createCamera();
  camera.position.set(0, 1.4, 3);

  // Simple background object animation
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a5af9, metalness: 0.2, roughness: 0.5 });
  const geo = new THREE.TorusKnotGeometry(0.8, 0.25, 120, 16);
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(2, 3, 1.5);
  scene.add(dir);
  scene.add(mesh);

  const cleanupResize = setupResize({ renderer, camera });

  const ui = createMenuOverlay(onPlay);

  const loop = createLoop({
    renderer,
    scene,
    camera,
    update: (delta) => {
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
      ui.destroy();
      cleanupResize();
      geo.dispose();
      mat.dispose();
    }
  };
}

