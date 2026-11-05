// Solo personal best, one key per grid (docs/PLATFORM_RULES.md 4.3):
// muchogames_memory_best_<grid>. Never inside the match save.
import { GRID_IDS } from "./config.js";

const key = (grid) => `muchogames_memory_best_${grid}`;

export function loadBest(grid) {
  if (!GRID_IDS.includes(grid)) return null;
  try {
    const text = localStorage.getItem(key(grid));
    const value = text === null ? NaN : Number(text);
    return Number.isInteger(value) ? value : null;
  } catch {
    return null;
  }
}

// Keeps the higher of the stored best and `score`; returns the best.
export function storeBest(grid, score) {
  const best = loadBest(grid);
  if (best !== null && best >= score) return best;
  try {
    localStorage.setItem(key(grid), String(score));
  } catch {
    // Storage unavailable: the record lasts for this visit only.
  }
  return score;
}
