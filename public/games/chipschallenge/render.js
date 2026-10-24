// Draws the 9x9 window onto the 32x32 board, centred on Chip and clamped to
// the board edges, square by square like the original (no smooth scroll).
import { chipAt, mobAt } from "./board.js";
import { drawCreature, drawTile } from "./sheet.js";
import { SIZE, SPRITE, T, TILE } from "./tiles.js";

export const VIEW = 9;
export const VIEW_PX = VIEW * TILE;
const EXIT_FRAMES = [T.EXIT, T.EXIT_2, T.EXIT_3];
const EXIT_FPS = 4;
const DEATH_TILE = { water: T.DROWNED, fire: T.BURNED, bomb: T.BOMBED };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function camera(w) {
  const half = (VIEW - 1) / 2;
  return {
    x: clamp(w.chip.x - half, 0, SIZE - VIEW),
    y: clamp(w.chip.y - half, 0, SIZE - VIEW)
  };
}

function drawMob(ctx, sheet, mob, px, py) {
  if (mob.kind === "block") {
    const code = mob.template ? T.CLONE_BLOCK + mob.dir : T.BLOCK;
    drawTile(ctx, sheet, code, px, py);
  } else {
    drawCreature(ctx, sheet, SPRITE[mob.kind] + mob.dir, px, py);
  }
}

function drawChip(ctx, sheet, w, terrain, px, py) {
  const chip = w.chip;
  if (DEATH_TILE[w.dead]) drawTile(ctx, sheet, DEATH_TILE[w.dead], px, py);
  else if (w.won) drawTile(ctx, sheet, T.CHIP_EXIT, px, py);
  else if (terrain === T.WATER) drawTile(ctx, sheet, T.SWIM + chip.dir, px, py);
  else drawCreature(ctx, sheet, SPRITE.chip + chip.dir, px, py);
}

function drawCell(ctx, sheet, w, x, y, frame) {
  const px = (x - frame.camX) * TILE;
  const py = (y - frame.camY) * TILE;
  const terrain = w.terrain[y * SIZE + x];
  const shown = terrain === T.EXIT ? EXIT_FRAMES[frame.exit] : terrain;
  drawTile(ctx, sheet, shown, px, py);
  const mob = mobAt(w, x, y);
  const chipHere = chipAt(w, x, y);
  const caught = w.dead === "monster" || w.dead === "block";
  if (mob && !(chipHere && caught)) drawMob(ctx, sheet, mob, px, py);
  if (chipHere) drawChip(ctx, sheet, w, terrain, px, py);
  if (mob && chipHere && caught) drawMob(ctx, sheet, mob, px, py);
}

export function render(ctx, sheet, w, zoom, seconds) {
  ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (!sheet || !w) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, VIEW_PX, VIEW_PX);
    return;
  }
  const cam = camera(w);
  const frame = {
    camX: cam.x,
    camY: cam.y,
    exit: Math.floor(seconds * EXIT_FPS) % EXIT_FRAMES.length
  };
  for (let y = cam.y; y < cam.y + VIEW; y++) {
    for (let x = cam.x; x < cam.x + VIEW; x++)
      drawCell(ctx, sheet, w, x, y, frame);
  }
}
