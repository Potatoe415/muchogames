import {
  getStoredPlayerAvatarThumb,
  getStoredPlayerName,
  initAuthWidget,
  refreshAuthWidget
} from "./auth.js";
import { trackGameLaunch } from "./shared/js/analytics.js";
import { APP_VERSION } from "./version.js";

const CONFIG_URL = "/hub-config.json";
const GRID_ID = "games-grid";
const TABS_ID = "category-tabs";
const LANG_SWITCHER_ID = "lang-switcher";
const LANG_STORAGE_KEY = "bergamots-lang";

const LANGS = ["fr", "en", "es"];
const CATEGORY_ORDER = ["tous", "cartesdes", "mots", "autres"];
const CATEGORY_LABELS = {
  fr: {
    tous: "Tous",
    cartesdes: "Cartes & dés",
    mots: "Mots",
    autres: "Autres"
  },
  en: {
    tous: "All",
    cartesdes: "Cards & Dice",
    mots: "Words",
    autres: "Other"
  },
  es: {
    tous: "Todos",
    cartesdes: "Cartas y dados",
    mots: "Palabras",
    autres: "Otros"
  }
};

const PINNED_GAME_IDS = ["coinche", "bouilla", "president", "bataillecorse"];
const SLIDE_DURATION_MS = 220;
const SWIPE_THRESHOLD_PX = 50;

const state = {
  games: [],
  category: "tous",
  lang: readStoredLang()
};

document.addEventListener("DOMContentLoaded", () => {
  renderVersionBadge();
  initAuthWidget();
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

function renderVersionBadge() {
  const badge = document.createElement("div");
  badge.className = "app-version";
  badge.textContent = APP_VERSION;
  document.body.appendChild(badge);
}

async function initializeDashboard() {
  const gridElement = document.getElementById(GRID_ID);

  if (!gridElement) {
    throw new Error(`Élément DOM manquant : '${GRID_ID}'`);
  }

  try {
    const response = await fetch(CONFIG_URL);

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP ${response.status} lors de la lecture du fichier de configuration.`
      );
    }

    state.games = await response.json();
    persistLang(state.lang);
    renderLangSwitcher();
    renderCategoryTabs();
    renderGames();
    setupSwipeNavigation();
  } catch (error) {
    gridElement.innerHTML =
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
  renderCategoryTabs();
  refreshAuthWidget();
}

function selectCategory(category) {
  if (category === state.category) return;

  const direction =
    CATEGORY_ORDER.indexOf(category) > CATEGORY_ORDER.indexOf(state.category)
      ? "left"
      : "right";
  state.category = category;
  renderCategoryTabs();
  renderGames(direction);
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

function renderCategoryTabs() {
  const nav = document.getElementById(TABS_ID);
  if (!nav) return;

  const labels = CATEGORY_LABELS[state.lang];
  nav.innerHTML = "";

  CATEGORY_ORDER.forEach((category) => {
    const isActive = category === state.category;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab category-tab--${category}${isActive ? " is-active" : ""}`;
    button.textContent = labels[category];
    button.addEventListener("click", () => selectCategory(category));
    nav.appendChild(button);
  });
}

function renderGames(direction) {
  const gridElement = document.getElementById(GRID_ID);

  const applyContent = () => {
    const gamesInCategory =
      state.category === "tous"
        ? state.games
        : state.games.filter((game) => game.category === state.category);

    gridElement.innerHTML = "";

    if (gamesInCategory.length === 0) {
      gridElement.innerHTML =
        "<p>Aucun jeu disponible dans cette catégorie.</p>";
      return;
    }

    const fragment = document.createDocumentFragment();
    sortWithPinnedFirst(gamesInCategory).forEach((game) =>
      fragment.appendChild(createTileNode(game))
    );
    gridElement.appendChild(fragment);
  };

  if (!direction) {
    applyContent();
    return;
  }

  slideGridContent(gridElement, direction, applyContent);
}

function slideGridContent(gridElement, direction, applyContent) {
  const exitClass =
    direction === "left"
      ? "games-grid--out-to-left"
      : "games-grid--out-to-right";
  const enterFromClass =
    direction === "left"
      ? "games-grid--out-to-right"
      : "games-grid--out-to-left";

  gridElement.classList.add(exitClass);

  setTimeout(() => {
    applyContent();
    gridElement.classList.remove(exitClass);
    gridElement.classList.add("games-grid--no-transition", enterFromClass);

    requestAnimationFrame(() => {
      gridElement.classList.remove("games-grid--no-transition");
      requestAnimationFrame(() => {
        gridElement.classList.remove(enterFromClass);
      });
    });
  }, SLIDE_DURATION_MS);
}

function setupSwipeNavigation() {
  let touchStartX = null;
  let touchStartY = null;

  document.body.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  document.body.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;

      if (
        Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
        Math.abs(deltaX) < Math.abs(deltaY)
      )
        return;

      const currentIndex = CATEGORY_ORDER.indexOf(state.category);
      const targetIndex = currentIndex + (deltaX < 0 ? 1 : -1);

      if (targetIndex < 0 || targetIndex >= CATEGORY_ORDER.length) return;

      selectCategory(CATEGORY_ORDER[targetIndex]);
    },
    { passive: true }
  );
}

function sortWithPinnedFirst(games) {
  const pinned = PINNED_GAME_IDS.map((id) =>
    games.find((game) => game.id === id)
  ).filter(Boolean);
  const rest = games.filter((game) => !PINNED_GAME_IDS.includes(game.id));
  return [...pinned, ...rest];
}

function createTileNode(game) {
  const anchor = document.createElement("a");
  anchor.href = determineTargetUrl(game);
  anchor.className = "game-tile";
  anchor.dataset.id = `hub-tile-${game.id}`;
  anchor.addEventListener("click", (event) => {
    trackGameLaunch(game.id);
    const bridge = window.MuchogamesProfileResults;
    if (!bridge?.isProfileAppLaunch(anchor.href) || !bridge.readLiveIdToken())
      return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    bridge.openWithProfileCode(anchor.href, anchor.target === "_blank");
  });

  if (isExternalLaunch(game.launch) && !game.sameTab) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }

  const media = document.createElement("div");
  media.className = "game-tile__media";

  const img = document.createElement("img");
  img.className = "game-tile__thumb";
  img.src = game.thumbnail || "";
  img.alt = `Miniature de ${game.title}`;
  img.loading = "lazy";
  attachThumbnailFallback(img);

  const overlay = document.createElement("div");
  overlay.className = "game-tile__overlay";

  const title = document.createElement("div");
  title.className = "game-tile__title";
  title.textContent = game.title;

  media.appendChild(img);
  media.appendChild(overlay);
  media.appendChild(title);
  anchor.appendChild(media);

  return anchor;
}

function attachThumbnailFallback(img) {
  img.onerror = () => {
    const currentSource = typeof img.src === "string" ? img.src : "";
    const hasTriedPngFallback = img.dataset.triedPngFallback === "true";

    if (!hasTriedPngFallback && currentSource.endsWith(".jpg")) {
      img.dataset.triedPngFallback = "true";
      img.src = currentSource.replace(/\.jpg$/, ".png");
      return;
    }

    img.src = generateBlackFallbackSVG();
  };
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
          getStoredPlayerAvatarThumb()
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
// their own identity UI; see docs/TECH.md "Player identity".
function appendLaunchParams(url, lang, name, avatarThumb) {
  const params = new URLSearchParams({ lang });
  if (name) {
    params.set("name", name);
  }
  if (avatarThumb) {
    params.set("avatar", avatarThumb);
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.toString()}`;
}

function generateBlackFallbackSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" fill="#111"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="14">Image Manquante</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Enregistrement du Service Worker pour la PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("ServiceWorker registration failed:", error);
    });
  });
}
