import * as THREE from 'three';
import { createFPSControls } from '../player/view/controls.js';
import { createCamera } from '../player/view/camera.js';
import { createFlyControls } from './controls/fly.js';
import { createDevPanel } from './ui/panel.js';
import { createDevPointerOverlay } from './ui/overlay.js';

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

  const devCamera = createCamera();
  devCamera.position.set(0, 5, 8);
  devCamera.lookAt(0, 1.6, 0);

  const devPointerEl = createDevPointerOverlay();
  const devControls = createFPSControls(devCamera, devPointerEl);

  function syncDevCameraFromBase() {
    const baseObj = baseControls.getObject();
    const devObj = devControls.getObject();
    devObj.position.copy(baseObj.position);

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(baseCamera.quaternion);
    devObj.rotation.y = euler.y;
    const pitchObj = devObj.children?.[0];
    if (pitchObj) {
      pitchObj.rotation.x = euler.x;
    }
    devCamera.quaternion.copy(baseCamera.quaternion);
  }

  let cameraHelper = null;
  function ensureCameraHelper() {
    if (cameraHelper) return cameraHelper;
    cameraHelper = new THREE.CameraHelper(baseCamera);
    cameraHelper.visible = false;
    scene.add(cameraHelper);
    return cameraHelper;
  }

  const { panel: devPanel, exitButton: btnExitDev } = createDevPanel();

  const devMove = { fwd: false, back: false, left: false, right: false };

  let capsuleMesh = null;
  let capsuleHeightCached = null;

  function createWireCapsuleGeometry(height, radius) {
    const r = radius;
    const h = Math.max(0, height - 2 * r);
    const radialSegments = 16;
    const capSegments = 12;
    return new THREE.CapsuleGeometry(r, Math.max(0.001, h), capSegments, radialSegments);
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
    if (baseControls.isLocked) baseControls.unlock();
    if (overlay) overlay.style.display = 'none';
    devPanel.style.display = 'block';
    devPointerEl.style.display = 'block';
    syncDevCameraFromBase();
    const targetHeight = state.isCrouching ? state.crouchHeight : state.normalHeight;
    ensureCapsuleMesh(targetHeight);
    capsuleMesh.visible = true;
    ensureCameraHelper().visible = true;
    if (!devControls.isLocked) devControls.lock();
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
    resumeGameplay();
  }

  function onKeyDownDev(e) {
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

  window.addEventListener('keydown', onKeyDownDev, true);
  window.addEventListener('keydown', onKeyDownDevMove);
  window.addEventListener('keyup', onKeyUpDevMove);
  btnExitDev?.addEventListener('click', exit);
  devPointerEl.addEventListener('click', () => {
    if (isActive && !devControls.isLocked) devControls.lock();
  });

  function handleCanvasClick() {
    if (isActive) {
      if (!devControls.isLocked) devControls.lock();
    } else if (!baseControls.isLocked) {
      baseControls.lock();
    }
  }

  function attachDevButton(overlayEl) {
    if (!overlayEl) return;
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
    if (cameraHelper?.visible) cameraHelper.update();
  }

  function getCamera() {
    return isActive ? devCamera : baseCamera;
  }

  function dispose() {
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

