/* Canonical reader/writer for the player's Bergamots profile (name + mascot avatar),
   shared by every unbundled page under public/ (the profile page itself,
   and any custom game — Yatzy is the first). Plain global script (same
   pattern as game-header.js) so classic, non-module game scripts can use it
   via a plain <script src> tag, same as the profile page.

   auth.js (root-level, bundled by Vite for the hub only) keeps its own
   duplicated NAME_KEY constant on purpose — see docs/DECISIONS.md
   2026-09-05 — since it cannot reach files under public/ at build time. */
(function () {
  const NAME_KEY = "bergamots-player-name";
  // The avatar is always a mascot (public/mascots/<id>.webp). Stored as its id;
  // the first read picks one at random, so even an anonymous player has one.
  // Same id list as apps/coinchapp/lib/mascots.ts (separate app, duplicated).
  const MASCOT_KEY = "muchogames-player-mascot";
  const MASCOTS = [
    "badger",
    "baker",
    "basil",
    "bear",
    "beaver",
    "bike",
    "bison",
    "bitterbal",
    "bocce",
    "brie",
    "bulldog",
    "canal-house",
    "cannolo",
    "cat",
    "centurion",
    "cheese-carrier",
    "cheese",
    "clog",
    "coffee",
    "colosseum",
    "cookie",
    "cornicello",
    "cow",
    "cowboy-bear",
    "crepe",
    "croissant",
    "crown",
    "cypress",
    "deer",
    "delft-teapot",
    "delft-tile",
    "detective-badger",
    "dolphin",
    "duomo",
    "dutch-girl",
    "eagle",
    "eiffel",
    "fairy",
    "falcon",
    "fisherman",
    "fox",
    "fries",
    "friesian",
    "frog",
    "gelato",
    "ghost",
    "goat",
    "gondolier",
    "graduate-owl",
    "grapes",
    "guard",
    "hagelslag",
    "hare",
    "hedgehog",
    "heron",
    "herring",
    "houseboat",
    "kid",
    "king-lion",
    "ladybug",
    "lemon",
    "lighthouse",
    "lion",
    "liquorice",
    "little-car",
    "mandolin",
    "maremma-dog",
    "mime",
    "moka",
    "mole",
    "moon",
    "mouse",
    "murano-vase",
    "nonna",
    "oliebol",
    "olive-oil",
    "otter",
    "owl",
    "pancakes",
    "panettone",
    "phone-box",
    "pigeon",
    "pisa-tower",
    "pizza",
    "poffertjes",
    "pony",
    "poodle",
    "prairie-dog",
    "pulcinella",
    "punk-hedgehog",
    "puppet",
    "rabbit",
    "raccoon",
    "rat",
    "raven",
    "raviolo",
    "retriever",
    "robin",
    "rooster",
    "root-beer",
    "seal",
    "sheep",
    "skater",
    "snail",
    "spaghetti",
    "sparrow",
    "speculaas",
    "squirrel",
    "stork",
    "stroopwafel",
    "taxi",
    "tea-squirrel",
    "teacup",
    "tenor",
    "tiramisu",
    "tompouce",
    "tortellino",
    "tram",
    "truffle",
    "tulip",
    "uk-bulldog",
    "venice-mask",
    "vespa",
    "volcano",
    "windmill",
    "wolf"
  ];
  // Uploaded photos were replaced by mascots: drop the old (up to ~50 KB) keys.
  try {
    localStorage.removeItem("bergamots-player-avatar");
    localStorage.removeItem("bergamots-player-avatar-thumb");
  } catch {
    // Storage unavailable — nothing to clean.
  }
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

  function isMascot(id) {
    return MASCOTS.indexOf(id) >= 0;
  }

  function mascotSrc(id) {
    return "/mascots/" + id + ".webp";
  }

  /** Mascot id from a stored avatar path ("/mascots/fox.webp"), or "". */
  function mascotFromAvatarUrl(url) {
    const match = /^\/mascots\/([a-z-]+)\.webp$/.exec(url || "");
    return match && isMascot(match[1]) ? match[1] : "";
  }

  function getMascot() {
    let id = "";
    try {
      id = localStorage.getItem(MASCOT_KEY) || "";
    } catch {
      // Storage unavailable — a random mascot each page load.
    }
    if (isMascot(id)) return id;
    id = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
    setMascot(id);
    return id;
  }

  function setMascot(id) {
    if (!isMascot(id)) return;
    try {
      localStorage.setItem(MASCOT_KEY, id);
    } catch {
      // Storage unavailable — the mascot just won't persist.
    }
  }

  /** Same-origin image path of the player's mascot (never empty). */
  function getAvatar() {
    return mascotSrc(getMascot());
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
    MASCOT_KEY: MASCOT_KEY,
    MASCOTS: MASCOTS,
    MATCH_COUNTS_KEY: MATCH_COUNTS_KEY,
    GAME_RESULTS_KEY: GAME_RESULTS_KEY,
    getName: getName,
    setName: setName,
    getAvatar: getAvatar,
    getMascot: getMascot,
    setMascot: setMascot,
    mascotSrc: mascotSrc,
    mascotFromAvatarUrl: mascotFromAvatarUrl,
    getMatchTotal: getMatchTotal,
    getMostPlayed: getMostPlayed,
    getWins: getWins,
    getLosses: getLosses,
    recordGameResult: recordGameResult
  };
})();
