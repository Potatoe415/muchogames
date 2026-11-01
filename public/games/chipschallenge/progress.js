// Saved progress (localStorage `chipschallenge-progress`): unlocked levels
// (by finishing the previous one or typing its password), the best score
// and time left per level and the last level completed (`last`, 0 = none). Scoring follows the original: time bonus = 10 per
// second left, level bonus = 500 x level, minus 20% per failed attempt (the
// first four count).
import { LEVELS } from "./levels.js";
import { readStorage, writeStorage } from "./storage.js";

const KEY = "chipschallenge-progress";
const MAX_PENALTIES = 4;

const validLevel = (n) => Number.isInteger(n) && n >= 1 && n <= LEVELS.length;

function sanitizeBest(raw) {
  const best = {};
  Object.entries(raw && typeof raw === "object" ? raw : {}).forEach(
    ([n, rec]) => {
      const score = Number(rec?.score);
      const time = Number(rec?.time);
      if (validLevel(Number(n)) && score >= 0) {
        best[n] = { score, time: time >= 0 ? time : 0 };
      }
    }
  );
  return best;
}

export function loadProgress() {
  let data = {};
  try {
    data = JSON.parse(readStorage(KEY, "{}")) || {};
  } catch {
    data = {};
  }
  const list = Array.isArray(data.unlocked) ? data.unlocked : [];
  const unlocked = new Set([1, ...list.map(Number).filter(validLevel)]);
  const best = sanitizeBest(data.best);
  const cleared = Object.keys(best).map(Number);
  const last = validLevel(data.last) ? data.last : Math.max(0, ...cleared);
  return { unlocked, best, last };
}

export function saveProgress(progress) {
  writeStorage(
    KEY,
    JSON.stringify({
      unlocked: [...progress.unlocked].sort((a, b) => a - b),
      best: progress.best,
      last: progress.last
    })
  );
}

// Level after the last one completed, or 0 (none completed, or it was the
// last level).
export const nextLevel = (progress) =>
  progress.last && validLevel(progress.last + 1) ? progress.last + 1 : 0;

export function unlock(progress, number) {
  if (!validLevel(number) || progress.unlocked.has(number)) return;
  progress.unlocked.add(number);
  saveProgress(progress);
}

// Level number for a password, or 0.
export function levelForPassword(code) {
  const wanted = code.trim().toUpperCase();
  return LEVELS.findIndex((level) => level.password === wanted) + 1;
}

export function scoreLevel(number, timeLeft, failures) {
  const timeBonus = Math.max(0, timeLeft) * 10;
  const penalties = Math.min(failures, MAX_PENALTIES);
  const levelBonus = Math.floor(500 * number * 0.8 ** penalties);
  return { timeBonus, levelBonus, levelScore: timeBonus + levelBonus };
}

export const totalScore = (progress) =>
  Object.values(progress.best).reduce((sum, rec) => sum + rec.score, 0);

// Stores a win; returns { previousTime } (null if first clear) for the
// time-record message.
export function recordWin(progress, number, score, timeLeft) {
  const previous = progress.best[number];
  progress.best[number] = {
    score: Math.max(score, previous?.score ?? 0),
    time: Math.max(timeLeft, previous?.time ?? 0)
  };
  progress.last = number;
  if (validLevel(number + 1)) progress.unlocked.add(number + 1);
  saveProgress(progress);
  return { previousTime: previous ? previous.time : null };
}
