// Responsive geometry: the grid centered in the canvas with integer cell
// sizes, plus a DPR-aware canvas surface driven by a ResizeObserver.
const PAD = 8;
const MAX_DPR = 3;

export const isPortrait = (width, height) => height > width;

export function computeLayout(size, cols, rows) {
  const { width, height, dpr } = size;
  const fit = Math.min((width - 2 * PAD) / cols, (height - 2 * PAD) / rows);
  const cell = Math.max(4, Math.floor(fit));
  const grid = {
    x: Math.round((width - cols * cell) / 2),
    y: Math.round((height - rows * cell) / 2)
  };
  return { width, height, dpr, cell, cols, rows, grid };
}

export function cellFromPoint(layout, px, py) {
  if (!layout) return null;
  const x = Math.floor((px - layout.grid.x) / layout.cell);
  const y = Math.floor((py - layout.grid.y) / layout.cell);
  const inside = x >= 0 && y >= 0 && x < layout.cols && y < layout.rows;
  return inside ? { x, y } : null;
}

// Calls onResize({ width, height, dpr }) in CSS pixels whenever the host
// box or the device pixel ratio changes. disconnect() releases every
// observer.
export function createSurface(canvas, host, onResize) {
  const ctx = canvas.getContext("2d");
  const size = { width: 1, height: 1, dpr: 1 };
  let media = null;

  const watchRatio = (dpr) => {
    media?.removeEventListener("change", apply);
    media = window.matchMedia(`(resolution: ${dpr}dppx)`);
    media.addEventListener("change", apply);
  };

  function apply() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    size.width = Math.max(1, Math.floor(rect.width));
    size.height = Math.max(1, Math.floor(rect.height));
    size.dpr = dpr;
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    watchRatio(dpr);
    onResize(size);
  }

  const observer = new ResizeObserver(apply);
  observer.observe(host);
  apply();
  return {
    ctx,
    size,
    disconnect() {
      observer.disconnect();
      media?.removeEventListener("change", apply);
      media = null;
    }
  };
}
