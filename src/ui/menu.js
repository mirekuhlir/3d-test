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
import { shouldUseMobileUI } from '../utils/device.js';
import { ensureLandscapeOrientation } from '../utils/orientation.js';

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
  root.style.background = 'linear-gradient(180deg, rgba(25, 25, 25, 0.9), rgba(15, 15, 15, 0.95))';
  root.style.backdropFilter = 'blur(2px)';
  root.style.color = '#e6edf3';
  root.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
  root.style.userSelect = 'none';
  root.style.zIndex = '30';


  // Geometric shapes animation
  for (let i = 0; i < 15; i++) {
    const shape = document.createElement('div');
    const shapes = ['square', 'circle', 'triangle', 'diamond'];
    const shapeType = shapes[i % shapes.length];

    shape.style.position = 'absolute';
    shape.style.width = `${25 + Math.random() * 50}px`;
    shape.style.height = `${25 + Math.random() * 50}px`;
    shape.style.left = `${Math.random() * 100}%`;
    shape.style.top = `${Math.random() * 100}%`;
    shape.style.background = `rgba(100, 116, 139, ${0.2 + Math.random() * 0.3})`;
    shape.style.animation = `geometricFloat ${3 + Math.random() * 2}s ease-in-out infinite`;
    shape.style.animationDelay = `${Math.random() * 1.5}s`;

    if (shapeType === 'circle') {
      shape.style.borderRadius = '50%';
    } else if (shapeType === 'triangle') {
      shape.style.width = '0';
      shape.style.height = '0';
      shape.style.borderLeft = `${15 + Math.random() * 20}px solid transparent`;
      shape.style.borderRight = `${15 + Math.random() * 20}px solid transparent`;
      shape.style.borderBottom = `${25 + Math.random() * 30}px solid rgba(100, 116, 139, ${0.2 + Math.random() * 0.3})`;
      shape.style.background = 'transparent';
    } else if (shapeType === 'diamond') {
      shape.style.transform = 'rotate(45deg)';
      shape.style.borderRadius = '4px';
    }

    // Add keyframes for geometric animation
    if (!document.getElementById('geometric-keyframes')) {
      const style = document.createElement('style');
      style.id = 'geometric-keyframes';
      style.textContent = `
        @keyframes geometricFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
          25% { transform: translateY(-20px) rotate(90deg); opacity: 0.8; }
          50% { transform: translateY(10px) rotate(180deg); opacity: 0.6; }
          75% { transform: translateY(-10px) rotate(270deg); opacity: 0.9; }
        }
      `;
      document.head.appendChild(style);
    }

    root.appendChild(shape);
  }

  // Play action. Initially disabled until preloading finishes, shows "Loading"
  const playBtn = document.createElement('button');
  playBtn.textContent = 'Loading';
  playBtn.style.padding = '30px 60px';
  playBtn.style.borderRadius = '16px';
  playBtn.style.border = 'none';
  playBtn.style.fontSize = '32px';
  playBtn.style.fontWeight = '600';
  playBtn.style.background = '#4a5568';
  playBtn.style.color = '#fff';
  playBtn.style.cursor = 'not-allowed';
  playBtn.style.transition = 'all 0.3s ease';
  playBtn.style.transform = 'scale(1)';
  playBtn.disabled = true;

  // Add hover effect styles
  const addHoverEffect = () => {
    if (!playBtn.disabled) {
      playBtn.style.background = '#5a6578';
      playBtn.style.transform = 'scale(1.05)';
      playBtn.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    }
  };

  const removeHoverEffect = () => {
    if (!playBtn.disabled) {
      playBtn.style.background = '#4a5568';
      playBtn.style.transform = 'scale(1)';
      playBtn.style.boxShadow = 'none';
    }
  };

  playBtn.addEventListener('mouseenter', addHoverEffect);
  playBtn.addEventListener('mouseleave', removeHoverEffect);

  playBtn.addEventListener('click', () => {
    if (playBtn.disabled) return;
    const result = onPlay?.();
    if (result && typeof result.then === 'function') {
      result.catch(() => {});
    }
  });

  root.appendChild(playBtn);

  const controlsHint = document.createElement('div');
  controlsHint.style.textAlign = 'center';
  controlsHint.style.display = 'flex';
  controlsHint.style.flexDirection = 'column';
  controlsHint.style.alignItems = 'center';
  controlsHint.style.gap = '8px';

  const heading = document.createElement('div');
  heading.style.fontSize = '22px';
  heading.style.fontWeight = '600';
  heading.style.marginBottom = '6px';
  heading.textContent = 'Ready to ride?';
  controlsHint.appendChild(heading);

  const controlsText = document.createElement('div');
  controlsText.style.opacity = '0.85';
  controlsText.style.fontSize = '16px';

  const showMobile = shouldUseMobileUI();
  if (showMobile) {
    controlsText.textContent = 'Left stick: move • Swipe right: look • Tap Jump / Crouch buttons';
  } else {
    controlsText.textContent = 'WASD: move • Space: jump/stand up • Ctrl/C: crouch';
  }
  controlsHint.appendChild(controlsText);

  if (!showMobile) {
    const mouseHint = document.createElement('div');
    mouseHint.style.opacity = '0.7';
    mouseHint.style.fontSize = '15px';
    mouseHint.textContent = 'Click to lock mouse when the game starts.';
    controlsHint.appendChild(mouseHint);
  }

  root.appendChild(controlsHint);

  document.body.appendChild(root);

  return {
    setProgress(p) {
      // When loading is complete, change button text to "Play"
      const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
      if (pct >= 100) {
        playBtn.textContent = 'Play';
      }
    },
    enablePlay() {
      playBtn.disabled = false;
      playBtn.style.cursor = 'pointer';
      playBtn.style.background = '#4a5568';
      playBtn.textContent = 'Play';
    },
    destroy() {
      root.remove();
    },
    getPlayButton: () => playBtn,
    getRoot: () => root
  };
}

export function createMenu({ renderer, onPlay }) {
  // Background 3D scene visible behind the overlay
  const scene = createScene();
  const camera = createCamera();
  camera.position.set(0, 1.4, 3);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(2, 3, 1.5);
  scene.add(dir);

  // Keep renderer/camera sized to the window while the menu is open
  const cleanupResize = setupResize({ renderer, camera });

  const ui = createMenuOverlay(() => {
    if (shouldUseMobileUI()) {
      ensureLandscapeOrientation({
        fullscreenFallback: true,
        fullscreenTarget: renderer?.domElement?.parentElement || document?.documentElement
      }).catch(() => {});
    }
    return onPlay?.();
  });

  const loop = createLoop({
    renderer,
    scene,
    camera,
    update: (delta) => {
      // Menu background animation (placeholder for future animations)
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
    }
  };
}

