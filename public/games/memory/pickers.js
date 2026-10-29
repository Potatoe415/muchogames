import { BACKS, THEME_IDS, backUrl, faceUrl } from "./faces.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function thumb(url) {
  const img = document.createElement("img");
  img.src = url;
  img.alt = "";
  img.draggable = false;
  img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function pickButton(className, id, url) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.id = id;
  button.setAttribute("aria-pressed", "false");
  button.append(thumb(url));
  return button;
}

function themeButton(themeId) {
  const button = pickButton(
    "memory-theme",
    `memory-theme-${themeId}`,
    faceUrl(themeId, "01")
  );
  const label = document.createElement("span");
  label.className = "memory-theme-name";
  label.dataset.i18n = `theme-${themeId}`;
  button.append(label);
  return button;
}

function backButton(backId) {
  return pickButton("memory-back", `memory-back-${backId}`, backUrl(backId));
}

export function mountPickers() {
  const themes = $("memory-theme-list");
  themes.replaceChildren(...THEME_IDS.map(themeButton));
  themes.style.setProperty("--theme-rows", Math.ceil(THEME_IDS.length / 3));
  $("memory-back-list").replaceChildren(...BACKS.map(backButton));
}
