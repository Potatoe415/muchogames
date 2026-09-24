const HUB_CONFIG_URL = "/hub-config.json";
const FAVORITE_LIMIT = 5;

// `resultsOverride` ({ wins, losses }), when given, takes priority over the
// local-only PlayerProfile counter — the shared, Google-signed-in profile's
// numbers. Launch count/favorites stay local-only regardless (decision 0024).
export async function initLaunchStats(copy, resultsOverride) {
  const totalNode = document.getElementById("profile-launches-total");
  const list = document.getElementById("profile-favorites-list");
  const empty = document.getElementById("profile-favorites-empty");
  const resultsNode = document.getElementById("profile-game-results");
  if (!totalNode || !list || !empty || !window.PlayerProfile) return;

  const titles = await loadGameCatalog();
  const total = window.PlayerProfile.getLaunchTotal();
  const favorites = window.PlayerProfile.getFavoriteLaunches(FAVORITE_LIMIT);

  totalNode.textContent = formatLaunches(total, copy);
  empty.textContent = copy.favoritesEmpty;
  renderFavorites(list, empty, favorites, titles);
  renderGameResults(resultsNode, copy, resultsOverride);
}

function renderGameResults(resultsNode, copy, resultsOverride) {
  if (!resultsNode) return;
  const wins = resultsOverride
    ? resultsOverride.wins
    : window.PlayerProfile.getWins();
  const losses = resultsOverride
    ? resultsOverride.losses
    : window.PlayerProfile.getLosses();
  resultsNode.textContent = `${copy.winsLabel} ${wins} · ${copy.lossesLabel} ${losses}`;
}

function formatLaunches(count, copy) {
  if (count <= 0) return copy.launchesZero;
  if (count === 1) return copy.launchesOne;
  return copy.launchesMany.replace("{count}", String(count));
}

async function loadGameCatalog() {
  try {
    const response = await fetch(HUB_CONFIG_URL);
    if (!response.ok) return {};
    const games = await response.json();
    if (!Array.isArray(games)) return {};
    return Object.fromEntries(
      games.filter((game) => game && game.id).map((game) => [game.id, game])
    );
  } catch {
    return {};
  }
}

function renderFavorites(list, empty, favorites, catalog) {
  list.replaceChildren();
  const hasFavorites = favorites.length > 0;
  list.hidden = !hasFavorites;
  empty.hidden = hasFavorites;
  if (!hasFavorites) return;

  favorites.forEach((entry) => {
    list.appendChild(buildFavoriteItem(entry, catalog[entry.id]));
  });
}

function buildFavoriteItem(entry, game) {
  const item = document.createElement("li");
  item.className = "profile-favorite";
  item.dataset.id = `profile-favorite-${entry.id}`;

  const thumb = document.createElement("img");
  thumb.className = "profile-favorite-thumb";
  thumb.alt = "";
  if (game?.thumbnail) {
    thumb.src = game.thumbnail;
    thumb.addEventListener("error", () => thumb.remove());
    item.appendChild(thumb);
  }

  const name = document.createElement("span");
  name.className = "profile-favorite-name";
  name.textContent = game?.title || entry.id;
  item.appendChild(name);

  const count = document.createElement("span");
  count.className = "profile-favorite-count";
  count.textContent = String(entry.count);
  item.appendChild(count);

  return item;
}
