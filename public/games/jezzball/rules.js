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
import {
  CANCEL_WINDOW,
  POINTS,
  TARGET_PERCENT,
  URGENT_SECONDS
} from "./levels.js";
import {
  breakRay,
  cancelWall,
  createWall,
  growWall,
  isLive,
  rayRect,
  wallOver
} from "./walls.js";

const COLORS = {
  points: "#ffe14d",
  glass: ["#e8f4ff", "#9fd0ff", "#ffffff", "#ff6b6b"],
  fill: "#7fd3ff"
};
const FLASH_SECONDS = 0.4;

export const canBuild = (state) =>
  state.phase === "play" && !state.paused && !state.wall;

export function tryBuild(game, x, y) {
  const { state, audio } = game;
  if (state.phase !== "play" || state.paused) return false;
  if (state.wall || cellAt(state.grid, x, y) !== EMPTY) {
    audio.play("deny");
    return false;
  }
  state.wall = createWall(x, y, state.axis);
  audio.play("launch");
  return true;
}

export function toggleAxis(game) {
  const { state, audio } = game;
  if (state.phase !== "play" || state.paused) return;
  state.axis = state.axis === "h" ? "v" : "h";
  audio.play("axis");
}

// Two-finger tap: the first finger has already launched a wall a few
// milliseconds earlier. Take it back (if nothing has turned solid yet) so
// the gesture only flips the axis.
export function twoFingerToggle(game) {
  const { state } = game;
  const wall = state.wall;
  if (wall && wall.age < CANCEL_WINDOW && !wall.solidified) {
    cancelWall(state.grid, wall);
    state.wall = null;
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
  if (state.lives > 0) return;
  state.phase = "over";
  state.wall = null;
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
  loseLife(game, "hit");
}

function resolveHits(game) {
  const { state, effects } = game;
  state.wall.rays.filter(isLive).forEach((ray) => {
    if (state.phase !== "play") return;
    const rect = rayRect(state.wall, ray);
    const ball = state.balls.find((b) => touchesRect(b, rect));
    if (!ball) return;
    effects.ring(ball.x, ball.y, "#ff4d4d");
    shatter(game, ray);
  });
}

function capture(game, ray) {
  const { state, audio, effects } = game;
  const { grid, wall } = state;
  const before = grid.solid;
  solidify(grid, ray.cells);
  ray.finished = false;
  wall.solidified = true;
  const sources = state.balls.map((ball) => ballCell(grid, ball));
  const pocket = unreachedCells(grid, sources);
  solidify(grid, pocket);
  audio.play("clack");
  if (pocket.length) audio.play("fill");
  state.percent = conqueredPercent(grid);
  const gained = grid.solid - before;
  if (!gained) return;
  const rect = rayRect(wall, ray);
  const cx = (rect.x0 + rect.x1) / 2;
  const cy = (rect.y0 + rect.y1) / 2;
  effects.ring(cx, cy, COLORS.fill);
  addScore(game, gained * POINTS.cell * state.config.level, cx, cy);
}

function levelCleared(game) {
  const { state, audio } = game;
  const level = state.config.level;
  const over = Math.max(0, Math.floor(state.percent) - TARGET_PERCENT);
  state.percentBonus = over * POINTS.percent * level;
  state.timeBonus = Math.ceil(state.timer) * POINTS.second * level;
  state.score += state.percentBonus + state.timeBonus;
  state.phase = "cleared";
  state.wall = null;
  audio.play("win");
  game.onLevelCleared(summary(state));
}

function stepWall(game, dt) {
  const { state, audio } = game;
  if (growWall(state.grid, state.wall, dt) > 0) audio.play("grow");
  resolveHits(game);
  state.wall?.rays.forEach((ray) => {
    if (ray.finished && state.phase === "play") capture(game, ray);
  });
  if (state.phase !== "play") return;
  if (state.percent >= TARGET_PERCENT) levelCleared(game);
  else if (wallOver(state.wall)) state.wall = null;
}

function stepTimer(game, dt) {
  const { state, audio } = game;
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
  if (moveBalls(state.grid, state.balls, dt) > 0) game.audio.play("bounce");
  if (state.wall) stepWall(game, dt);
  if (state.phase === "play") stepTimer(game, dt);
}

export function summary(state, reason) {
  return {
    level: state.config.level,
    score: state.score,
    percent: Math.floor(state.percent),
    target: TARGET_PERCENT,
    percentBonus: state.percentBonus,
    timeBonus: state.timeBonus,
    reason
  };
}
