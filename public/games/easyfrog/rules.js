// What happens to the frog each frame: the flies, the home slots and level
// changes, cars and the train, riding (or sinking in) the river, and death.
const WIN_SLOT_COLS = [1, 3, 5, 7];
const LEVEL_SOUNDS = { 6: "level6" };

const overlaps = (a, b) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const boxOf = (item) => ({
  left: item.x,
  right: item.x + item.width,
  top: item.y,
  bottom: item.y + item.height
});

function touchFlies(game) {
  const frog = boxOf(game.player);
  const { chaosFly, fly, balance } = game;
  if (chaosFly.active && !game.isFlipped && overlaps(frog, boxOf(chaosFly))) {
    game.isFlipped = true;
    game.flipTimer = 4;
    chaosFly.deactivate();
  }
  if (!fly.active || !overlaps(frog, boxOf(fly))) return;
  game.score += balance.flyScore;
  fly.active = false;
  game.flyCaughtInLevel = true;
  if (game.lives < balance.maxLives) game.lives++;
  game.audio.play("fly-eat", 0.9);
  game.saveSoon();
}

function nextLevel(game) {
  game.level++;
  if (game.level > game.balance.levels.length) {
    game.endMatch(true);
    return;
  }
  game.wins = [false, false, false, false];
  game.deadFrogs = [];
  game.initLevel();
  const sound = LEVEL_SOUNDS[game.level];
  if (sound) game.audio.play(sound, 0.8);
}

// Landing on the top row: a free slot scores, anything else bounces back.
// Returns true when the level (or the match) changed.
function reachHome(game) {
  const { player, balance, cellSize } = game;
  if (player.targetY !== 0 || Math.abs(player.y - player.targetY) >= 10) {
    return false;
  }
  const slot = WIN_SLOT_COLS.indexOf(Math.round(player.x / cellSize));
  if (slot === -1 || game.wins[slot]) {
    player.targetY += cellSize;
    return false;
  }
  game.wins[slot] = true;
  game.score += balance.winScore;
  game.audio.play("win-slot", 0.9);
  player.resetPosition();
  if (game.timeLeft !== null) game.timeLeft += balance.timeBonus;
  game.saveSoon();
  const filled = game.wins.filter(Boolean).length;
  if (filled < balance.levels[game.level - 1].requiredWins) return false;
  nextLevel(game);
  return true;
}

function rideRiver(game, frog, dt) {
  const { player } = game;
  if (player.targetY < 80 || player.targetY > 320) return;
  let afloat = false;
  game.riverObjects.forEach((item) => {
    const safe = item.getSafeBox();
    if (!safe || !overlaps(frog, safe)) return;
    afloat = true;
    player.targetX += safe.speed * dt * game.speedFactor;
  });
  if (!afloat && Math.abs(player.y - player.targetY) < 10) die(game, "water");
}

export function checkCollisions(game, dt) {
  const p = game.player;
  const frog = {
    left: p.x + 20,
    right: p.x + p.width - 20,
    top: p.y + 20,
    bottom: p.y + p.height - 20
  };
  touchFlies(game);
  if (reachHome(game) || game.over) return;
  if (game.obstacles.some((car) => overlaps(frog, boxOf(car)))) {
    die(game, "road");
  }
  rideRiver(game, frog, dt);
}

function markDeath(game, type) {
  const { player, audio } = game;
  const sounds = { road: "car-collision", water: "water-collision" };
  audio.play(sounds[type] ?? "timeout", type === "time" ? 1 : 0.9);
  if (type === "time") return;
  const imgKey = type === "road" ? "frogDeadRoad" : "frogDeadWater";
  game.deadFrogs.push({ x: player.x, y: player.y, imgKey });
  if (type !== "water") return;
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;
  [8, 22, 36].forEach((radius) => {
    game.waterRipples.push({ x: cx, y: cy, radius, alpha: 1 });
  });
}

// type: "road", "water" or "time" (the level's timer ran out).
export function die(game, type) {
  if (game.godMode || game.isRespawning || game.over) return;
  const { balance } = game;
  game.lives--;
  game.score = Math.max(0, game.score - balance.deathPenalty);
  markDeath(game, type);
  if (game.lives <= 0) {
    game.endMatch(false);
    return;
  }
  game.isRespawning = true;
  game.respawnTimer = balance.respawnCooldownMs / 1000;
  game.player.resetPosition();
  if (type === "time") {
    game.timeLeft = game.levelConfig().timeLimit;
    game.audio.stopLoop("heartbeat");
    game.heartbeatActive = false;
  }
  game.saveSoon();
}

// Two cars in one lane never get closer than minCarGapFactor cells: the
// trailing one is held back.
export function keepCarGaps(game) {
  const minGap = game.balance.minCarGapFactor * game.cellSize;
  const lanes = new Map();
  game.obstacles.forEach((car) => {
    if (car.imgKey === "train") return;
    if (!lanes.has(car.y)) lanes.set(car.y, []);
    lanes.get(car.y).push(car);
  });
  lanes.forEach((lane) => {
    if (lane.length !== 2) return;
    const [left, right] = lane[0].x <= lane[1].x ? lane : [lane[1], lane[0]];
    const gap = right.x - (left.x + left.width);
    // Cars on opposite sides of the wrap point are not close.
    if (gap < -(game.gameWidth / 2) || gap >= minGap) return;
    if (left.speed > 0) left.x = right.x - left.width - minGap;
    else right.x = left.x + left.width + minGap;
  });
}
