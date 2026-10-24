// Responsive geometry: where the grid and the piece queue sit inside the
// canvas, plus a DPR-aware canvas surface driven by a ResizeObserver.
import { QUEUE_SIZE } from "./levels.js";

const PAD = 12;
const GAP = 0.4;
const MAX_DPR = 3;

export const isPortrait = (width, height) => height > width;

function queueSlots(left, top, cell, vertical) {
  return Array.from({ length: QUEUE_SIZE }, (_, i) => ({
    x: vertical ? left : left + i * cell,
    y: vertical ? top + (QUEUE_SIZE - 1 - i) * cell : top
  }));
}

// Landscape / desktop: vertical queue on the left, active piece at the
// bottom, like the original. Portrait: horizontal queue above the grid,
// active piece on the left.
export function computeLayout(width, height, cols, rows) {
  const side = width > height * 1.1;
  const across = side ? cols + 1 + GAP : Math.max(cols, QUEUE_SIZE);
  const down = side ? Math.max(rows, QUEUE_SIZE) : rows + 1 + GAP;
  const fit = Math.min((width - 2 * PAD) / across, (height - 2 * PAD) / down);
  const cell = Math.max(8, Math.floor(fit));
  const ox = Math.round((width - across * cell) / 2);
  const oy = Math.round((height - down * cell) / 2);
  const grid = side
    ? {
        x: ox + Math.round((1 + GAP) * cell),
        y: oy + Math.round(((down - rows) * cell) / 2)
      }
    : {
        x: ox + Math.round(((across - cols) * cell) / 2),
        y: oy + Math.round((1 + GAP) * cell)
      };
  const queue = side
    ? queueSlots(
        ox,
        oy + Math.round(((down - QUEUE_SIZE) * cell) / 2),
        cell,
        true
      )
    : queueSlots(
        ox + Math.round(((across - QUEUE_SIZE) * cell) / 2),
        oy,
        cell,
        false
      );
  return { width, height, cell, side, cols, rows, grid, queue };
}

export function cellFromPoint(layout, px, py) {
  if (!layout) return null;
  const x = Math.floor((px - layout.grid.x) / layout.cell);
  const y = Math.floor((py - layout.grid.y) / layout.cell);
  const inside = x >= 0 && y >= 0 && x < layout.cols && y < layout.rows;
  return inside ? { x, y } : null;
}

// Calls onResize({ width, height }) in CSS pixels whenever the host box or
// the device pixel ratio changes. disconnect() releases every observer.
export function createSurface(canvas, host, onResize) {
  const ctx = canvas.getContext("2d");
  const size = { width: 1, height: 1 };
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
