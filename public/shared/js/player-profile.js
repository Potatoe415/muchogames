/* Canonical reader/writer for the player's Bergamots profile (name + avatar),
   shared by every unbundled page under public/ (the profile page itself,
   and any custom game — Yatzy is the first). Plain global script (same
   pattern as game-header.js) so classic, non-module game scripts can use it
   via a plain <script src> tag, same as the profile page.

   auth.js (root-level, bundled by Vite for the hub only) keeps its own
   duplicated NAME_KEY constant on purpose — see docs/DECISIONS.md
   2026-09-05 — since it cannot reach files under public/ at build time. */
(function () {
  const NAME_KEY = "bergamots-player-name";
  const AVATAR_KEY = "bergamots-player-avatar";
  const AVATAR_THUMB_KEY = "bergamots-player-avatar-thumb";
  // Written by game-session.js, one per match started.
  const MATCH_COUNTS_KEY = "muchogames-match-counts";
  const GAME_RESULTS_KEY = "bergamots-game-results";

  function getName(fallback) {
    try {
      return localStorage.getItem(NAME_KEY) || fallback || "";
    } catch {
      return fallback || "";
    }
  }

  function setName(name) {
    try {
      if (name) {
        localStorage.setItem(NAME_KEY, name);
      } else {
        localStorage.removeItem(NAME_KEY);
      }
    } catch {
      // Storage unavailable (private mode, etc.) — name just won't persist.
    }
  }

  function getAvatar() {
    try {
      return localStorage.getItem(AVATAR_KEY) || "";
    } catch {
      return "";
    }
  }

  function setAvatar(dataUrl, thumbUrl) {
    try {
      if (dataUrl) {
        localStorage.setItem(AVATAR_KEY, dataUrl);
        if (thumbUrl) {
          localStorage.setItem(AVATAR_THUMB_KEY, thumbUrl);
        }
      } else {
        localStorage.removeItem(AVATAR_KEY);
        localStorage.removeItem(AVATAR_THUMB_KEY);
      }
    } catch {
      // Storage unavailable, or quota exceeded — avatar just won't persist.
    }
  }

  function getAvatarThumb() {
    try {
      const stored = localStorage.getItem(AVATAR_THUMB_KEY) || "";
      return stored.startsWith("data:image/") ? stored : "";
    } catch {
      return "";
    }
  }

  function readMatchCounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MATCH_COUNTS_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }
      const counts = {};
      Object.keys(parsed).forEach((id) => {
        const n = Number(parsed[id]);
        if (id && Number.isFinite(n) && n > 0) {
          counts[id] = Math.floor(n);
        }
      });
      return counts;
    } catch {
      return {};
    }
  }

  function getMatchTotal() {
    return Object.values(readMatchCounts()).reduce(
      (sum, count) => sum + count,
      0
    );
  }

  function getMostPlayed(limit) {
    const cap = Number.isFinite(limit) && limit > 0 ? limit : 5;
    return Object.entries(readMatchCounts())
      .map(([id, count]) => ({ id: id, count: count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.id.localeCompare(right.id)
      )
      .slice(0, cap);
  }

  function readGameResults() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GAME_RESULTS_KEY) || "{}");
      const wins = Number(parsed && parsed.wins);
      const losses = Number(parsed && parsed.losses);
      return {
        wins: Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0,
        losses: Number.isFinite(losses) && losses > 0 ? Math.floor(losses) : 0
      };
    } catch {
      return { wins: 0, losses: 0 };
    }
  }

  function getWins() {
    return readGameResults().wins;
  }

  function getLosses() {
    return readGameResults().losses;
  }

  // Records a finished game's outcome for the local player. Callers (e.g.
  // Yatzy's finishGame()) must only call this when there is an unambiguous
  // "me" (online seat, or solo vs robot) - never for a same-device 2-player
  // local match, where both players share this browser.
  function recordGameResult(won) {
    const results = readGameResults();
    if (won) {
      results.wins += 1;
    } else {
      results.losses += 1;
    }
    try {
      localStorage.setItem(GAME_RESULTS_KEY, JSON.stringify(results));
    } catch {
      // Storage unavailable or quota exceeded - stat just won't persist.
    }
  }

  window.PlayerProfile = {
    NAME_KEY: NAME_KEY,
    AVATAR_KEY: AVATAR_KEY,
    AVATAR_THUMB_KEY: AVATAR_THUMB_KEY,
    MATCH_COUNTS_KEY: MATCH_COUNTS_KEY,
    GAME_RESULTS_KEY: GAME_RESULTS_KEY,
    getName: getName,
    setName: setName,
    getAvatar: getAvatar,
    getAvatarThumb: getAvatarThumb,
    setAvatar: setAvatar,
    getMatchTotal: getMatchTotal,
    getMostPlayed: getMostPlayed,
    getWins: getWins,
    getLosses: getLosses,
    recordGameResult: recordGameResult
  };
})();
