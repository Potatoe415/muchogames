// Moving things on the road and the river. Positions are in the 720×880
// logical board; each entity draws game.images[imgKey].
const shakeOn = (game) => game.settings.objectsMovementEnabled;

function drawSprite(ctx, img, box, flip) {
  if (!flip) {
    ctx.drawImage(img, box.x, box.y, box.width, box.height);
    return;
  }
  ctx.save();
  ctx.translate(box.x + box.width / 2, box.y + box.height / 2);
  ctx.scale(-1, 1);
  ctx.drawImage(img, -box.width / 2, -box.height / 2, box.width, box.height);
  ctx.restore();
}

class Mover {
  constructor(game, imgKey, row, speed, x) {
    this.game = game;
    this.imgKey = imgKey;
    this.row = row;
    this.x = x;
    this.y = row * game.cellSize;
    this.speed = speed;
    this.height = game.cellSize;
    const img = game.images[imgKey];
    this.width = img ? (img.width / img.height) * this.height : game.cellSize;
  }

  get img() {
    return this.game.images[this.imgKey];
  }

  advance(dt) {
    this.x += this.speed * dt * this.game.speedFactor;
  }

  // Leaving one side brings it back on the other.
  wrap() {
    const { gameWidth } = this.game;
    if (this.speed > 0 && this.x > gameWidth) this.x = -this.width;
    else if (this.speed < 0 && this.x < -this.width) this.x = gameWidth;
  }

  update(dt) {
    this.advance(dt);
    this.wrap();
  }
}

export class Obstacle extends Mover {
  draw(ctx) {
    if (!this.img) return;
    const shakeY = shakeOn(this.game)
      ? Math.sin(Date.now() / 180 + this.x * 0.05) * 1.5
      : 0;
    drawSprite(ctx, this.img, { ...this, y: this.y + shakeY }, this.speed < 0);
  }
}

// Turns around every time it leaves the screen, so it never comes back
// from the same side twice in a row.
export class Train extends Obstacle {
  update(dt) {
    this.advance(dt);
    const { gameWidth } = this.game;
    const out =
      (this.speed > 0 && this.x > gameWidth) ||
      (this.speed < 0 && this.x < -this.width);
    if (!out) return;
    this.speed = -this.speed;
    this.x = this.speed > 0 ? -this.width : gameWidth;
  }
}

export class RiverObject extends Mover {
  constructor(game, imgKey, row, speed, x, type = "safe") {
    super(game, imgKey, row, speed, x);
    this.type = type;
  }

  // The crocodile's head (one cell, front side) is not safe to stand on.
  getSafeBox() {
    const cell = this.game.cellSize;
    let left = this.x;
    let width = this.width;
    if (this.type === "croco") {
      width -= cell;
      if (this.speed < 0) left += cell;
    }
    const { y, height, speed } = this;
    return { left, right: left + width, top: y, bottom: y + height, speed };
  }

  drawWake(ctx) {
    if (!shakeOn(this.game)) return;
    const wakeX = this.speed > 0 ? this.x - 15 : this.x + this.width + 15;
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.1 * Math.abs(Math.sin(Date.now() / 400));
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(wakeX, this.y + this.height / 2, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  draw(ctx) {
    if (!this.img) return;
    this.drawWake(ctx);
    const flip = this.type === "croco" ? this.speed > 0 : this.speed < 0;
    drawSprite(ctx, this.img, this, flip);
  }
}

// Surface → warning (blinks, still safe) → submerged (not safe) → surface.
export class DivingTurtle extends RiverObject {
  constructor(game, imgKey, row, speed, x, timing) {
    super(game, imgKey, row, speed, x, "diving_turtle");
    this.surfaceTime = timing.surfaceTime;
    this.diveTime = timing.diveTime;
    this.warningTime = timing.warningTime ?? 0;
    this.timer = 0;
    this.isSubmerged = false;
    this.isWarning = false;
  }

  update(dt) {
    super.update(dt);
    this.timer += dt * 1000;
    if (this.isSubmerged) {
      if (this.timer <= this.diveTime) return;
      this.isSubmerged = false;
    } else if (this.isWarning) {
      if (this.timer <= this.warningTime) return;
      this.isWarning = false;
      this.isSubmerged = true;
    } else {
      if (this.timer <= this.surfaceTime) return;
      this.isWarning = this.warningTime > 0;
      this.isSubmerged = !this.isWarning;
    }
    this.timer = 0;
  }

  getSafeBox() {
    return this.isSubmerged ? null : super.getSafeBox();
  }

  draw(ctx) {
    if (!this.img) return;
    this.drawWake(ctx);
    ctx.save();
    if (this.isSubmerged) ctx.globalAlpha = 0.3;
    else if (this.isWarning) {
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(Date.now() / 110));
    }
    drawSprite(ctx, this.img, this, this.speed < 0);
    ctx.restore();
  }
}
