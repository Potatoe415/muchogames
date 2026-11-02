// The two game cards of the hub: a small square icon (Home rows) and a
// compact list row (library). Both wrap the anchor from hub.js's
// createLaunchAnchor, so every launch path stays the same.
import { createNewBadge } from "./hub-catalog.js";
import { createFavoriteButton } from "./hub-shelf.js";
import {
  readDuration,
  readPlayers,
  tagLabel,
  timeOf,
  typesOf
} from "./hub-taxonomy.js";

const QUICK_COPY = { fr: "Rapide", en: "Quick", es: "Rápido" };

function createThumb(game, className) {
  const img = document.createElement("img");
  img.className = className;
  img.dataset.game = game.id;
  img.src = game.thumbnail || "";
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  attachThumbnailFallback(img);
  return img;
}

function createQuickBadge(lang) {
  const badge = document.createElement("span");
  badge.className = "game-icon__quick";
  badge.textContent = "⚡";
  badge.title = QUICK_COPY[lang] || QUICK_COPY.fr;
  return badge;
}

/** Square icon + title under it. `section` keeps data-id unique per row. */
export function createIconTile(game, section, { lang, settings, anchor }) {
  anchor.className = "game-icon";
  anchor.dataset.id = `hub-tile-${section}-${game.id}`;

  const media = document.createElement("span");
  media.className = "game-icon__media";
  media.appendChild(createThumb(game, "game-icon__thumb"));
  if (timeOf(game) === "rapide") media.appendChild(createQuickBadge(lang));
  const badge = createNewBadge(game, settings, lang);
  if (badge) media.appendChild(badge);

  const title = document.createElement("span");
  title.className = "game-icon__title";
  title.textContent = game.title;

  anchor.append(media, title);
  return anchor;
}

function metaText(game, lang) {
  const players = readPlayers(game);
  const duration = readDuration(game);
  return [
    duration ? `⏱ ${duration} min` : "",
    players
      ? `👥 ${players.min === players.max ? players.min : `${players.min}–${players.max}`}`
      : "",
    ...typesOf(game).map((type) => tagLabel(type, lang))
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 48 px icon, title, duration / players / types, favorite star. */
export function createListRow(
  game,
  { lang, settings, anchor, onFavoriteChange }
) {
  const row = document.createElement("div");
  row.className = "game-row";

  anchor.className = "game-row__link";
  anchor.dataset.id = `hub-list-${game.id}`;

  const body = document.createElement("span");
  body.className = "game-row__body";
  const title = document.createElement("span");
  title.className = "game-row__title";
  title.textContent = game.title;
  const badge = createNewBadge(game, settings, lang);
  if (badge) title.appendChild(badge);
  const meta = document.createElement("span");
  meta.className = "game-row__meta";
  meta.textContent = metaText(game, lang);
  body.append(title, meta);

  anchor.append(createThumb(game, "game-row__thumb"), body);
  row.append(anchor, createFavoriteButton(game, lang, onFavoriteChange));
  return row;
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

    img.onerror = null;
    img.src = generateBlackFallbackSVG();
  };
}

function generateBlackFallbackSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="#111"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
