/* Same-origin bridge between the hub profile and Yatzy. Coinchapp and
   Tranquil live on other origins, so they never read this localStorage —
   they receive a one-time launch code instead (see hub.js). */
(function () {
  const TOKEN_KEY = "bergamots-google-idtoken";
  const MIGRATED_KEY = "bergamots-results-migrated";
  const PROFILE_HOSTS = ["coinchapp.vercel.app", "tranquil-woad.vercel.app"];
  let migration = null;

  function readLiveIdToken() {
    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      return token && !isJwtExpired(token) ? token : "";
    } catch {
      return "";
    }
  }

  function isJwtExpired(jwt) {
    try {
      const payload = JSON.parse(
        atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return !payload.exp || Date.now() / 1000 >= payload.exp;
    } catch {
      return true;
    }
  }

  function migrateLocalResultsOnce() {
    if (!migration)
      migration = runMigration().finally(() => {
        migration = null;
      });
    return migration;
  }

  async function runMigration() {
    const empty = { wins: 0, losses: 0 };
    try {
      if (localStorage.getItem(MIGRATED_KEY) === "1") return empty;
    } catch {
      return empty;
    }
    const idToken = readLiveIdToken();
    if (!idToken || !window.PlayerProfile) return empty;
    const wins = window.PlayerProfile.getWins();
    const losses = window.PlayerProfile.getLosses();
    try {
      localStorage.setItem(MIGRATED_KEY, "1");
    } catch {
      return empty;
    }
    if (wins === 0 && losses === 0) return empty;
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-results", idToken, wins, losses })
      });
      if (!response.ok) throw new Error("add-failed");
      return { wins, losses };
    } catch {
      try {
        localStorage.removeItem(MIGRATED_KEY);
      } catch {
        /* ignore */
      }
      return empty;
    }
  }

  function recordSharedResult(won) {
    const idToken = readLiveIdToken();
    if (!idToken) return;
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record-result",
        idToken,
        won: Boolean(won)
      })
    }).catch(() => {});
  }

  function isProfileAppLaunch(href) {
    try {
      return PROFILE_HOSTS.includes(new URL(href, window.location.origin).host);
    } catch {
      return false;
    }
  }

  async function openWithProfileCode(href, newTab) {
    const target = await hrefWithLaunchCode(href);
    if (newTab) window.open(target, "_blank", "noopener,noreferrer");
    else window.location.assign(target);
  }

  async function hrefWithLaunchCode(href) {
    const idToken = readLiveIdToken();
    if (!idToken) return href;
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "launch-code", idToken }),
        signal: AbortSignal.timeout(2500)
      });
      if (!response.ok) return href;
      const data = await response.json();
      if (!data || typeof data.code !== "string" || !data.code) return href;
      const url = new URL(href);
      url.searchParams.set("profileCode", data.code);
      return url.toString();
    } catch {
      return href;
    }
  }

  window.MuchogamesProfileResults = {
    migrateLocalResultsOnce,
    recordSharedResult,
    readLiveIdToken,
    isProfileAppLaunch,
    openWithProfileCode
  };
})();
