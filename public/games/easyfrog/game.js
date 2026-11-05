// One match: world state, level setup, the per-frame update and the rAF
// loop. main.js creates it for a new or resumed match and destroys it when
// the match is left or replaced.
import { balanceFor } from "./difficulty.js";
import { DivingTurtle, Obstacle, RiverObject, Train } from "./entities.js";
import { ChaosFly, Fly } from "./flies.js";
import { getRoadObstacles } from "./levels.js";
import { Player } from "./player.js";
import { drawBoard } from "./renderer.js";
import { checkCollisions, die, keepCarGaps } from "./rules.js";
import { restoreWorld, snapshotWorld } from "./snapshot.js";
import { createView } from "./view.js";

const MAX_FRAME = 0.1;
const SAVE_EVERY = 1;

class Game {
  constructor(parts) {
    const { canvas, board, images, audio, settings, difficulty } = parts;
    Object.assign(this, { images, audio, settings, difficulty });
    Object.assign(this, { onHud: parts.onHud, onSave: parts.onSave });
    this.onEnd = parts.onEnd;
    this.gameWidth = 720;
    this.gameHeight = 880;
    this.cellSize = 80;
    this.balance = balanceFor(difficulty);
    this.view = createView(canvas, board);
    this.resetMatch();
    this.player = new Player(this);
    this.fly = new Fly(this);
    this.chaosFly = new ChaosFly(this);
    if (parts.saved) restoreWorld(this, parts.saved);
    else this.initLevel();
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  resetMatch() {
    Object.assign(this, {
      score: 0,
      lives: this.balance.startingLives,
      level: 1,
      wins: [false, false, false, false],
      deadFrogs: [],
      godMode: false,
      paused: false,
      over: false,
      sinceSave: 0
    });
  }

  levelConfig() {
    const { levels } = this.balance;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  // Fresh per-level state; the entities come from `road` (cars, train) and
  // `river` specs: { sprite, row, speed, x, type, … }.
  buildLevel(road, river) {
    const config = this.levelConfig();
    this.speedFactor = config.speedMultiplier;
    this.obstacles = road.map((o) => {
      const Kind = o.sprite === "train" ? Train : Obstacle;
      return new Kind(this, o.sprite, o.row, o.speed, o.x);
    });
    this.riverObjects = river.map((r) =>
      r.type === "diving"
        ? new DivingTurtle(this, r.sprite, r.row, r.speed, r.x, r)
        : new RiverObject(this, r.sprite, r.row, r.speed, r.x, r.type)
    );
    Object.assign(this, {
      isRespawning: false,
      respawnTimer: 0,
      currentZone: "safe",
      waterRipples: [],
      heartbeatActive: false
    });
    this.audio.stopAllLoops();
  }

  initLevel() {
    const config = this.levelConfig();
    const river = config.river.map((r) => ({ ...r, x: r.startX }));
    this.buildLevel(getRoadObstacles(this.level, this.balance), river);
    this.timeLeft = config.timeLimit;
    this.flyCaughtInLevel = false;
    this.isFlipped = false;
    this.flipTimer = 0;
    this.fly.resetCooldown();
    if (this.level >= this.balance.chaosflyMinLevel) this.chaosFly.activate();
    else this.chaosFly.deactivate();
    this.player.resetPosition();
  }

  move(direction) {
    if (this.paused || this.over || this.isRespawning) return;
    this.player.move(direction);
  }

  // Loops stop on pause; the zone sound and the heartbeat restart after.
  pause() {
    if (this.over) return;
    this.paused = true;
    this.audio.stopAllLoops();
    this.currentZone = "safe";
    this.heartbeatActive = false;
  }

  resume() {
    this.paused = false;
    this.last = performance.now();
  }

  // F8 / F9 (owner testing): invincibility, jump to the next level.
  cheat(action) {
    if (this.over) return;
    if (action === "god") this.godMode = !this.godMode;
    if (action === "skip" && !this.paused) {
      this.level = Math.min(this.level + 1, this.balance.levels.length);
      this.wins = [false, false, false, false];
      this.deadFrogs = [];
      this.initLevel();
    }
    this.saveSoon();
  }

  endMatch(won) {
    this.over = true;
    this.won = won;
    this.audio.stopAllLoops();
    this.audio.play(won ? "win-end" : "end-death", 1);
  }

  saveSoon() {
    this.sinceSave = SAVE_EVERY;
  }

  // Returns true when the time ran out (a life lost this frame).
  tickTimer(dt) {
    if (this.timeLeft === null) return false;
    this.timeLeft -= dt;
    if (this.timeLeft <= 5 && !this.heartbeatActive) {
      this.heartbeatActive = true;
      this.audio.playLoop("heartbeat", 0.5, 1, Math.max(0, this.timeLeft));
    }
    if (this.timeLeft > 0) return false;
    die(this, "time");
    return true;
  }

  zoneSound() {
    const y = this.player.targetY;
    let zone = "safe";
    if (y >= 480 && y <= 720) zone = "road";
    else if (y >= 80 && y <= 240) zone = "water";
    else if (y === 400) zone = "train-row";
    if (zone === this.currentZone) return;
    this.currentZone = zone;
    this.audio.stopAllLoops();
    this.heartbeatActive = false;
    if (zone === "road") this.audio.playLoop("road", 0.6);
    if (zone === "water") this.audio.playLoop("water", 0.6);
    const train = this.obstacles.some((o) => o.imgKey === "train");
    if (zone === "train-row" && train) this.audio.playLoop("train", 0.8);
  }

  animate(dt) {
    if (this.isFlipped) {
      this.flipTimer -= dt;
      if (this.flipTimer <= 0) this.isFlipped = false;
    }
    this.waterRipples = this.waterRipples.filter((ripple) => {
      ripple.radius += 90 * dt;
      ripple.alpha -= 0.85 * dt;
      return ripple.alpha > 0;
    });
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.isRespawning = false;
    }
  }

  update(dt) {
    if (this.tickTimer(dt)) return;
    this.player.update(dt);
    this.zoneSound();
    this.fly.update(dt);
    this.chaosFly.update(dt);
    this.obstacles.forEach((o) => o.update(dt));
    keepCarGaps(this);
    this.riverObjects.forEach((r) => r.update(dt));
    this.animate(dt);
    checkCollisions(this, dt);
  }

  draw() {
    const ctx = this.view.begin();
    if (this.isFlipped) {
      ctx.translate(this.gameWidth, this.gameHeight);
      ctx.rotate(Math.PI);
    }
    drawBoard(ctx, this);
  }

  tick = (now) => {
    this.frame = requestAnimationFrame(this.tick);
    const raw = (now - this.last) / 1000;
    this.last = now;
    const dt = Math.min(MAX_FRAME, raw);
    if (!this.paused && !this.over) {
      this.view.monitor(raw);
      this.update(dt);
      this.sinceSave += dt;
    }
    this.draw();
    this.report();
  };

  // HUD every frame; the save at least once a second and after events.
  report() {
    const { score, lives, timeLeft, godMode } = this;
    // After the last level the counter has gone one past it: show the last.
    const level = Math.min(this.level, this.balance.levels.length);
    this.onHud({ score, level, lives, timeLeft, godMode });
    if (this.over) {
      this.stop();
      this.onEnd({ won: this.won, score });
      return;
    }
    if (this.sinceSave < SAVE_EVERY) return;
    this.sinceSave = 0;
    this.onSave();
  }

  snapshot() {
    return this.over ? null : snapshotWorld(this);
  }

  stop() {
    cancelAnimationFrame(this.frame);
  }

  destroy() {
    this.stop();
    this.audio.stopAllLoops();
    this.view.destroy();
  }
}

export const createGame = (parts) => new Game(parts);
