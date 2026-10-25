// Draws the 9x9 window onto the board, centred on Chip and clamped to the
// board edges, square by square like the original (no smooth scroll). Each
// cell shows its terrain, item or thin wall as the original opaque tile,
// then the creature or block standing on it.
import { DIR_INDEX } from "./engine.js";
import { drawCreature, drawTile } from "./sheet.js";
import { CODES, SPRITE, T, THIN_WALLS, TILE } from "./tiles.js";
import { LAYERS } from "./vendor/lexy/js/defs.js";

export const VIEW = 9;
export const VIEW_PX = VIEW * TILE;
const EXIT_FRAMES = [T.EXIT, T.EXIT_2, T.EXIT_3];
const EXIT_FPS = 4;
const DEATH_TILE = { water: T.DROWNED, fire: T.BURNED, bomb: T.BOMBED };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dirOf = (tile) => DIR_INDEX[tile.direction] ?? 2;

export function camera(level, chip) {
  const half = (VIEW - 1) / 2;
  return {
    x: clamp(chip.x - half, 0, Math.max(0, level.size_x - VIEW)),
    y: clamp(chip.y - half, 0, Math.max(0, level.size_y - VIEW))
  };
}

function groundCode(cell, frame) {
  const thin = cell[LAYERS.thin_wall];
  const item = cell.get_item();
  if (thin && THIN_WALLS[thin.edges] !== undefined)
    return THIN_WALLS[thin.edges];
  if (item && CODES[item.type.name] !== undefined) return CODES[item.type.name];
  const name = cell.get_terrain()?.type.name;
  if (name === "exit") return EXIT_FRAMES[frame.exit];
  return CODES[name] ?? T.FLOOR;
}

function drawActor(ctx, sheet, actor, cell, px, py) {
  const name = actor.type.name;
  if (name === "dirt_block") {
    const onCloner = cell.get_terrain()?.type.name === "cloner";
    const code = onCloner ? T.CLONE_BLOCK + dirOf(actor) : T.BLOCK;
    drawTile(ctx, sheet, code, px, py);
  } else if (SPRITE[name] !== undefined && name !== "player") {
    drawCreature(ctx, sheet, SPRITE[name] + dirOf(actor), px, py);
  }
}

function drawChip(ctx, sheet, view, cell, px, py) {
  const { chip } = view;
  if (DEATH_TILE[view.dead])
    drawTile(ctx, sheet, DEATH_TILE[view.dead], px, py);
  else if (view.won) drawTile(ctx, sheet, T.CHIP_EXIT, px, py);
  else if (cell.get_terrain()?.type.name === "water" && !view.dead) {
    drawTile(ctx, sheet, T.SWIM + chip.dir, px, py);
  } else drawCreature(ctx, sheet, SPRITE.player + chip.dir, px, py);
}

function drawCell(ctx, sheet, view, x, y, frame) {
  const { level, chip } = view;
  const cell = level.linear_cells[y * level.size_x + x];
  const px = (x - frame.camX) * TILE;
  const py = (y - frame.camY) * TILE;
  drawTile(ctx, sheet, groundCode(cell, frame), px, py);
  const actor = cell.get_actor();
  if (chip.x === x && chip.y === y) drawChip(ctx, sheet, view, cell, px, py);
  if (actor) drawActor(ctx, sheet, actor, cell, px, py);
}

// view = { level, chip: { x, y, dir }, dead, won }
export function render(ctx, sheet, view, zoom, seconds) {
  ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (!sheet || !view) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, VIEW_PX, VIEW_PX);
    return;
  }
  const cam = camera(view.level, view.chip);
  const frame = {
    camX: cam.x,
    camY: cam.y,
    exit: Math.floor(seconds * EXIT_FPS) % EXIT_FRAMES.length
  };
  for (let y = cam.y; y < cam.y + VIEW; y++) {
    for (let x = cam.x; x < cam.x + VIEW; x++) {
      drawCell(ctx, sheet, view, x, y, frame);
    }
  }
}
