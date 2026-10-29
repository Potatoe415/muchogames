// Game rules: wall launch, ray/ball hits, area capture, scoring, lives,
// timer and level end. `game` bundles the mutable state with the
// audio/effects/callbacks the rules talk to.
import { ballCell, moveBalls, touchesRect } from "./balls.js";
import {
  EMPTY,
  cellAt,
  conqueredPercent,
  fadeGlow,
  solidify,
  unreachedCells
} from "./grid.js";
import { CANCEL_WINDOW, MAX_WALLS, POINTS, URGENT_SECONDS } from "./levels.js";
import {
  breakRay,
  cancelWall,
  createWall,
  growWall,
  isLive,
  joinHeadOn,
  nearestDirection,
  rayRect,
  wallOver
} from "./walls.js";

const COLORS = {
  points: "#ffe14d",
  glass: ["#e8f4ff", "#9fd0ff", "#ffffff", "#ff6b6b"],
  fill: "#7fd3ff"
};
const FLASH_SECONDS = 0.4;
const VIBRATE = { hit: [70, 40, 70], fill: 35, win: [40, 30, 40, 30, 120] };

// Points for `base` (already × POINTS), scaled by level and mode.
const scaled = (config, base) =>
  Math.round(base * config.level * config.points);

// True when a tap would launch a full two-ray wall (mouse preview).
export const canBuild = (state) =>
  state.phase === "play" && !state.paused && state.walls.length === 0;

// While a wall grows, a second one may start with a single ray: along `dir`
// (swipe direction) or, without one, toward the closest solid cell.
export function tryBuild(game, x, y, axis = game.state.axis, dir) {
  const { state, audio } = game;
  if (state.phase !== "play" || state.paused) return false;
  const full = state.walls.length >= MAX_WALLS;
  if (full || cellAt(state.grid, x, y) !== EMPTY) {
    audio.play("deny");
    return false;
  }
  const single = state.walls.length > 0;
  const ray = single ? dir || nearestDirection(state.grid, x, y, axis) : 0;
  state.walls.push(createWall(x, y, axis, ray));
  audio.play("launch");
  game.onChange();
  return true;
}

export function toggleAxis(game) {
  const { state, audio } = game;
  if (state.phase !== "play" || state.paused) return;
  state.axis = state.axis === "h" ? "v" : "h";
  audio.play("axis");
  game.onChange();
}

// Two-finger tap: the first finger has already launched a wall a few
// milliseconds earlier. Take it back (if nothing has turned solid yet) so
// the gesture only flips the axis.
export function twoFingerToggle(game) {
  const { state } = game;
  const wall = state.walls.at(-1);
  if (wall && wall.age < CANCEL_WINDOW && !wall.solidified) {
    cancelWall(state.grid, wall);
    state.walls.pop();
  }
  toggleAxis(game);
}

function addScore(game, points, x, y) {
  game.state.score += points;
  game.effects.text(x, y, `+${points}`, COLORS.points);
}

function loseLife(game, reason) {
  const { state, audio } = game;
  state.lives -= 1;
  state.flash = FLASH_SECONDS;
  if (state.lives > 0) return game.onChange();
  state.phase = "over";
  state.walls = [];
  audio.play("lose");
  game.onGameOver(summary(state, reason));
}

function shatter(game, ray) {
  const { state, effects, audio } = game;
  const { cols } = state.grid;
  ray.cells.forEach((index, i) => {
    const color = COLORS.glass[i % COLORS.glass.length];
    effects.burst(
      (index % cols) + 0.5,
      Math.floor(index / cols) + 0.5,
      color,
      4
    );
  });
  breakRay(state.grid, ray);
  audio.play("shatter");
  game.vibrate(VIBRATE.hit);
  loseLife(game, "hit");
}

// A growing ray's head is spared over `headGrace` (easy mode); a finished
// ray is tested at full length so no atom ends up inside a solid cell.
function resolveHits(game, wall) {
  const { state, effects } = game;
  wall.rays.filter(isLive).forEach((ray) => {
    if (state.phase !== "play") return;
    const trim = ray.growing ? state.config.headGrace : 0;
    const rect = rayRect(wall, ray, trim);
    const ball = state.balls.find((b) => touchesRect(b, rect));
    if (!ball) return;
    effects.ring(ball.x, ball.y, "#ff4d4d");
    shatter(game, ray);
  });
}

function capture(game, wall, ray) {
  const { state, audio, effects } = game;
  const { grid } = state;
  const before = grid.solid;
  solidify(grid, ray.cells);
  ray.finished = false;
  wall.solidified = true;
  const sources = state.balls.map((ball) => ballCell(grid, ball));
  const pocket = unreachedCells(grid, sources);
  solidify(grid, pocket);
  audio.play("clack");
  if (pocket.length) {
    audio.play("fill");
    game.vibrate(VIBRATE.fill);
  }
  state.percent = conqueredPercent(grid);
  game.onChange();
  const gained = grid.solid - before;
  if (!gained) return;
  const rect = rayRect(wall, ray);
  const cx = (rect.x0 + rect.x1) / 2;
  const cy = (rect.y0 + rect.y1) / 2;
  effects.ring(cx, cy, COLORS.fill);
  addScore(game, scaled(state.config, gained * POINTS.cell), cx, cy);
}

function levelCleared(game) {
  const { state, audio } = game;
  const { config } = state;
  const over = Math.max(0, Math.floor(state.percent) - config.target);
  state.percentBonus = scaled(config, over * POINTS.percent);
  state.timeBonus = scaled(config, Math.ceil(state.timer) * POINTS.second);
  state.score += state.percentBonus + state.timeBonus;
  state.phase = "cleared";
  state.walls = [];
  audio.play("win");
  game.vibrate(VIBRATE.win);
  game.onLevelCleared(summary(state));
  game.onChange();
}

function stepWalls(game, dt) {
  const { state, audio } = game;
  const speed = state.config.wallSpeed;
  let claimed = 0;
  state.walls.forEach(
    (wall) => (claimed += growWall(state.grid, wall, dt, speed))
  );
  if (claimed > 0) audio.play("grow");
  joinHeadOn(state.walls);
  state.walls.forEach((wall) => resolveHits(game, wall));
  state.walls.forEach((wall) =>
    wall.rays.forEach((ray) => {
      if (ray.finished && state.phase === "play") capture(game, wall, ray);
    })
  );
  if (state.phase !== "play") return;
  if (state.percent >= state.config.target) levelCleared(game);
  else state.walls = state.walls.filter((wall) => !wallOver(wall));
}

// Untimed modes (`config.time === 0`) never tick.
function stepTimer(game, dt) {
  const { state, audio } = game;
  if (!state.config.time) return;
  const before = Math.ceil(state.timer);
  state.timer = Math.max(0, state.timer - dt);
  const after = Math.ceil(state.timer);
  if (after !== before && after < URGENT_SECONDS && after > 0) {
    audio.play("tick");
  }
  if (state.timer > 0) return;
  audio.play("timeout");
  state.timer = state.config.time;
  loseLife(game, "time");
}

export function stepGame(game, dt) {
  const { state } = game;
  game.effects.update(dt);
  fadeGlow(state.grid, dt);
  state.flash = Math.max(0, state.flash - dt);
  if (state.phase !== "play" || state.paused) return;
  const { ballSpeed } = state.config;
  if (moveBalls(state.grid, state.balls, dt, ballSpeed) > 0) {
    game.audio.play("bounce");
  }
  if (state.walls.length) stepWalls(game, dt);
  if (state.phase === "play") stepTimer(game, dt);
}

export function summary(state, reason) {
  return {
    level: state.config.level,
    score: state.score,
    difficulty: state.config.difficulty,
    percent: Math.floor(state.percent),
    target: state.config.target,
    timed: state.config.time > 0,
    percentBonus: state.percentBonus,
    timeBonus: state.timeBonus,
    reason
  };
}
