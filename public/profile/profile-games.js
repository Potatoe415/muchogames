// Per-game wins/losses for a Google-signed-in player (`muchogames_game_stats`
// via POST /api/profile `game-stats`). Hidden when signed out, when the
// request fails, or when nothing has been recorded per game yet.
const HUB_CONFIG_URL = "/hub-config.json";

const COPY = {
  fr: {
    title: "Mes résultats par jeu",
    wins: "V",
    losses: "D",
    best: "Record",
    lastPlayed: "Dernière partie"
  },
  en: {
    title: "My results by game",
    wins: "W",
    losses: "L",
    best: "Best",
    lastPlayed: "Last played"
  },
  es: {
    title: "Mis resultados por juego",
    wins: "V",
    losses: "D",
    best: "Récord",
    lastPlayed: "Última partida"
  }
};

const breakdown = { games: [], titles: {} };

export async function initGameBreakdown(idToken, lang) {
  if (!idToken) return;
  const [games, titles] = await Promise.all([
    fetchGameStats(idToken),
    fetchTitles()
  ]);
  breakdown.games = games;
  breakdown.titles = titles;
  renderGameBreakdown(lang);
}

export function renderGameBreakdown(lang) {
  const section = document.querySelector('[data-id="profile-games-section"]');
  const list = document.querySelector('[data-id="profile-games-list"]');
  if (!section || !list) return;

  const copy = COPY[lang] || COPY.fr;
  section.hidden = breakdown.games.length === 0;
  document.querySelector('[data-id="profile-games-title"]').textContent =
    copy.title;
  list.replaceChildren(
    ...breakdown.games.map((game) => buildGameRow(game, copy, lang))
  );
}

function buildGameRow(game, copy, lang) {
  const row = document.createElement("li");
  row.className = "profile-game";
  row.dataset.id = `profile-game-${game.gameId}`;

  const name = document.createElement("span");
  name.className = "profile-game-name";
  name.textContent = breakdown.titles[game.gameId] || game.gameId;

  const record = document.createElement("span");
  record.className = "profile-game-record";
  record.textContent = `${copy.wins} ${game.wins} · ${copy.losses} ${game.losses} · ${winRate(game)}`;

  const details = document.createElement("span");
  details.className = "profile-game-details";
  details.textContent = [
    Number.isInteger(game.bestScore) ? `${copy.best} ${game.bestScore}` : "",
    `${copy.lastPlayed} ${formatDate(game.lastPlayedAt, lang)}`
  ]
    .filter(Boolean)
    .join(" · ");

  row.append(name, record, details);
  return row;
}

function winRate({ wins, losses }) {
  const played = wins + losses;
  return played > 0 ? `${Math.round((wins / played) * 100)} %` : "—";
}

function formatDate(iso, lang) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(lang, { day: "numeric", month: "short" });
}

async function fetchGameStats(idToken) {
  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "game-stats", idToken })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.games) ? data.games : [];
  } catch {
    return [];
  }
}

async function fetchTitles() {
  try {
    const response = await fetch(HUB_CONFIG_URL);
    if (!response.ok) return {};
    const games = await response.json();
    return Object.fromEntries(
      (Array.isArray(games) ? games : [])
        .filter((game) => game?.id)
        .map((game) => [game.id, game.title])
    );
  } catch {
    return {};
  }
}
