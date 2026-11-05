// Draws one frame of the board in 720×880 logical units: water, road,
// verges, the four home slots, then every entity and the frog.
const WIN_SLOT_COLS = [1, 3, 5, 7];
const CELL = 80;

function drawBackground(ctx, game) {
  const { images } = game;
  ctx.fillStyle = "cornflowerblue";
  ctx.fillRect(0, 0, 720, 880);
  if (images.waterBg) {
    const slosh = game.settings.objectsMovementEnabled
      ? Math.sin(Date.now() / 800) * 10
      : 0;
    ctx.drawImage(images.waterBg, -10 + slosh, 80, 740, 320);
  }
  if (images.roadBg) ctx.drawImage(images.roadBg, 0, 480, 720, 320);
  ctx.fillStyle = "#1E90FF";
  WIN_SLOT_COLS.forEach((col) => ctx.fillRect(col * CELL, 0, CELL, CELL));
  if (images.border_middle) {
    ctx.drawImage(images.border_middle, 0, 400, 720, CELL);
    ctx.drawImage(images.border_middle, 0, 800, 720, CELL);
  }
  if (images.border_top) ctx.drawImage(images.border_top, 0, 0, 720, CELL);
}

function drawWaterRipples(ctx, ripples) {
  ripples.forEach((ripple) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ripple.alpha);
    ctx.strokeStyle = "#88ccff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawEntities(ctx, game) {
  const { images } = game;
  game.deadFrogs.forEach((frog) => {
    const img = images[frog.imgKey];
    if (img) ctx.drawImage(img, frog.x, frog.y, CELL, CELL);
  });
  drawWaterRipples(ctx, game.waterRipples);
  game.fly.draw(ctx);
  game.riverObjects.forEach((item) => item.draw(ctx));
  game.obstacles.forEach((item) => item.draw(ctx));
  WIN_SLOT_COLS.forEach((col, i) => {
    if (game.wins[i] && images.frogWin) {
      ctx.drawImage(images.frogWin, col * CELL, 0, CELL, CELL);
    }
  });
  const blinkOff = game.isRespawning && Math.floor(Date.now() / 100) % 2 === 1;
  if (!blinkOff) game.player.draw(ctx);
  game.chaosFly.draw(ctx);
}

export function drawBoard(ctx, game) {
  drawBackground(ctx, game);
  drawEntities(ctx, game);
}
