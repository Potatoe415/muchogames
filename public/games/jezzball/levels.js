// Difficulty modes, speeds, points and the per-level settings. Distances
// are in grid cells, durations in seconds.
export const BORDER = 1;
export const BALL_RADIUS = 0.4;
export const CANCEL_WINDOW = 0.15;
export const MAX_WALLS = 2;
export const URGENT_SECONDS = 10;

// Every value is multiplied by the level number and the mode's `points`.
export const POINTS = { cell: 1, percent: 50, second: 10 };

export const DIFFICULTIES = ["easy", "normal"];

// `grid` is [long side, short side] inside the border. `headGrace`: length
// of a growing ray's head that atoms may cross without breaking it. Easy
// has no timer (`timed: false`).
const MODES = {
  normal: {
    grid: [32, 22],
    ballSpeed: 7.5,
    wallSpeed: 11,
    target: 75,
    extraBalls: 1,
    extraLives: 1,
    timed: true,
    points: 1,
    headGrace: 0
  },
  easy: {
    grid: [22, 15],
    ballSpeed: 4.5,
    wallSpeed: 16,
    target: 66,
    extraBalls: 0,
    extraLives: 3,
    timed: false,
    points: 0.5,
    headGrace: 0.6
  }
};

export const normalizeDifficulty = (value) =>
  DIFFICULTIES.includes(value) ? value : "normal";

export function levelConfig(level, difficulty = "normal") {
  const key = normalizeDifficulty(difficulty);
  const mode = MODES[key];
  return {
    level,
    difficulty: key,
    grid: mode.grid,
    ballSpeed: mode.ballSpeed,
    wallSpeed: mode.wallSpeed,
    target: mode.target,
    points: mode.points,
    headGrace: mode.headGrace,
    balls: level + mode.extraBalls,
    lives: level + mode.extraLives,
    time: mode.timed ? 60 + 20 * level : 0
  };
}
