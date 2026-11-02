// Favorite and recently launched games, per-browser localStorage. Read by
// the hub's Home rows and the library's "Favorites" pill.
const RECENT_KEY = "muchogames-recent-games";
const FAVORITES_KEY = "muchogames-favorite-games";
const MAX_RECENT = 8;

const COPY = {
  fr: { add: "Ajouter aux favoris", remove: "Retirer des favoris" },
  en: { add: "Add to favorites", remove: "Remove from favorites" },
  es: { add: "Añadir a favoritos", remove: "Quitar de favoritos" }
};

function readIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage unavailable — the shelf just won't remember this.
  }
}

export function recordRecentGame(id) {
  const recent = readIds(RECENT_KEY).filter((other) => other !== id);
  writeIds(RECENT_KEY, [id, ...recent].slice(0, MAX_RECENT));
}

export function isFavorite(id) {
  return readIds(FAVORITES_KEY).includes(id);
}

function toggleFavorite(id) {
  const favorites = readIds(FAVORITES_KEY);
  const next = favorites.includes(id)
    ? favorites.filter((other) => other !== id)
    : [...favorites, id];
  writeIds(FAVORITES_KEY, next);
  return next.includes(id);
}

function gamesByIds(games, ids) {
  const byId = new Map(games.map((game) => [game.id, game]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/** Most recently launched first. */
export function recentGames(games) {
  return gamesByIds(games, readIds(RECENT_KEY));
}

/** In the order they were starred. */
export function favoriteGames(games) {
  return gamesByIds(games, readIds(FAVORITES_KEY));
}

/** Star toggle placed next to a game link (outside the <a>). */
export function createFavoriteButton(game, lang, onChange) {
  const copy = COPY[lang] || COPY.fr;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "game-row__favorite";
  button.dataset.id = `hub-favorite-${game.id}`;

  const paint = (favorite) => {
    button.textContent = favorite ? "★" : "☆";
    button.classList.toggle("is-favorite", favorite);
    button.setAttribute("aria-pressed", String(favorite));
    button.setAttribute(
      "aria-label",
      `${favorite ? copy.remove : copy.add} : ${game.title}`
    );
  };

  paint(isFavorite(game.id));
  button.addEventListener("click", () => {
    paint(toggleFavorite(game.id));
    onChange();
  });
  return button;
}
