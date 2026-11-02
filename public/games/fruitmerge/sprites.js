// Fruits pre-rendered once per level and pixel size, so a frame only blits
// images. Also paints the small icons of the HUD (next fruits, evolution).
import { TOP_REACH, drawFruit } from "./fruit-art.js";
import { FRUITS } from "./fruits.js";

// Half the sprite side, in radii: room for the leaves above the fruit.
export const HALF = TOP_REACH + 0.05;

function render(level, radiusPx) {
  const side = Math.ceil(radiusPx * HALF * 2);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  ctx.translate(side / 2, side / 2);
  drawFruit(ctx, FRUITS[level], radiusPx);
  return canvas;
}

export function createSprites() {
  const cache = new Map();
  return {
    get(level, radiusPx) {
      const px = Math.max(2, Math.round(radiusPx));
      const key = `${level}:${px}`;
      if (!cache.has(key)) cache.set(key, render(level, px));
      return cache.get(key);
    },
    clear() {
      cache.clear();
    }
  };
}

// Draws the fruit on a small canvas sized by CSS, crisp at any pixel ratio.
export function paintIcon(canvas, level) {
  const dpr = window.devicePixelRatio || 1;
  const side = Math.max(1, Math.round(canvas.clientWidth * dpr));
  if (canvas.width !== side) canvas.width = side;
  if (canvas.height !== side) canvas.height = side;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, side, side);
  ctx.translate(side / 2, side / 2 + side * 0.06);
  drawFruit(ctx, FRUITS[level], side * 0.36);
}
