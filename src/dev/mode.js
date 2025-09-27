import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createFPSControls } from '../player/controls.js';
import { createCamera } from '../player/camera.js';

/**
 * Dev mode manager: encapsulates free-fly camera, debug UI and player capsule.
 * Responsibility: Toggleable developer mode that swaps the active camera to a
 * separate first-person controller, shows a floating debug panel, renders a
 * wireframe capsule aligned with the player, and handles its own input.
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

  // Use a dedicated overlay element for dev pointer lock so base controls never lock with it
  const devPointerEl = document.createElement('div');
  devPointerEl.style.position = 'fixed';
  devPointerEl.style.inset = '0';
  devPointerEl.style.zIndex = '30'; // above gameplay overlay/crosshair, below dev panel
  devPointerEl.style.background = 'transparent';
  devPointerEl.style.display = 'none';
  devPointerEl.style.cursor = 'crosshair';
  document.body.appendChild(devPointerEl);

  const devControls = createFPSControls(devCamera, devPointerEl);
  
  // Sync dev camera/controls from base camera/controls
  function syncDevCameraFromBase() {
    const baseObj = baseControls.getObject();
    const devObj = devControls.getObject();
    // Position: copy player (base controls) position
    devObj.position.copy(baseObj.position);
    
    // Orientation: derive yaw (Y) and pitch (X) from base camera quaternion
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(baseCamera.quaternion);
    // yawObject
    devObj.rotation.y = euler.y;
    // pitchObject (first child of yawObject in PointerLockControls)
    const pitchObj = devObj.children?.[0];
    if (pitchObj) {
      pitchObj.rotation.x = euler.x;
    }
    // Also copy camera quaternion for completeness
    devCamera.quaternion.copy(baseCamera.quaternion);
  }
  
  // Player camera frustum helper (visible only in dev mode)
  let cameraHelper = null;
  function ensureCameraHelper() {
    if (cameraHelper) return cameraHelper;
    cameraHelper = new THREE.CameraHelper(baseCamera);
    cameraHelper.visible = false;
    scene.add(cameraHelper);
    return cameraHelper;
  }

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
  let capsuleHeightCached = null;

  function createWireCapsuleGeometry(height, radius) {
    const r = radius;
    const h = Math.max(0, height - 2 * r);
    const top = new THREE.SphereGeometry(r, 16, 12);
    const bottom = new THREE.SphereGeometry(r, 16, 12);
    const cyl = new THREE.CylinderGeometry(r, r, Math.max(0.001, h), 16, 1, true);
    top.translate(0, h * 0.5, 0);
    bottom.translate(0, -h * 0.5, 0);
    const merged = mergeGeometries([top, cyl, bottom], false);
    top.dispose();
    bottom.dispose();
    cyl.dispose();
    return merged;
  }

  function ensureCapsuleMesh(height) {
    if (capsuleMesh) return capsuleMesh;
    const geom = createWireCapsuleGeometry(height, state.radius);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.9 });
    capsuleMesh = new THREE.Mesh(geom, mat);
    capsuleMesh.visible = false;
    capsuleHeightCached = height;
    scene.add(capsuleMesh);
    return capsuleMesh;
  }

  function updateCapsuleFromPlayer() {
    const obj = baseControls.getObject();
    const targetHeight = state.isCrouching ? state.crouchHeight : state.normalHeight;
    ensureCapsuleMesh(targetHeight);
    if (Math.abs((capsuleHeightCached ?? 0) - targetHeight) > 1e-6) {
      // Rebuild geometry to match current player height (handles crouch/stand)
      const newGeom = createWireCapsuleGeometry(targetHeight, state.radius);
      capsuleMesh.geometry?.dispose?.();
      capsuleMesh.geometry = newGeom;
      capsuleHeightCached = targetHeight;
    }
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
    devPointerEl.style.display = 'block';
    // Place dev camera at player's current position/orientation
    syncDevCameraFromBase();
    const targetHeight = state.isCrouching ? state.crouchHeight : state.normalHeight;
    ensureCapsuleMesh(targetHeight);
    capsuleMesh.visible = true;
    ensureCameraHelper();
    cameraHelper.visible = true;
    // Lock dev controls for smooth look
    if (!devControls.isLocked) devControls.lock();
    // Pause gameplay keyboard bindings (jump, crouch, ...)
    pauseGameplay();
  }

  function exit() {
    if (!isActive) return;
    isActive = false;
    devPanel.style.display = 'none';
    devPointerEl.style.display = 'none';
    if (overlay) overlay.style.display = 'flex';
    if (capsuleMesh) capsuleMesh.visible = false;
    if (cameraHelper) cameraHelper.visible = false;
    if (devControls.isLocked) devControls.unlock();
    // Resume gameplay keyboard bindings
    resumeGameplay();
  }

  function onKeyDownDev(e) {
    // In dev mode, block escape key from triggering menu
    if (isActive && e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
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

  // Use capture: true for escape handler to intercept before gameplay listeners
  window.addEventListener('keydown', onKeyDownDev, true);
  window.addEventListener('keydown', onKeyDownDevMove);
  window.addEventListener('keyup', onKeyUpDevMove);
  btnExitDev?.addEventListener('click', exit);
  // Clicking the dev overlay re-locks dev controls while active
  devPointerEl.addEventListener('click', () => {
    if (isActive && !devControls.isLocked) devControls.lock();
  });

  function handleCanvasClick() {
    // When active: clicking (re)locks the dev controls, otherwise gameplay controls
    if (isActive) {
      // dev overlay is on top and handles locking itself
      if (!devControls.isLocked) devControls.lock();
    } else {
      if (!baseControls.isLocked) baseControls.lock();
    }
  }

  function attachDevButton(overlayEl) {
    if (!overlayEl) return;
    // Add a simple toggle button into the gameplay overlay
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.right = '12px';
    container.style.top = '12px';
    const btn = document.createElement('button');
    btn.textContent = 'Dev Mode';
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
    const speed = 8; // dev fly speed (units/s)
    const forwardAmt = (Number(devMove.fwd) - Number(devMove.back)) * speed * delta;
    const strafeAmt = (Number(devMove.right) - Number(devMove.left)) * speed * delta;
    const obj = devControls.getObject();

    const forwardDir = new THREE.Vector3();
    devCamera.getWorldDirection(forwardDir).normalize();
    if (forwardAmt) obj.position.addScaledVector(forwardDir, forwardAmt);
    if (strafeAmt) {
      // Right vector = forward × up
      const rightDir = new THREE.Vector3().crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
      obj.position.addScaledVector(rightDir, strafeAmt);
    }

    if (capsuleMesh?.visible) updateCapsuleFromPlayer();
    if (cameraHelper?.visible) cameraHelper.update();
  }

  function getCamera() {
    return isActive ? devCamera : baseCamera;
  }

  function dispose() {
    // Clean up listeners and debug meshes
    window.removeEventListener('keydown', onKeyDownDev, true);
    window.removeEventListener('keydown', onKeyDownDevMove);
    window.removeEventListener('keyup', onKeyUpDevMove);
    btnExitDev?.removeEventListener?.('click', exit);
    devPointerEl?.removeEventListener?.('click', () => {});
    devPointerEl.remove();
    devPanel.remove();
    if (capsuleMesh) {
      capsuleMesh.geometry?.dispose?.();
      capsuleMesh.material?.dispose?.();
      scene.remove(capsuleMesh);
      capsuleMesh = null;
    }
    if (cameraHelper) {
      scene.remove(cameraHelper);
      cameraHelper.geometry?.dispose?.();
      // material is shared internal lines; guard just in case
      cameraHelper.material?.dispose?.();
      cameraHelper = null;
    }
  }

  function setOverlay(overlayRef) {
    overlay = overlayRef;
  }

  return {
    isActive: () => isActive,
    getCamera,
    enter,
    exit,
    handleCanvasClick,
    attachDevButton,
    setOverlay,
    update,
    dispose
  };
}

