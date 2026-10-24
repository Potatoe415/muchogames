// Classic Windows difficulties. `cols` is the long side: a portrait stage
// swaps rows and cols at match start.
export const LEVELS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 }
};

export const LEVEL_IDS = Object.keys(LEVELS);

export const MAX_SECONDS = 999;

export function levelLayout(id, portrait) {
  const { rows, cols, mines } = LEVELS[id];
  return portrait && cols > rows
    ? { rows: cols, cols: rows, mines }
    : { rows, cols, mines };
}
