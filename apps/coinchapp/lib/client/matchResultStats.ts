"use client";

// Combined win/loss counter shared across all 4 games this app hosts
// (Coinche, la Bouilla, Président, la Bataille Corse) - one counter, not
// per-game, per explicit user choice. Client-only localStorage, no backend,
// same pattern as the pre-existing `useMatchStats.ts` (per-match funny
// awards). See docs/DECISIONS.md for the "no accounts" trade-off.

import { useEffect } from "react";

const STATS_KEY = "coinchapp-match-results";
const RECORDED_PREFIX = "coinchapp-result-recorded-";

export interface MatchResultStats {
  wins: number;
  losses: number;
}

function readStats(): MatchResultStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
    const wins = Number(parsed?.wins);
    const losses = Number(parsed?.losses);
    return {
      wins: Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0,
      losses: Number.isFinite(losses) && losses > 0 ? Math.floor(losses) : 0,
    };
  } catch {
    return { wins: 0, losses: 0 };
  }
}

/** Read-only, for display (e.g. `HomeTopBar`'s settings panel). */
export function getMatchResultStats(): MatchResultStats {
  return readStats();
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

/** Increments the combined counter. Guarded by a `sessionStorage` flag keyed
 *  by `matchId` so re-rendering (or refreshing) the finished screen never
 *  double-counts the same match. */
function recordMatchResult(matchId: string, won: boolean): void {
  const flagKey = `${RECORDED_PREFIX}${matchId}`;
  try {
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, "1");
  } catch {
    // sessionStorage unavailable - proceed anyway (best effort).
  }
  const stats = readStats();
  if (won) stats.wins += 1;
  else stats.losses += 1;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable or quota exceeded - stat just won't persist.
  }
}

/** Call from a finished-match overlay: records the local player's win/loss
 *  exactly once, the instant `finished` becomes true for this `matchId`. */
export function useRecordMatchResult(
  matchId: string | undefined,
  finished: boolean,
  won: boolean,
): void {
  useEffect(() => {
    if (!finished || !matchId) return;
    recordMatchResult(matchId, won);
    void import("./profileSync").then((mod) => mod.flushSharedMatchResults());
  }, [finished, matchId, won]);
}
