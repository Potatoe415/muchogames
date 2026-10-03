// "My games" category tab (the first one): favorites first, then recently
// launched games. Both lists are per-browser localStorage.
const RECENT_KEY = "muchogames-recent-games";
const FAVORITES_KEY = "muchogames-favorite-games";
const MAX_RECENT = 8;
const MAX_SHELF = 10;

const COPY = {
  fr: {
    title: "Mes jeux",
    add: "Ajouter aux favoris",
    remove: "Retirer des favoris"
  },
  en: {
    title: "My games",
    add: "Add to favorites",
    remove: "Remove from favorites"
  },
  es: {
    title: "Mis juegos",
    add: "Añadir a favoritos",
    remove: "Quitar de favoritos"
  }
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

/** Favorites first, then recently launched games, for the "My games" tab. */
export function shelfGames(games) {
  const byId = new Map(games.map((game) => [game.id, game]));
  const ids = new Set([...readIds(FAVORITES_KEY), ...readIds(RECENT_KEY)]);
  return [...ids]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, MAX_SHELF);
}

export function shelfLabel(lang) {
  return (COPY[lang] || COPY.fr).title;
}

/** Star toggle placed over a grid tile (outside the tile's <a>). */
export function createFavoriteButton(game, lang, onChange) {
  const copy = COPY[lang] || COPY.fr;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "game-tile__favorite";
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
