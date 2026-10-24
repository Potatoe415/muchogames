// One frame: pure white snow, then every visible bitmap sorted by its feet
// line (farther up the slope = drawn first). An airborne skier is drawn
// lifted by his altitude and above what he flies over; lift chairs hang
// over everything.
import { LIFT } from "./config.js";
import { spriteOf } from "./entities.js";
import { liftChairs } from "./lift.js";
import { skierSprite } from "./skier.js";
import { drawSprite } from "./sprites.js";
import { eachEntity } from "./world.js";

const MARGIN_X = 64;
const MARGIN_BOTTOM = 72;
const AIR_LAYER = 40;

function visibleItems(game) {
  const v = game.view;
  const items = [];
  const inView = (x, y) =>
    x > v.x - MARGIN_X &&
    x < v.x + v.w + MARGIN_X &&
    y > v.y &&
    y < v.y + v.h + MARGIN_BOTTOM;
  eachEntity(game.world, (e) => {
    if (inView(e.x, e.y))
      items.push({ sprite: spriteOf(e), x: e.x, y: e.y, key: e.y });
  });
  const s = game.skier;
  if (s.mode !== "eaten") {
    const key = s.z > 0 ? s.y + AIR_LAYER : s.y;
    items.push({ sprite: skierSprite(s), x: s.x, y: s.y - s.z, key });
  }
  const mob = game.yeti.mob;
  if (mob)
    items.push({ sprite: mob.sprite, x: mob.x, y: mob.y, key: mob.y + 1 });
  return items.sort((a, b) => a.key - b.key);
}

export function render(ctx, sheet, game, size) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!sheet) return;
  ctx.setTransform(size.zoom, 0, 0, size.zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const v = game.view;
  const draw = (item) =>
    drawSprite(ctx, sheet, item.sprite, item.x - v.x, item.y - v.y);
  visibleItems(game).forEach(draw);
  liftChairs(v, game.time)
    .map((chair) => ({ ...chair, y: chair.y - LIFT.hang }))
    .forEach(draw);
}
