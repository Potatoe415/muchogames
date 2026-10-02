// Owner-edited overlay on public/hub-config.json (GET /api/hub-settings):
// hidden / pinned / "new" games and an announcement banner. Any failure —
// offline, `npm run dev` without functions, missing table — returns null and
// the hub renders the static catalog exactly as before.
const SETTINGS_URL = "/api/hub-settings";
const SETTINGS_TIMEOUT_MS = 1200;
const DISMISSED_KEY = "muchogames-dismissed-announcement";

const COPY = {
  fr: { badge: "Nouveau", dismiss: "Fermer l'annonce" },
  en: { badge: "New", dismiss: "Dismiss announcement" },
  es: { badge: "Nuevo", dismiss: "Cerrar el anuncio" }
};

export async function fetchHubSettings() {
  try {
    const response = await fetch(SETTINGS_URL, {
      signal: AbortSignal.timeout(SETTINGS_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.settings && typeof data.settings === "object"
      ? data.settings
      : null;
  } catch {
    return null;
  }
}

function idList(settings, key) {
  return Array.isArray(settings?.[key]) ? settings[key] : null;
}

export function visibleGames(games, settings) {
  const hidden = new Set(idList(settings, "hidden") || []);
  return games.filter((game) => !hidden.has(game.id));
}

export function pinnedIds(settings, fallback) {
  return idList(settings, "pinned") || fallback;
}

export function createNewBadge(game, settings, lang) {
  if (!(idList(settings, "new") || []).includes(game.id)) return null;
  const badge = document.createElement("span");
  badge.className = "game-tile__new";
  badge.dataset.id = `hub-new-badge-${game.id}`;
  badge.textContent = (COPY[lang] || COPY.fr).badge;
  return badge;
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) || "";
  } catch {
    return "";
  }
}

function announcementText(settings, lang) {
  const announcement = settings?.announcement;
  if (!announcement?.active) return "";
  return announcement[lang] || announcement.fr || "";
}

/** Dismissing remembers the exact text, so a new announcement shows again. */
export function renderAnnouncement(container, settings, lang) {
  if (!container) return;
  const text = announcementText(settings, lang);
  container.replaceChildren();
  container.hidden = !text || readDismissed() === text;
  if (container.hidden) return;

  const message = document.createElement("p");
  message.className = "hub-announcement__text";
  message.textContent = text;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "hub-announcement__close";
  close.dataset.id = "hub-announcement-dismiss";
  close.setAttribute("aria-label", (COPY[lang] || COPY.fr).dismiss);
  close.textContent = "×";
  close.addEventListener("click", () => {
    try {
      localStorage.setItem(DISMISSED_KEY, text);
    } catch {
      // Storage unavailable — it will just show again next visit.
    }
    container.hidden = true;
  });

  container.append(message, close);
}
