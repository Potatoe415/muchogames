// The match in progress as plain JSON (decision 0054): everything the
// player would notice — level, score, lives, filled slots, timer, frog,
// every car and river object, the flies and the flipped screen.
import { balanceFor, DIFFICULTIES } from "./difficulty.js";

const ROAD_SPRITES = new Set([
  "car_blue",
  "car_green",
  "car_lambo",
  "car_taxi",
  "car_red",
  "car_f1",
  "car_bus",
  "car_pink",
  "train"
]);
const DEAD_KEYS = new Set(["frogDeadRoad", "frogDeadWater"]);
const FAR = 5000; // generous bound for positions, px

const round = (n) => Math.round(n * 100) / 100;
const isNum = (v, min = -FAR, max = FAR) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isBool = (v) => typeof v === "boolean";
const isList = (v, min, max) =>
  Array.isArray(v) && v.length >= min && v.length <= max;

function moversOf(game) {
  const { fly, chaosFly: chaos } = game;
  return {
    fly: {
      active: fly.active,
      x: round(fly.x),
      y: round(fly.y),
      timer: round(fly.timer),
      cooldown: round(fly.cooldownTimer)
    },
    chaos: {
      active: chaos.active,
      x: round(chaos.x),
      y: round(chaos.y),
      vx: chaos.vx,
      vy: chaos.vy
    },
    road: game.obstacles.map((o) => ({
      sprite: o.imgKey,
      row: o.row,
      speed: o.speed,
      x: round(o.x)
    })),
    river: game.riverObjects.map((r) => ({
      x: round(r.x),
      timer: round(r.timer ?? 0),
      isSubmerged: Boolean(r.isSubmerged),
      isWarning: Boolean(r.isWarning)
    }))
  };
}

export function snapshotWorld(game) {
  return {
    difficulty: game.difficulty,
    level: game.level,
    score: game.score,
    lives: game.lives,
    wins: [...game.wins],
    deadFrogs: game.deadFrogs.map(({ x, y, imgKey }) => ({
      x: round(x),
      y: round(y),
      imgKey
    })),
    timeLeft: game.timeLeft === null ? null : round(game.timeLeft),
    flyCaughtInLevel: game.flyCaughtInLevel,
    flipTimer: game.isFlipped ? round(game.flipTimer) : 0,
    frog: { x: round(game.player.targetX), y: game.player.targetY },
    ...moversOf(game)
  };
}

function validCounters(m, balance) {
  const config = balance.levels[m.level - 1];
  const timeOk =
    config.timeLimit === null ? m.timeLeft === null : isNum(m.timeLeft, -1);
  return (
    isInt(m.score, 0, 1e9) &&
    isInt(m.lives, 1, balance.maxLives) &&
    isList(m.wins, 4, 4) &&
    m.wins.every(isBool) &&
    timeOk &&
    isBool(m.flyCaughtInLevel) &&
    isNum(m.flipTimer, 0, 4)
  );
}

const validDead = (f) =>
  isNum(f?.x) && isNum(f.y, 0, 880) && DEAD_KEYS.has(f.imgKey);

const validRoad = (o) =>
  ROAD_SPRITES.has(o?.sprite) &&
  isInt(o.row, 5, 9) &&
  isNum(o.speed, -1000, 1000) &&
  o.speed !== 0 &&
  isNum(o.x);

const validRiver = (r) =>
  isNum(r?.x) &&
  isNum(r.timer, 0, 1e5) &&
  isBool(r.isSubmerged) &&
  isBool(r.isWarning);

const allNums = (values) => values.every((v) => isNum(v));

function validMovers(m, balance) {
  const { fly, chaos } = m;
  return (
    isNum(m.frog?.x) &&
    isNum(m.frog.y, 0, 800) &&
    isBool(fly?.active) &&
    allNums([fly.x, fly.y, fly.timer, fly.cooldown]) &&
    isBool(chaos?.active) &&
    allNums([chaos.x, chaos.y, chaos.vx, chaos.vy]) &&
    isList(m.deadFrogs, 0, 100) &&
    m.deadFrogs.every(validDead) &&
    isList(m.road, 1, 9) &&
    m.road.every(validRoad) &&
    isList(m.river, 0, 20) &&
    m.river.length === balance.levels[m.level - 1].river.length &&
    m.river.every(validRiver)
  );
}

export function isValidSnapshot(m) {
  if (!DIFFICULTIES.includes(m?.difficulty)) return false;
  const balance = balanceFor(m.difficulty);
  if (!isInt(m.level, 1, balance.levels.length)) return false;
  return validCounters(m, balance) && validMovers(m, balance);
}

function restoreMovers(game, m) {
  game.riverObjects.forEach((obj, i) => {
    if (obj.type !== "diving_turtle") return;
    const { timer, isSubmerged, isWarning } = m.river[i];
    Object.assign(obj, { timer, isSubmerged, isWarning });
  });
  const cell = game.cellSize;
  game.player.placeAt(m.frog.x, Math.round(m.frog.y / cell) * cell);
  const { active, x, y, timer, cooldown } = m.fly;
  Object.assign(game.fly, { active, x, y, timer, cooldownTimer: cooldown });
  Object.assign(game.chaosFly, m.chaos);
}

// `m` passed isValidSnapshot; the game was built for m.difficulty.
export function restoreWorld(game, m) {
  Object.assign(game, {
    level: m.level,
    score: m.score,
    lives: m.lives,
    wins: [...m.wins],
    deadFrogs: m.deadFrogs.map((f) => ({ ...f })),
    flyCaughtInLevel: m.flyCaughtInLevel
  });
  const config = game.levelConfig();
  const river = config.river.map((r, i) => ({ ...r, x: m.river[i].x }));
  game.buildLevel(m.road, river);
  game.timeLeft = m.timeLeft;
  game.flipTimer = m.flipTimer;
  game.isFlipped = m.flipTimer > 0;
  restoreMovers(game, m);
}
