// The fly (bonus: points + one life, once per level) and the chaos fly
// (bounces around; touching it flips the screen for 4 seconds).
export class Fly {
  constructor(game) {
    this.game = game;
    this.width = game.cellSize / 2;
    this.height = game.cellSize / 2;
    this.x = 0;
    this.y = 0;
    this.timer = 0;
    this.resetCooldown();
  }

  resetCooldown() {
    this.cooldownTimer = this.game.balance.flySpawnCooldown ?? 0;
    this.active = false;
  }

  spawn() {
    const cell = this.game.cellSize;
    this.active = true;
    this.timer = this.game.balance.flyActiveDuration;
    this.x = Math.floor(Math.random() * 9) * cell + cell / 4;
    this.y = Math.floor(Math.random() * 10) * cell + cell / 4;
  }

  update(dt) {
    const { balance, level, flyCaughtInLevel } = this.game;
    if (level < balance.flyMinLevel || flyCaughtInLevel) {
      this.active = false;
      return;
    }
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) this.resetCooldown();
      return;
    }
    if (balance.flySpawnCooldown != null) {
      this.cooldownTimer -= dt;
      if (this.cooldownTimer <= 0) this.spawn();
    } else if (Math.random() < balance.flySpawnChance) {
      this.spawn();
    }
  }

  draw(ctx) {
    const img = this.game.images.fly;
    if (!this.active || !img) return;
    const float = this.game.settings.objectsMovementEnabled
      ? Math.sin(Date.now() / 150) * 5
      : 0;
    ctx.drawImage(img, this.x, this.y + float, this.width, this.height);
  }
}

export class ChaosFly {
  constructor(game) {
    this.game = game;
    this.width = game.cellSize / 2;
    this.height = game.cellSize / 2;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
  }

  activate() {
    const { gameWidth, gameHeight } = this.game;
    this.active = true;
    this.x = Math.random() * (gameWidth - this.width);
    this.y = Math.random() * (gameHeight - this.height);
    this.vx = (Math.random() < 0.5 ? 1 : -1) * 200;
    this.vy = (Math.random() < 0.5 ? 1 : -1) * 150;
  }

  deactivate() {
    this.active = false;
  }

  update(dt) {
    if (!this.active) return;
    const { gameWidth, gameHeight } = this.game;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 0) [this.x, this.vx] = [0, Math.abs(this.vx)];
    else if (this.x + this.width > gameWidth) {
      [this.x, this.vx] = [gameWidth - this.width, -Math.abs(this.vx)];
    }
    if (this.y < 0) [this.y, this.vy] = [0, Math.abs(this.vy)];
    else if (this.y + this.height > gameHeight) {
      [this.y, this.vy] = [gameHeight - this.height, -Math.abs(this.vy)];
    }
  }

  draw(ctx) {
    const img = this.game.images.fly;
    if (!this.active || !img) return;
    ctx.filter = "invert(100%) hue-rotate(180deg)";
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
    ctx.filter = "none";
  }
}
