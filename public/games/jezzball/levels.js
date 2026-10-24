// Grid size, speeds, points and the per-level settings. Distances are in
// grid cells, durations in seconds.
export const GRID_LONG = 32;
export const GRID_SHORT = 22;
export const BORDER = 1;
export const TARGET_PERCENT = 75;

export const BALL_RADIUS = 0.4;
export const BALL_SPEED = 7.5;
export const WALL_SPEED = 11;
export const CANCEL_WINDOW = 0.15;
export const URGENT_SECONDS = 10;

// Every value is multiplied by the level number.
export const POINTS = { cell: 1, percent: 50, second: 10 };

export function levelConfig(level) {
  return {
    level,
    balls: level + 1,
    lives: level + 1,
    time: 60 + 20 * level
  };
}
