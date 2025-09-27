export function createDevPanel() {
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.right = '10px';
  panel.style.top = '10px';
  panel.style.padding = '10px 12px';
  panel.style.borderRadius = '8px';
  panel.style.background = 'rgba(0,0,0,0.45)';
  panel.style.color = '#e6edf3';
  panel.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, Liberation Mono, monospace';
  panel.style.fontSize = '12px';
  panel.style.display = 'none';
  panel.style.zIndex = '40';
  panel.innerHTML = `
    <div style="display:flex; gap:8px; align-items:center;">
      <strong>DEV</strong>
      <button id="btn-exit-dev" style="padding:6px 10px; border:none; border-radius:6px; background:#d73a49; color:#fff; cursor:pointer; font-weight:600;">Exit</button>
    </div>
  `;
  document.body.appendChild(panel);
  const exitButton = panel.querySelector('#btn-exit-dev');
  return { panel, exitButton };
}
