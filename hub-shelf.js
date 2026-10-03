// "My games" shelf above the category tabs: favorites first, then recently
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

function shelfGames(games) {
  const byId = new Map(games.map((game) => [game.id, game]));
  const ids = new Set([...readIds(FAVORITES_KEY), ...readIds(RECENT_KEY)]);
  return [...ids]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, MAX_SHELF);
}

/** `createLaunchAnchor(game)` comes from hub.js so shelf launches go through
 *  the same tracking and profile hand-off as the grid tiles. */
export function renderShelf(container, games, lang, createLaunchAnchor) {
  if (!container) return;
  const list = shelfGames(games);
  container.replaceChildren();
  container.hidden = list.length === 0;
  if (list.length === 0) return;

  const title = document.createElement("h2");
  title.className = "hub-shelf__title";
  title.dataset.id = "hub-my-games-title";
  title.textContent = (COPY[lang] || COPY.fr).title;

  const row = document.createElement("div");
  row.className = "hub-shelf__row";
  list.forEach((game) =>
    row.appendChild(createShelfTile(game, createLaunchAnchor))
  );

  container.append(title, row);
}

function createShelfTile(game, createLaunchAnchor) {
  const anchor = createLaunchAnchor(game);
  anchor.className = "hub-shelf__tile";
  anchor.dataset.id = `hub-shelf-tile-${game.id}`;

  const thumb = document.createElement("img");
  thumb.className = "hub-shelf__thumb";
  thumb.src = game.thumbnail || "";
  thumb.alt = "";
  thumb.loading = "lazy";

  const name = document.createElement("span");
  name.className = "hub-shelf__name";
  name.textContent = `${isFavorite(game.id) ? "★ " : ""}${game.title}`;

  anchor.append(thumb, name);
  return anchor;
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
