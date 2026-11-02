import {
  getStoredPlayerAvatarThumb,
  getStoredPlayerName,
  initAuthWidget,
  refreshAuthWidget
} from "./auth.js";
import {
  fetchHubSettings,
  pinnedIds,
  renderAnnouncement,
  visibleGames
} from "./hub-catalog.js";
import {
  initCoins,
  refillCoins,
  renderCoinBadge,
  spendLaunchCoin
} from "./hub-coins.js";
import { renderHome } from "./hub-home.js";
import { renderLibrary, renderPills } from "./hub-library.js";
import { initNav, renderNav } from "./hub-nav.js";
import { onRouteChange, readRoute, writeRoute } from "./hub-route.js";
import {
  favoriteGames,
  isFavorite,
  recentGames,
  recordRecentGame
} from "./hub-shelf.js";
import {
  enableHorizontalWheel,
  fetchPopular,
  localPopularMap,
  mountSortControl,
  persistSort,
  popularMap,
  readStoredSort,
  revealActiveTab,
  sortGames
} from "./hub-sort.js";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  matchesFilters,
  matchesQuery
} from "./hub-taxonomy.js";
import { createIconTile, createListRow } from "./hub-tiles.js";
import { APP_VERSION } from "./version.js";

const CONFIG_URL = "/hub-config.json";
const HOME_ID = "hub-home";
const LIBRARY_ID = "hub-library";
const PILLS_ID = "hub-pills";
const SORT_ID = "hub-sort";
const LANG_SWITCHER_ID = "lang-switcher";
const LANG_STORAGE_KEY = "bergamots-lang";

const LANGS = ["fr", "en", "es"];

const FEEDBACK_LABELS = {
  fr: "Signaler un problème",
  en: "Report a problem",
  es: "Informar de un problema"
};

const PINNED_GAME_IDS = ["coinche", "bouilla", "president", "bataillecorse"];

const state = {
  games: [],
  settings: null,
  lang: readStoredLang(),
  sort: readStoredSort(),
  popular: new Map(),
  ...readRoute()
};

document.addEventListener("DOMContentLoaded", () => {
  renderVersionBadge();
  renderForceRefreshButton();
  renderFeedbackButton();
  openFeedbackFromUrl();
  initAuthWidget();
  refreshCoins();
  window.addEventListener("muchogames-auth-changed", refreshCoins);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refreshCoins();
  });
  initializeDashboard();
  setupHubShareButton();
  window.MuchogamesProfileResults?.migrateLocalResultsOnce();
});

function setupHubShareButton() {
  const shareBtn = document.getElementById("hub-share-button");
  if (!shareBtn) return;

  shareBtn.addEventListener("click", async () => {
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Muchogames",
          text: "Découvre Muchogames, la plateforme de jeux de soirée multijoueurs !",
          url: url
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("Lien copié dans le presse-papier !");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Erreur lors du partage :", err);
      }
    }
  });
}

// TEMP: play-test hook. Seven fast taps on the version put today's coins
// back to 10. No player-facing feedback. Remove when testing is done.
const VERSION_REFILL_TAPS = 7;
const VERSION_REFILL_GAP_MS = 700;

function renderVersionBadge() {
  const badge = document.createElement("div");
  badge.className = "app-version";
  badge.dataset.id = "app-version";
  badge.textContent = APP_VERSION;
  badge.style.pointerEvents = "auto";
  badge.style.touchAction = "manipulation";
  let taps = 0;
  let lastTapAt = 0;
  let pending = false;
  badge.addEventListener("pointerup", (event) => {
    if (event.button !== 0 || pending) return;
    const now = Date.now();
    taps = now - lastTapAt <= VERSION_REFILL_GAP_MS ? taps + 1 : 1;
    lastTapAt = now;
    if (taps < VERSION_REFILL_TAPS) return;
    taps = 0;
    pending = true;
    refillCoins().finally(() => {
      pending = false;
      renderCoins();
    });
  });
  document.body.appendChild(badge);
}

// Drops the service-worker cache/registration and reloads from the network
// so players stuck on a stale cached shell pick up the latest deploy.
// Keeps localStorage / IndexedDB (profile, language, local scores) intact.
async function forceRefresh() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
    }
  } catch (error) {
    console.warn("Échec du nettoyage du cache :", error);
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_refresh", String(Date.now()));
  window.location.replace(url.toString());
}

function renderForceRefreshButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "force-refresh-button";
  button.id = "force-refresh-button";
  button.dataset.id = "force-refresh-button";
  button.textContent = "Actualiser";
  button.title = "Forcer la mise à jour de l'application";
  button.addEventListener("click", forceRefresh);
  document.body.appendChild(button);
}

function renderFeedbackButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hub-feedback-button";
  button.id = "hub-feedback-button";
  button.dataset.id = "hub-feedback-button";
  button.textContent = FEEDBACK_LABELS[state.lang] || FEEDBACK_LABELS.fr;
  button.addEventListener("click", () => window.MuchogamesFeedback?.open());
  document.body.appendChild(button);
}

// Games on other origins (coinchapp, Tranquil) link to `/?feedback=<gameId>`
// rather than posting to /api/feedback cross-origin.
function openFeedbackFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("feedback")) return;
  const gameId = url.searchParams.get("feedback") || "";
  url.searchParams.delete("feedback");
  window.history.replaceState(null, "", url.toString());
  window.MuchogamesFeedback?.open(
    /^[a-z0-9-]{1,64}$/.test(gameId) ? { gameId } : {}
  );
}

async function initializeDashboard() {
  const homeElement = document.getElementById(HOME_ID);

  if (!homeElement) {
    throw new Error(`Élément DOM manquant : '${HOME_ID}'`);
  }

  try {
    const settingsRequest = fetchHubSettings();
    const response = await fetch(CONFIG_URL);

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP ${response.status} lors de la lecture du fichier de configuration.`
      );
    }

    state.games = await response.json();
    state.settings = await settingsRequest;
    persistLang(state.lang);
    renderLangSwitcher();
    renderHubAnnouncement();
    initNav({ onView: selectView, onQuery: searchGames });
    onRouteChange((route) => {
      applyRoute(route);
      render();
    });
    render();
    loadPopularRanking();
  } catch (error) {
    homeElement.innerHTML =
      "<p>Erreur critique : Impossible de charger la liste des jeux.</p>";
    console.error("Échec de l'initialisation du Dashboard :", error);
  }
}

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return LANGS.includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

function persistLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage unavailable (private mode, etc.) — language just won't persist.
  }
}

function selectLang(lang) {
  state.lang = lang;
  persistLang(lang);
  renderLangSwitcher();
  renderHubAnnouncement();
  render();
  renderCoins();
  refreshAuthWidget();
  const feedbackButton = document.getElementById("hub-feedback-button");
  if (feedbackButton) feedbackButton.textContent = FEEDBACK_LABELS[lang];
}

function renderCoins() {
  renderCoinBadge(document.getElementById("hub-coins"), state.lang);
}

// Shows the last known count at once, then the server balance when it
// arrives. Also on a back/forward-cache return from a game, where matches may
// have spent coins in the meantime.
function refreshCoins() {
  initCoins().finally(renderCoins);
  renderCoins();
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) refreshCoins();
});

function renderHubAnnouncement() {
  renderAnnouncement(
    document.getElementById("hub-announcement"),
    state.settings,
    state.lang
  );
}

function applyRoute(route) {
  state.view = route.view;
  state.query = route.query;
  state.filters = route.filters;
}

function currentRoute() {
  return { view: state.view, query: state.query, filters: state.filters };
}

// A new view or filter scrolls back up to the bar when the page is below it,
// so "See all" from a low Home row shows the start of the list.
function navigate(route, { replace = false } = {}) {
  applyRoute(route);
  writeRoute(route, { replace });
  render();
  const main = document.querySelector(".hub-main");
  if (!replace && main && window.scrollY > main.offsetTop) {
    window.scrollTo({ top: main.offsetTop });
  }
}

function selectView(view) {
  if (view === state.view) return;
  navigate({ view, query: "", filters: { ...EMPTY_FILTERS } });
}

// The first letter typed on Home opens the library (one history entry);
// the following ones only update the URL.
function searchGames(query) {
  navigate(
    { ...currentRoute(), view: "library", query },
    { replace: state.view === "library" }
  );
}

function render() {
  const library = state.view === "library";
  renderNav({
    lang: state.lang,
    view: state.view,
    query: state.query,
    total: visibleGames(state.games, state.settings).length
  });
  document.getElementById(HOME_ID).hidden = library;
  document.getElementById(LIBRARY_ID).hidden = !library;
  document.getElementById(PILLS_ID).hidden = !library;
  document.getElementById(SORT_ID).hidden = !library;
  if (library) renderLibraryView();
  else renderHomeView();
}

function renderHomeView() {
  const games = visibleGames(state.games, state.settings);
  renderHome(document.getElementById(HOME_ID), {
    sorted: sortedGames(games),
    rows: {
      recent: recentGames(games),
      favorites: favoriteGames(games),
      featured: featuredGames(games)
    },
    lang: state.lang,
    tile: (game, section) =>
      createIconTile(game, section, {
        lang: state.lang,
        settings: state.settings,
        anchor: createLaunchAnchor(game)
      }),
    onSeeAll: (filters) => navigate({ view: "library", query: "", filters })
  });
}

function renderLibraryView() {
  const pills = document.getElementById(PILLS_ID);
  renderPills(pills, {
    filters: state.filters,
    lang: state.lang,
    onChange: (filters) => navigate({ ...currentRoute(), filters })
  });
  enableHorizontalWheel(pills);
  revealActiveTab(pills);
  mountSortControl(document.getElementById(SORT_ID), {
    lang: state.lang,
    sort: state.sort,
    onChange: selectSort
  });

  const games = sortedGames(visibleGames(state.games, state.settings)).filter(
    (game) =>
      matchesFilters(game, state.filters, isFavorite) &&
      matchesQuery(game, state.query)
  );
  renderLibrary(document.getElementById(LIBRARY_ID), {
    games,
    narrowed: activeFilterCount(state.filters) > 0 || Boolean(state.query),
    lang: state.lang,
    row: (game) =>
      createListRow(game, {
        lang: state.lang,
        settings: state.settings,
        anchor: createLaunchAnchor(game),
        onFavoriteChange: render
      }),
    onClear: () =>
      navigate({ view: "library", query: "", filters: { ...EMPTY_FILTERS } })
  });
}

function renderLangSwitcher() {
  const wrap = document.getElementById(LANG_SWITCHER_ID);
  if (!wrap) return;

  wrap.innerHTML = "";
  wrap.classList.remove("is-open");

  const activeFlag = createLangFlagButton(state.lang, true);
  activeFlag.addEventListener("click", () => wrap.classList.toggle("is-open"));
  wrap.appendChild(activeFlag);

  LANGS.filter((lang) => lang !== state.lang).forEach((lang) => {
    const optionFlag = createLangFlagButton(lang, false);
    optionFlag.addEventListener("click", () => selectLang(lang));
    wrap.appendChild(optionFlag);
  });
}

function createLangFlagButton(lang, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `lang-flag flag-${lang} ${isActive ? "lang-flag--active" : "lang-flag--option"}`;
  button.setAttribute("aria-label", lang.toUpperCase());
  return button;
}

function selectSort(sort) {
  state.sort = sort;
  persistSort(sort);
  render();
}

function loadPopularRanking() {
  fetchPopular().then((rows) => {
    const map = popularMap(rows);
    if (map.size === 0) return;
    state.popular = map;
    if (state.sort === "popular") render();
  });
}

function sortedGames(games) {
  if (!state.sort) return sortWithPinnedFirst(games);
  const popular = state.popular.size > 0 ? state.popular : localPopularMap();
  return sortGames(games, state.sort, popular);
}

function featuredGames(games) {
  return pinnedIds(state.settings, PINNED_GAME_IDS)
    .map((id) => games.find((game) => game.id === id))
    .filter(Boolean);
}

function sortWithPinnedFirst(games) {
  const pinned = featuredGames(games);
  return [...pinned, ...games.filter((game) => !pinned.includes(game))];
}

// Every way of launching a game goes through here: same URL params, recents, profile hand-off, and the
// daily coin for `coinPolicy: "launch"` games (every other game charges per
// match itself).
function createLaunchAnchor(game) {
  const anchor = document.createElement("a");
  anchor.href = determineTargetUrl(game);
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    const newTab = anchor.target === "_blank" || event.metaKey || event.ctrlKey;
    launchGame(game, anchor.href, newTab);
  });

  if (isExternalLaunch(game.launch) && !game.sameTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }

  return anchor;
}

let launchInProgress = false;

// A new-tab launch opens its tab right away, while the click still counts as
// a user gesture: popup blockers would refuse a window.open made after the
// coin round trip. The tab is closed again if the player is out of coins.
async function launchGame(game, href, newTab) {
  if (launchInProgress) return;
  launchInProgress = true;
  const tab = newTab ? window.open("about:blank", "_blank") : null;
  if (tab) tab.opener = null;
  try {
    if (game.coinPolicy === "launch") {
      const allowed = await spendLaunchCoin(game.id);
      renderCoins();
      if (!allowed) {
        tab?.close();
        window.MuchogamesMatch?.showOutOfCoins();
        return;
      }
    }
    recordRecentGame(game.id);
    openGame(href, newTab, tab);
  } finally {
    launchInProgress = false;
  }
}

function openGame(href, newTab, tab) {
  const bridge = window.MuchogamesProfileResults;
  if (bridge?.isProfileAppLaunch(href) && bridge.readLiveIdToken()) {
    bridge.openWithProfileCode(href, newTab, tab);
    return;
  }
  if (tab) {
    tab.location.href = href;
    return;
  }
  if (newTab) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(href);
}

function isExternalLaunch(launchUrl) {
  if (!launchUrl || typeof launchUrl !== "string") return false;
  return launchUrl.startsWith("http://") || launchUrl.startsWith("https://");
}

function determineTargetUrl(game) {
  if (game.launch) {
    return isExternalLaunch(game.launch)
      ? appendLaunchParams(
          game.launch,
          state.lang,
          getStoredPlayerName(),
          getStoredPlayerAvatarThumb(),
          game.source ? window.MuchogamesMatch?.deviceId() : ""
        )
      : game.launch;
  }
  if (game.type === "custom" && game.indexPath) {
    return game.indexPath;
  }
  return `./wordplayer.html?game=${game.id}`;
}

// External games run in a different origin, so `localStorage` cannot be
// shared with them — the player's name, language, and a tiny JPEG avatar
// thumb travel as URL params. Receiving games only use them to pre-fill
// their own identity UI; see docs/TECH.md "Player identity". `deviceId`
// (colocated apps only) lets them spend from the same anonymous coin counter
// (docs/PLATFORM_RULES.md).
function appendLaunchParams(url, lang, name, avatarThumb, deviceId) {
  const params = new URLSearchParams({ lang });
  if (name) {
    params.set("name", name);
  }
  if (avatarThumb) {
    params.set("avatar", avatarThumb);
  }
  if (deviceId) {
    params.set("mgDevice", deviceId);
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.toString()}`;
}

// Enregistrement du Service Worker pour la PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("ServiceWorker registration failed:", error);
    });
  });
}
