// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use.
import { diagonalComponent } from "./balls.js";
import {
  GROW_1,
  GROW_2,
  SOLID,
  cellAt,
  conqueredPercent,
  createGrid
} from "./grid.js";
import { BORDER, DIFFICULTIES, MAX_WALLS, levelConfig } from "./levels.js";

const SAVE_KEY = "jezzball-current";
const VERSION = 1;
const PHASES = ["play", "cleared"];
const AXES = ["h", "v"];
const BALL_KEYS = ["x", "y", "vx", "vy", "spin", "tilt"];
const RAY_FLAGS = ["growing", "finished", "broken"];

const isInt = Number.isInteger;
const isCount = (n) => isInt(n) && n >= 0;
const pick = (source, keys) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));

const encodeRay = (ray) => ({
  ...pick(ray, ["dir", "length", "cells", "blockedBy"]),
  ...pick(ray, RAY_FLAGS)
});

const encodeWall = (wall) => ({
  ...pick(wall, ["axis", "pivot", "lane", "age", "solidified"]),
  rays: wall.rays.map(encodeRay)
});

export function encodeMatch(state) {
  const { grid } = state;
  return JSON.stringify({
    v: VERSION,
    level: state.config.level,
    mode: state.config.difficulty,
    ...pick(state, ["phase", "score", "axis", "lives", "timer"]),
    ...pick(state, ["percentBonus", "timeBonus"]),
    cols: grid.cols,
    rows: grid.rows,
    cells: Array.from(grid.cells).join(""),
    balls: state.balls.map((ball) => pick(ball, BALL_KEYS)),
    walls: state.walls.map(encodeWall)
  });
}

// Saves written before the difficulty modes have no `mode`: normal.
const configOf = (data) => levelConfig(data.level, data.mode);

function validMeta(data) {
  if (data?.v !== VERSION || !isInt(data.level) || data.level < 1) {
    return false;
  }
  if (data.mode !== undefined && !DIFFICULTIES.includes(data.mode)) {
    return false;
  }
  const config = configOf(data);
  return (
    PHASES.includes(data.phase) &&
    AXES.includes(data.axis) &&
    [data.score, data.percentBonus, data.timeBonus].every(isCount) &&
    isInt(data.lives) &&
    data.lives >= 1 &&
    data.lives <= config.lives &&
    Number.isFinite(data.timer) &&
    data.timer >= 0 &&
    data.timer <= config.time
  );
}

// The saved size must be the mode's, in either orientation, with a solid
// border ring.
function restoreGrid({ cols, rows, cells }, config) {
  const inner = [cols - 2 * BORDER, rows - 2 * BORDER];
  const sizes = config.grid;
  const fits = [sizes, [...sizes].reverse()].some(
    ([c, r]) => inner[0] === c && inner[1] === r
  );
  if (!fits || typeof cells !== "string" || !/^[0-3]*$/.test(cells)) {
    return null;
  }
  const grid = createGrid(inner[0], inner[1]);
  if (cells.length !== grid.cells.length) return null;
  const border = grid.cells.slice();
  for (let i = 0; i < cells.length; i++) {
    grid.cells[i] = Number(cells[i]);
    if (border[i] === SOLID && grid.cells[i] !== SOLID) return null;
    if (border[i] !== SOLID && grid.cells[i] === SOLID) grid.solid += 1;
  }
  grid.version = 1;
  return grid;
}

function validBall(ball, grid, component) {
  if (!BALL_KEYS.every((key) => Number.isFinite(ball?.[key]))) return false;
  const diagonal = [ball.vx, ball.vy].every(
    (v) => Math.abs(Math.abs(v) - component) < 1e-9
  );
  const cell = cellAt(grid, Math.floor(ball.x), Math.floor(ball.y));
  return diagonal && cell !== SOLID;
}

function validRay(ray, grid) {
  const kind = ray?.dir < 0 ? GROW_1 : GROW_2;
  if (![-1, 1].includes(ray?.dir) || !Array.isArray(ray.cells)) return false;
  const live = ray.growing || ray.finished;
  return (
    RAY_FLAGS.every((flag) => typeof ray[flag] === "boolean") &&
    Number.isFinite(ray.length) &&
    ray.length >= 0 &&
    ray.length <= ray.cells.length &&
    isInt(ray.blockedBy) &&
    ray.blockedBy >= -1 &&
    ray.cells.every((i) => isCount(i) && i < grid.cells.length) &&
    (!live || ray.cells.every((i) => grid.cells[i] === kind))
  );
}

function validWall(wall, grid) {
  const rays = wall?.rays;
  if (!Array.isArray(rays) || rays.length < 1 || rays.length > 2) return false;
  const dirs = new Set(rays.map((ray) => ray?.dir));
  return (
    AXES.includes(wall.axis) &&
    isCount(wall.pivot) &&
    isCount(wall.lane) &&
    Number.isFinite(wall.age) &&
    wall.age >= 0 &&
    typeof wall.solidified === "boolean" &&
    dirs.size === rays.length &&
    rays.every((ray) => validRay(ray, grid))
  );
}

// Every growing cell on the grid belongs to exactly one live ray.
function growingMatches(grid, walls) {
  const owned = walls
    .flatMap((wall) => wall.rays)
    .filter((ray) => ray.growing || ray.finished)
    .reduce((sum, ray) => sum + ray.cells.length, 0);
  const growing = grid.cells.filter((c) => c === GROW_1 || c === GROW_2);
  return owned === growing.length;
}

function validPieces(data, grid, config) {
  const { balls, walls } = data;
  if (!Array.isArray(balls) || !Array.isArray(walls)) return false;
  const maxWalls = data.phase === "play" ? MAX_WALLS : 0;
  const component = diagonalComponent(config.ballSpeed);
  return (
    balls.length === config.balls &&
    balls.every((ball) => validBall(ball, grid, component)) &&
    walls.length <= maxWalls &&
    walls.every((wall) => validWall(wall, grid)) &&
    growingMatches(grid, walls)
  );
}

const restoreWall = (wall) => ({
  ...encodeWall(wall),
  rays: wall.rays.map((ray) => ({
    kind: ray.dir < 0 ? GROW_1 : GROW_2,
    ...encodeRay(ray),
    cells: [...ray.cells]
  }))
});

// Returns the fields of the game state, or null when the save is unusable.
export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMeta(data)) return null;
  const config = configOf(data);
  const grid = restoreGrid(data, config);
  if (!grid || !validPieces(data, grid, config)) return null;
  const percent = conqueredPercent(grid);
  if (data.phase === "play" && percent >= config.target) return null;
  return {
    ...pick(data, ["phase", "score", "axis", "lives", "timer"]),
    ...pick(data, ["percentBonus", "timeBonus"]),
    config,
    grid,
    percent,
    balls: data.balls.map((ball) => pick(ball, BALL_KEYS)),
    walls: data.walls.map(restoreWall)
  };
}

export function loadMatch() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text === null) return null;
    const match = decodeMatch(text);
    if (!match) localStorage.removeItem(SAVE_KEY);
    return match;
  } catch {
    return null;
  }
}

export function storeMatch(state) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(state));
  } catch {
    // Storage unavailable or full: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
