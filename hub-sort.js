// Sort control on the hub category bar. "Recent" / "oldest" use each
// game's `added` date in hub-config. "Popular" uses site-wide match
// counts from GET /api/popular, or this browser's match counts when
// that request fails (offline, `npm run dev` without the function).
const SORT_KEY = "muchogames-hub-sort";
const LOCAL_COUNTS_KEY = "muchogames-match-counts";
const POPULAR_URL = "/api/popular";
const SORTS = ["recent", "oldest", "popular"];

const COPY = {
  fr: {
    button: "Trier les jeux",
    recent: "Plus récents",
    oldest: "Moins récents",
    popular: "Plus populaires"
  },
  en: {
    button: "Sort games",
    recent: "Newest",
    oldest: "Oldest",
    popular: "Most popular"
  },
  es: {
    button: "Ordenar los juegos",
    recent: "Más recientes",
    oldest: "Menos recientes",
    popular: "Más populares"
  }
};

let sortButton = null;
let sortMenu = null;

export function readStoredSort() {
  try {
    const stored = localStorage.getItem(SORT_KEY) || "";
    return SORTS.includes(stored) ? stored : "";
  } catch {
    return "";
  }
}

export function persistSort(sort) {
  try {
    if (sort) localStorage.setItem(SORT_KEY, sort);
    else localStorage.removeItem(SORT_KEY);
  } catch {
    // Storage unavailable — the choice just won't survive a reload.
  }
}

export function sortGames(games, mode, popular) {
  const ranked = games.map((game, index) => ({ game, index }));
  ranked.sort((a, b) => compareRanked(a, b, mode, popular));
  return ranked.map((entry) => entry.game);
}

export function popularMap(rows) {
  const map = new Map();
  if (!Array.isArray(rows)) return map;
  rows.forEach((row) => {
    if (!row || typeof row.gameId !== "string") return;
    if (!Number.isFinite(row.matches)) return;
    map.set(row.gameId, row.matches);
  });
  return map;
}

export function localPopularMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_COUNTS_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return new Map();
    return popularMap(
      Object.entries(parsed).map(([gameId, matches]) => ({ gameId, matches }))
    );
  } catch {
    return new Map();
  }
}

export async function fetchPopular() {
  try {
    const response = await fetch(POPULAR_URL, {
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.ranking) ? data.ranking : [];
  } catch {
    return [];
  }
}

export function mountSortControl(container, { lang, sort, onChange }) {
  if (!container) return;
  const copy = COPY[lang] || COPY.fr;
  container.replaceChildren();
  sortButton = createSortButton(copy.button, Boolean(sort));
  sortMenu = createSortMenu(copy, sort, onChange);
  sortButton.addEventListener("click", toggleSortMenu);
  container.append(sortButton, sortMenu);
}

export function enableHorizontalWheel(nav) {
  if (!nav || nav.dataset.wheelReady === "true") return;
  nav.dataset.wheelReady = "true";
  nav.addEventListener("wheel", onTabWheel, { passive: false });
}

export function revealActiveTab(nav) {
  const active = nav.querySelector(".is-active");
  if (!active) return;
  const left = active.offsetLeft;
  const right = left + active.offsetWidth;
  if (left < nav.scrollLeft) nav.scrollLeft = left - 8;
  else if (right > nav.scrollLeft + nav.clientWidth) {
    nav.scrollLeft = right - nav.clientWidth + 8;
  }
}

function compareRanked(a, b, mode, popular) {
  if (mode === "oldest") return byAdded(a, b);
  if (mode === "popular") {
    const delta = countOf(popular, b.game.id) - countOf(popular, a.game.id);
    if (delta) return delta;
  }
  return byAdded(b, a);
}

function byAdded(a, b) {
  const delta = addedOf(a.game).localeCompare(addedOf(b.game));
  return delta || a.index - b.index;
}

function addedOf(game) {
  return typeof game.added === "string" ? game.added : "";
}

function countOf(popular, id) {
  return popular.get(id) || 0;
}

function createSortButton(label, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `hub-sort__button${active ? " is-active" : ""}`;
  button.dataset.id = "hub-sort-button";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.appendChild(filterIcon());
  return button;
}

function createSortMenu(copy, sort, onChange) {
  const menu = document.createElement("div");
  menu.className = "hub-sort__menu";
  menu.dataset.id = "hub-sort-menu";
  menu.hidden = true;
  menu.setAttribute("role", "menu");
  SORTS.forEach((id) => menu.appendChild(sortOption(copy, id, sort, onChange)));
  return menu;
}

function sortOption(copy, id, sort, onChange) {
  const option = document.createElement("button");
  option.type = "button";
  option.className = `hub-sort__option${sort === id ? " is-active" : ""}`;
  option.dataset.id = `hub-sort-${id}`;
  option.setAttribute("role", "menuitemradio");
  option.setAttribute("aria-checked", sort === id ? "true" : "false");
  option.textContent = copy[id];
  option.addEventListener("click", () => onChange(sort === id ? "" : id));
  return option;
}

function toggleSortMenu() {
  if (!sortMenu || !sortButton) return;
  const open = sortMenu.hidden;
  sortMenu.hidden = !open;
  sortButton.setAttribute("aria-expanded", open ? "true" : "false");
}

function closeSortMenu() {
  if (!sortMenu || sortMenu.hidden) return;
  sortMenu.hidden = true;
  sortButton?.setAttribute("aria-expanded", "false");
}

function filterIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2.4");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("d", "M4 5h16l-6.2 7.2V19l-3.6 1.6v-8.4L4 5z");
  svg.appendChild(path);
  return svg;
}

function onTabWheel(event) {
  const nav = event.currentTarget;
  if (nav.scrollWidth <= nav.clientWidth) return;
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  nav.scrollLeft += event.deltaY;
  event.preventDefault();
}

document.addEventListener("pointerdown", (event) => {
  if (!sortMenu || sortMenu.hidden) return;
  if (!(event.target instanceof Node)) return;
  if (sortButton?.contains(event.target) || sortMenu.contains(event.target)) {
    return;
  }
  closeSortMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSortMenu();
});
