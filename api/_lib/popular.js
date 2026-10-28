// Public match ranking for the hub sort. Counts only, no player data.
// Same 10 000-row cap as the admin stats reader. Window is the admin
// "6m" range so a newer game can still rise.
import { getServiceClient } from "./supabase.js";

const MAX_ROWS = 10000;
const WINDOW_DAYS = 182;
const GAME_ID_RE = /^[a-z0-9-]{1,64}$/;

export async function readPopularRanking() {
  return rankRows(await loadMatchRows());
}

async function loadMatchRows() {
  try {
    const { data, error } = await getServiceClient()
      .from("muchogames_events")
      .select("game_id")
      .eq("type", "match_start")
      .gte("created_at", windowStart().toISOString())
      .limit(MAX_ROWS);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

function windowStart() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
  return start;
}

function rankRows(rows) {
  const counts = new Map();
  rows.forEach((row) => addRow(counts, row?.game_id));
  return [...counts.entries()]
    .map(([gameId, matches]) => ({ gameId, matches }))
    .sort((first, second) => second.matches - first.matches);
}

function addRow(counts, gameId) {
  if (typeof gameId !== "string" || !GAME_ID_RE.test(gameId)) return;
  counts.set(gameId, (counts.get(gameId) || 0) + 1);
}
