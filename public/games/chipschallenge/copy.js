// Writes the page copy in the current language: static [data-i18n] text and
// labels, rules, start screen ("Reprendre", level list, total), title card
// and the death / win dialogs.
import { rulesHtml } from "./i18n.js";
import { LEVELS } from "./levels.js";
import { readMatch } from "./save.js";
import { fillList, renderLevelList, totalLine, winLines } from "./screens.js";

/** @returns {HTMLElement} */
export const $ = (id) => document.querySelector(`[data-id="${id}"]`);
/** @returns {NodeListOf<HTMLElement>} */
export const $$ = (selector) => document.querySelectorAll(selector);

export function renderTitleCard(page, t) {
  const def = LEVELS[page.level - 1];
  if (!def) return;
  $("chips-title-level").textContent =
    `${t("levelCard", { number: page.level })} · ${def.title}`;
  $("chips-title-password").textContent = t("passwordCard", {
    code: def.password
  });
}

export function renderDialogs(page, t) {
  if (page.death) $("chips-death-text").textContent = t(`death_${page.death}`);
  if (page.result) {
    fillList($("chips-win-lines"), winLines(page.result, page.progress, t));
    $("chips-next-button").hidden = page.result.last;
  }
}

function renderStart(page, t) {
  const saved = readMatch();
  const resume = $("chips-continue-button");
  resume.hidden = !saved;
  if (saved) resume.textContent = t("continue", { number: saved.level });
  renderLevelList($("chips-level-list"), page.progress, t);
  $("chips-total-score").textContent = totalLine(page.progress, t);
}

export function applyLanguage(page, t) {
  document.documentElement.lang = page.lang;
  $$("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  $$("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  $$("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
  $("chips-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("chips-sound-toggle");
  sound.textContent = t(page.muted ? "soundOff" : "soundOn");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderStart(page, t);
  renderTitleCard(page, t);
  renderDialogs(page, t);
}
