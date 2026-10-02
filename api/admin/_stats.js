// Launch-stats action for api/admin/index.js. Not a route itself.
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

const MAX_ROWS = 10000;
const RANGE_DAYS = { "7d": 7, "30d": 30, "6m": 182 };
const DEFAULT_RANGE = "30d";

/**
 * Returns the game launch ranking plus a daily trend, over the requested range.
 *
 * Days are bucketed in UTC. The hub's audience is in UTC+1/+2, so a launch
 * after midnight local time lands on the previous day. Accepted: the trend is
 * meant to show shape, not to be an accounting record.
 */
export async function handleStats(res, body) {
  // An unknown range falls back to the default rather than erroring: the only
  // caller is our own page, which sends one of the three known values.
  const range = RANGE_DAYS[body.range] ? body.range : DEFAULT_RANGE;
  const days = RANGE_DAYS[range];
  const start = startOfDayUtc(-(days - 1));

  const { data, error } = await getServiceClient()
    .from("muchogames_events")
    .select("game_id, created_at")
    .eq("type", "game_launch")
    .gte("created_at", start.toISOString())
    .limit(MAX_ROWS);

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, {
    range,
    totalLaunches: data.length,
    ranking: rankByGame(data),
    dailyTrend: buildDailyTrend(data, start, days),
    dailyTrendByGame: buildDailyTrendByGame(data, start, days),
    community: await readCommunityTotals(start)
  });
}

// Signed-in players and the results they have recorded (all time). A match
// between two signed-in players counts once per player. Null on failure so
// the launch stats still render.
async function readCommunityTotals(start) {
  const { data, error } = await getServiceClient()
    .from("muchogames_profiles")
    .select("wins, losses, created_at")
    .limit(MAX_ROWS);

  if (error) return null;

  return {
    players: data.length,
    newPlayers: data.filter((row) => new Date(row.created_at) >= start).length,
    results: data.reduce((sum, row) => sum + row.wins + row.losses, 0)
  };
}

function rankByGame(rows) {
  const launchesByGame = new Map();

  rows.forEach(({ game_id: gameId }) => {
    launchesByGame.set(gameId, (launchesByGame.get(gameId) || 0) + 1);
  });

  return [...launchesByGame.entries()]
    .map(([gameId, launches]) => ({ gameId, launches }))
    .sort((first, second) => second.launches - first.launches);
}

// Zero-filled so the chart gets one point per day and never has to guess where
// the gaps are.
function buildDailyTrend(rows, start, days) {
  const launchesByDay = new Map();

  for (let offset = 0; offset < days; offset += 1) {
    launchesByDay.set(dayKey(addUtcDays(start, offset)), 0);
  }

  rows.forEach(({ created_at: createdAt }) => {
    const key = dayKey(new Date(createdAt));

    if (launchesByDay.has(key)) {
      launchesByDay.set(key, launchesByDay.get(key) + 1);
    }
  });

  return [...launchesByDay.entries()].map(([date, launches]) => ({
    date,
    launches
  }));
}

// One zero-filled trend per game, computed from the same rows as the
// aggregate trend, so the /admin game filter needs no extra request.
function buildDailyTrendByGame(rows, start, days) {
  const rowsByGame = new Map();

  rows.forEach((row) => {
    if (!rowsByGame.has(row.game_id)) rowsByGame.set(row.game_id, []);
    rowsByGame.get(row.game_id).push(row);
  });

  const trendByGame = {};

  rowsByGame.forEach((gameRows, gameId) => {
    trendByGame[gameId] = buildDailyTrend(gameRows, start, days);
  });

  return trendByGame;
}

function startOfDayUtc(dayOffset) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

function addUtcDays(date, days) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}
