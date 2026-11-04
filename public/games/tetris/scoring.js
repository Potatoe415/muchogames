// Original Game Boy (1989) scoring, speeds and levels 0-9 to start from.
export const GOAL_LINES = 40;
export const LINES_PER_LEVEL = 10;
export const MAX_START_LEVEL = 9;

const LINE_POINTS = [0, 40, 100, 300, 1200];
// Frames per row on the Game Boy (59.73 fps), levels 0-20; 3 after that.
const GB_FRAMES = [53, 49, 45, 41, 37, 33, 28, 22, 17, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3];
const GB_FPS = 59.73;
const SOFT_FACTOR = 20;
const MIN_SOFT_INTERVAL = 0.02;

export const levelFor = (startLevel, lines) =>
  startLevel + Math.floor(lines / LINES_PER_LEVEL);

// Seconds per row of gravity; soft drop is 20x faster.
export function fallInterval(startLevel, lines, soft = false) {
  const level = Math.min(levelFor(startLevel, lines), GB_FRAMES.length - 1);
  const base = GB_FRAMES[level] / GB_FPS;
  if (!soft) return base;
  return Math.min(base, Math.max(base / SOFT_FACTOR, MIN_SOFT_INTERVAL));
}

// Points for clearing `lines` rows at `level`, as on the Game Boy.
export const linePoints = (lines, level) => LINE_POINTS[lines] * (level + 1);
