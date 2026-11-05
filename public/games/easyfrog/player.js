// The frog: one cell per jump on a 9×11 grid, with a short crouch, a
// stretched jump and a squash on landing. A move pressed mid-jump is
// buffered and played on landing.
const ANGLES = { UP: 0, DOWN: Math.PI, LEFT: -Math.PI / 2, RIGHT: Math.PI / 2 };
const COLS = 8;
const ROWS = 10;

export class Player {
  constructor(game) {
    this.game = game;
    this.width = game.cellSize;
    this.height = game.cellSize;
    this.scaleX = 1;
    this.scaleY = 1;
    this.jumpDir = "UP";
    this.timer = 0;
    this.resetPosition();
  }

  resetPosition() {
    const cell = this.game.cellSize;
    this.placeAt(4 * cell, ROWS * cell);
  }

  placeAt(x, y) {
    this.x = this.targetX = this.startX = x;
    this.y = this.targetY = this.startY = y;
    this.state = "IDLE";
    this.bufferedInput = null;
  }

  aim(direction) {
    const cell = this.game.cellSize;
    if (direction === "UP" && this.targetY > 0) this.targetY -= cell;
    else if (direction === "DOWN" && this.targetY < ROWS * cell) {
      this.targetY += cell;
    } else if (direction === "LEFT" && this.targetX > 0) this.targetX -= cell;
    else if (direction === "RIGHT" && this.targetX < COLS * cell) {
      this.targetX += cell;
    }
  }

  move(direction) {
    if (this.state !== "IDLE") {
      this.bufferedInput = direction;
      return;
    }
    this.startX = this.x;
    this.startY = this.y;
    this.jumpDir = direction;
    this.aim(direction);
    if (this.startX === this.targetX && this.startY === this.targetY) return;
    if (this.game.settings.animationEnabled) {
      this.state = "ANTICIPATE";
      this.timer = 0;
      return;
    }
    this.x = this.targetX;
    this.y = this.targetY;
    this.game.audio.play("jump", 0.5);
  }

  idle(dt) {
    if (this.game.settings.objectsMovementEnabled) {
      const breathe = Math.sin(Date.now() / 300) * 0.03;
      this.scaleX = 1 + breathe;
      this.scaleY = 1 - breathe;
    } else {
      this.scaleX += (1 - this.scaleX) * 20 * dt;
      this.scaleY += (1 - this.scaleY) * 20 * dt;
    }
    this.x = this.targetX;
  }

  land() {
    this.x = this.targetX;
    this.y = this.targetY;
    this.state = "IDLE";
    this.scaleX = 1.3;
    this.scaleY = 0.7;
    const next = this.bufferedInput;
    this.bufferedInput = null;
    if (next) this.move(next);
  }

  jump(progress) {
    this.x = this.startX + (this.targetX - this.startX) * progress;
    this.y = this.startY + (this.targetY - this.startY) * progress;
    const stretch = Math.sin(progress * Math.PI) * 0.4;
    const vertical = this.jumpDir === "UP" || this.jumpDir === "DOWN";
    this.scaleX = vertical ? 1 - stretch : 1 + stretch;
    this.scaleY = vertical ? 1 + stretch : 1 - stretch;
  }

  update(dt) {
    if (this.state === "IDLE") return this.idle(dt);
    const { anticipateDuration, jumpDuration } = this.game.balance;
    this.timer += dt;
    if (this.state === "ANTICIPATE") {
      this.scaleX = 1.2;
      this.scaleY = 0.8;
      if (this.timer < anticipateDuration) return;
      this.state = "JUMP";
      this.timer = 0;
      this.game.audio.play("jump", 0.5);
      return;
    }
    const progress = this.timer / jumpDuration;
    if (progress >= 1) this.land();
    else this.jump(progress);
  }

  draw(ctx) {
    const img = this.game.images.frog;
    if (!img) return;
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(ANGLES[this.jumpDir]);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}
