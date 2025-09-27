import * as THREE from 'three';

export function createLoop({ renderer, scene, camera, update }) {
  const clock = new THREE.Clock();
  let rafId = null;

  function onFrame() {
    const delta = Math.min(clock.getDelta(), 0.05);
    update(delta);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(onFrame);
  }

  return {
    start() {
      if (rafId === null) {
        clock.getDelta();
        rafId = requestAnimationFrame(onFrame);
      }
    },
    stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
}