import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createFPSControls } from '../player/controls.js';
import { createCamera } from '../player/camera.js';

/**
 * Dev mode manager: encapsulates free-fly camera, debug UI and player capsule.
 */
export function createDevMode({
  renderer,
  scene,
  baseCamera,
  baseControls,
  overlay,
  state,
  pauseGameplay = () => {},
  resumeGameplay = () => {}
}) {
  let isActive = false;

  // Dev camera and controls (use PointerLock for smooth look)
  const devCamera = createCamera();
  devCamera.position.set(0, 5, 8);
  devCamera.lookAt(0, 1.6, 0);
  const devControls = createFPSControls(devCamera, renderer.domElement);

  // Dev panel (floating UI)
  const devPanel = document.createElement('div');
  devPanel.style.position = 'fixed';
  devPanel.style.right = '10px';
  devPanel.style.top = '10px';
  devPanel.style.padding = '10px 12px';
  devPanel.style.borderRadius = '8px';
  devPanel.style.background = 'rgba(0,0,0,0.45)';
  devPanel.style.color = '#e6edf3';
  devPanel.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, Liberation Mono, monospace';
  devPanel.style.fontSize = '12px';
  devPanel.style.display = 'none';
  devPanel.style.zIndex = '40';
  devPanel.innerHTML = `
    <div style="display:flex; gap:8px; align-items:center;">
      <strong>DEV</strong>
      <button id="btn-exit-dev" style="padding:6px 10px; border:none; border-radius:6px; background:#d73a49; color:#fff; cursor:pointer; font-weight:600;">Exit</button>
    </div>
  `;
  document.body.appendChild(devPanel);

  const btnExitDev = devPanel.querySelector('#btn-exit-dev');

  // WASD state for free-fly movement
  const devMove = { fwd: false, back: false, left: false, right: false };

  let capsuleMesh = null;
  function ensureCapsuleMesh() {
    if (capsuleMesh) return capsuleMesh;
    const r = state.radius;
    const h = state.normalHeight - 2 * r;
    const top = new THREE.SphereGeometry(r, 16, 12);
    const bottom = new THREE.SphereGeometry(r, 16, 12);
    const cyl = new THREE.CylinderGeometry(r, r, Math.max(0.001, h), 16, 1, true);
    top.translate(0, h * 0.5, 0);
    bottom.translate(0, -h * 0.5, 0);
    const merged = mergeGeometries([top, cyl, bottom], false);
    top.dispose();
    bottom.dispose();
    cyl.dispose();
    const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.9 });
    capsuleMesh = new THREE.Mesh(merged, mat);
    capsuleMesh.visible = false;
    scene.add(capsuleMesh);
    return capsuleMesh;
  }

  function updateCapsuleFromPlayer() {
    if (!capsuleMesh) return;
    const obj = baseControls.getObject();
    const targetHeight = state.isCrouching ? state.crouchHeight : state.normalHeight;
    const y = obj.position.y - targetHeight * 0.5;
    capsuleMesh.position.set(obj.position.x, y, obj.position.z);
    capsuleMesh.rotation.set(0, 0, 0);
  }

  function enter() {
    if (isActive) return;
    isActive = true;
    // Unlock base controls and hide overlay; show dev panel
    if (baseControls.isLocked) baseControls.unlock();
    if (overlay) overlay.style.display = 'none';
    devPanel.style.display = 'block';
    ensureCapsuleMesh();
    capsuleMesh.visible = true;
    // Lock dev controls for smooth look
    if (!devControls.isLocked) devControls.lock();
    // Pause gameplay keyboard bindings (jump, crouch, ...)
    pauseGameplay();
  }

  function exit() {
    if (!isActive) return;
    isActive = false;
    devPanel.style.display = 'none';
    if (overlay) overlay.style.display = 'flex';
    if (capsuleMesh) capsuleMesh.visible = false;
    if (devControls.isLocked) devControls.unlock();
    // Resume gameplay keyboard bindings
    resumeGameplay();
  }

  function onKeyDownDev(e) {
    if (e.code === 'Escape') {
      if (!isActive) {
        enter();
      } else {
        devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
      }
    }
  }

  function onKeyDownDevMove(e) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') devMove.fwd = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') devMove.back = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') devMove.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') devMove.right = true;
  }
  function onKeyUpDevMove(e) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') devMove.fwd = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') devMove.back = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') devMove.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') devMove.right = false;
  }

  window.addEventListener('keydown', onKeyDownDev);
  window.addEventListener('keydown', onKeyDownDevMove);
  window.addEventListener('keyup', onKeyUpDevMove);
  btnExitDev?.addEventListener('click', exit);

  function handleCanvasClick() {
    if (isActive) {
      if (!devControls.isLocked) devControls.lock();
    } else {
      if (!baseControls.isLocked) baseControls.lock();
    }
  }

  function attachDevButton(overlayEl) {
    if (!overlayEl) return;
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.right = '12px';
    container.style.top = '12px';
    const btn = document.createElement('button');
    btn.textContent = 'Dev mód';
    btn.id = 'devToggleBtn';
    btn.style.padding = '8px 14px';
    btn.style.borderRadius = '8px';
    btn.style.border = 'none';
    btn.style.background = '#6a5af9';
    btn.style.color = '#fff';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      enter();
    });
    container.appendChild(btn);
    overlayEl.appendChild(container);
  }

  function update(delta) {
    if (!isActive) return;
    const speed = 8;
    const forwardAmt = (Number(devMove.fwd) - Number(devMove.back)) * speed * delta;
    const strafeAmt = (Number(devMove.right) - Number(devMove.left)) * speed * delta;
    const obj = devControls.getObject();

    const forwardDir = new THREE.Vector3();
    devCamera.getWorldDirection(forwardDir).normalize();
    if (forwardAmt) obj.position.addScaledVector(forwardDir, forwardAmt);
    if (strafeAmt) {
      const rightDir = new THREE.Vector3().crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
      obj.position.addScaledVector(rightDir, strafeAmt);
    }

    if (capsuleMesh?.visible) updateCapsuleFromPlayer();
  }

  function getCamera() {
    return isActive ? devCamera : baseCamera;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDownDev);
    window.removeEventListener('keydown', onKeyDownDevMove);
    window.removeEventListener('keyup', onKeyUpDevMove);
    btnExitDev?.removeEventListener?.('click', exit);
    devPanel.remove();
    if (capsuleMesh) {
      capsuleMesh.geometry?.dispose?.();
      capsuleMesh.material?.dispose?.();
      scene.remove(capsuleMesh);
      capsuleMesh = null;
    }
  }

  return {
    isActive: () => isActive,
    getCamera,
    enter,
    exit,
    handleCanvasClick,
    attachDevButton,
    update,
    dispose
  };
}

