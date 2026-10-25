export const STORAGE_KEY = "muchogames_memory_state";
export const MISMATCH_MS = 1200;
export const BOT_FIRST_MS = 600;
export const BOT_SECOND_MS = 800;
export const PRELOAD_MS = 10000;

export const GRIDS = {
  "4x4": { cols: 4, rows: 4 },
  "4x6": { cols: 4, rows: 6 },
  "6x6": { cols: 6, rows: 6 }
};

export const MODES = ["solo", "pass", "bot"];
export const LEVELS = ["easy", "medium", "hard"];
export const GRID_IDS = ["4x4", "4x6", "6x6"];

export const BOT_THRESHOLD = {
  easy: 0.25,
  medium: 0.5,
  hard: 1
};
