// Win/loss counter for this game, client-only localStorage (no accounts,
// no backend) - same pattern as the sibling Bergamots-hub apps. Tranquil is
// cooperative (players win or lose together), so there is no "my seat" to
// resolve: every finished match records the same outcome for whoever is
// playing on this browser.

const STATS_KEY = 'tranquil-match-results';

export interface MatchResultStats {
  wins: number;
  losses: number;
}

function readStats(): MatchResultStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
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

/** Read-only, for display (`SettingsPanel`). */
export function getMatchResultStats(): MatchResultStats {
  return readStats();
}

/** How many local results are not yet on the shared hub profile. */
export function pendingSharedDelta(local: MatchResultStats, synced: MatchResultStats): MatchResultStats {
  return {
    wins: Math.max(0, local.wins - synced.wins),
    losses: Math.max(0, local.losses - synced.losses),
  };
}

/** Call once per finished match (e.g. from `GameOver`'s mount-only effect). */
export function recordMatchResult(won: boolean): void {
  const stats = readStats();
  if (won) stats.wins += 1;
  else stats.losses += 1;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable or quota exceeded - stat just won't persist.
  }
  void import('./profileSync').then((mod) => mod.flushSharedMatchResults());
}
