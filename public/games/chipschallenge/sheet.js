// assets/tiles.png is the original CHIPS.EXE tile bitmap (416x512, 13x16
// cells of 32 px): columns 0-6 hold the opaque tiles 0x00-0x6F, columns 7-9
// the creatures again on white and columns 10-12 their masks (white =
// opaque). The masked creatures are baked once into a transparent canvas.
import { TILE } from "./tiles.js";

const SHEET_URL = new URL("./assets/tiles.png", import.meta.url).href;
const CREATURE_COL = 7;
const MASK_COL = 10;
const COLS = 3;
const ROWS = 16;

let pending = null;

function maskCreatures(image) {
  const w = COLS * TILE;
  const h = ROWS * TILE;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, MASK_COL * TILE, 0, w, h, 0, 0, w, h);
  const mask = ctx.getImageData(0, 0, w, h).data;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, CREATURE_COL * TILE, 0, w, h, 0, 0, w, h);
  const sprite = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < mask.length; i += 4) {
    sprite.data[i + 3] = mask[i] > 127 ? 255 : 0;
  }
  ctx.putImageData(sprite, 0, 0);
  return canvas;
}

export function loadSheet() {
  pending ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ tiles: image, creatures: maskCreatures(image) });
    image.onerror = () => {
      pending = null;
      reject(new Error("Chip's Challenge tiles failed to load"));
    };
    image.src = SHEET_URL;
  });
  return pending;
}

// Opaque tile (terrain, items, blocks, Chip's swimming/death frames).
export function drawTile(ctx, sheet, code, x, y) {
  const sx = (code >> 4) * TILE;
  const sy = (code & 15) * TILE;
  ctx.drawImage(sheet.tiles, sx, sy, TILE, TILE, x, y, TILE, TILE);
}

// Creature or Chip (codes 0x40-0x6F) drawn over whatever lies beneath.
export function drawCreature(ctx, sheet, code, x, y) {
  const sx = ((code >> 4) - 4) * TILE;
  const sy = (code & 15) * TILE;
  ctx.drawImage(sheet.creatures, sx, sy, TILE, TILE, x, y, TILE, TILE);
}
