"use client";

// Combined win/loss counter shared across all 4 games this app hosts
// (Coinche, la Bouilla, Président, la Bataille Corse) - one counter, not
// per-game, per explicit user choice. Client-only localStorage, no backend,
// same pattern as the pre-existing `useMatchStats.ts` (per-match funny
// awards). See docs/DECISIONS.md for the "no accounts" trade-off.
// A per-game split is kept alongside, only to feed the hub profile's
// per-game breakdown (profileSync.ts); it is never displayed here.

import { useEffect } from "react";
import { COINCHAPP_GAMES, type CoinchappGame } from "@/lib/profileGames";

const STATS_KEY = "coinchapp-match-results";
const BY_GAME_KEY = "coinchapp-match-results-by-game";
const RECORDED_PREFIX = "coinchapp-result-recorded-";

export interface MatchResultStats {
  wins: number;
  losses: number;
}

export type ResultsByGame = Partial<Record<CoinchappGame, MatchResultStats>>;

export interface SharedSyncBatch extends MatchResultStats {
  game: CoinchappGame | null;
}

const EMPTY: MatchResultStats = { wins: 0, losses: 0 };

export function sanitizeStats(value: unknown): MatchResultStats {
  const source = (value ?? {}) as { wins?: unknown; losses?: unknown };
  const wins = Number(source.wins);
  const losses = Number(source.losses);
  return {
    wins: Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0,
    losses: Number.isFinite(losses) && losses > 0 ? Math.floor(losses) : 0,
  };
}

export function sanitizeByGame(value: unknown): ResultsByGame {
  const source = (value ?? {}) as Record<string, unknown>;
  const result: ResultsByGame = {};
  COINCHAPP_GAMES.forEach((game) => {
    if (source[game]) result[game] = sanitizeStats(source[game]);
  });
  return result;
}

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or quota exceeded - stat just won't persist.
  }
}

/** Read-only, for display (e.g. `HomeTopBar`'s settings panel). */
export function getMatchResultStats(): MatchResultStats {
  return sanitizeStats(readJson(STATS_KEY));
}

export function getMatchResultsByGame(): ResultsByGame {
  return sanitizeByGame(readJson(BY_GAME_KEY));
}

/** How many local results are not yet on the shared hub profile. */
export function pendingSharedDelta(
  local: MatchResultStats,
  synced: MatchResultStats,
): MatchResultStats {
  return {
    wins: Math.max(0, local.wins - synced.wins),
    losses: Math.max(0, local.losses - synced.losses),
  };
}

/** Splits the pending combined delta into per-game batches. Results recorded
 *  before the per-game split existed have no game: they go in one trailing
 *  `game: null` batch so the profile total still gets them. Empty batches are
 *  dropped. */
export function planSharedSync(
  local: MatchResultStats,
  synced: MatchResultStats,
  localByGame: ResultsByGame,
  syncedByGame: ResultsByGame,
): SharedSyncBatch[] {
  const combined = pendingSharedDelta(local, synced);
  const perGame = COINCHAPP_GAMES.map((game) => ({
    game,
    ...pendingSharedDelta(localByGame[game] ?? EMPTY, syncedByGame[game] ?? EMPTY),
  }));
  const attributed = perGame.reduce(
    (sum, batch) => ({ wins: sum.wins + batch.wins, losses: sum.losses + batch.losses }),
    EMPTY,
  );
  const unattributed = pendingSharedDelta(combined, attributed);
  return [...perGame, { game: null, ...unattributed }].filter(
    (batch) => batch.wins > 0 || batch.losses > 0,
  );
}

/** Increments the combined counter and the per-game split. Guarded by a
 *  `sessionStorage` flag keyed by `matchId` so re-rendering (or refreshing)
 *  the finished screen never double-counts the same match. */
function recordMatchResult(matchId: string, won: boolean, game: CoinchappGame): void {
  const flagKey = `${RECORDED_PREFIX}${matchId}`;
  try {
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, "1");
  } catch {
    // sessionStorage unavailable - proceed anyway (best effort).
  }
  writeJson(STATS_KEY, addResult(getMatchResultStats(), won));
  const byGame = getMatchResultsByGame();
  byGame[game] = addResult(byGame[game] ?? EMPTY, won);
  writeJson(BY_GAME_KEY, byGame);
}

function addResult(stats: MatchResultStats, won: boolean): MatchResultStats {
  return won
    ? { wins: stats.wins + 1, losses: stats.losses }
    : { wins: stats.wins, losses: stats.losses + 1 };
}

/** Call from a finished-match overlay: records the local player's win/loss
 *  exactly once, the instant `finished` becomes true for this `matchId`. */
export function useRecordMatchResult(
  matchId: string | undefined,
  finished: boolean,
  won: boolean,
  game: CoinchappGame,
): void {
  useEffect(() => {
    if (!finished || !matchId) return;
    recordMatchResult(matchId, won, game);
    void import("./profileSync").then((mod) => mod.flushSharedMatchResults());
  }, [finished, matchId, won, game]);
}
