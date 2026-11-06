// Responsive geometry: the grid centered in the canvas and as large as it
// fits (fractional cell size, so a portrait phone gets a grid 99% of the
// screen wide; the field cache rounds cell edges to device pixels), plus a
// DPR-aware canvas surface driven by a ResizeObserver.
const MAX_DPR = 3;

export const isPortrait = (width, height) => height > width;

// CSS px rounded to the nearest device pixel.
export const snap = (layout, value) =>
  Math.round(value * layout.dpr) / layout.dpr;

export function computeLayout(size, cols, rows) {
  const { width, height, dpr } = size;
  const cell = Math.max(4, Math.min(width / cols, height / rows));
  const layout = { width, height, dpr, cell, cols, rows };
  layout.grid = {
    x: snap(layout, (width - cols * cell) / 2),
    y: snap(layout, (height - rows * cell) / 2)
  };
  return layout;
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
