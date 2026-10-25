import { GRID_IDS, LEVELS, MODES } from "./config.js";
import { BACKS, THEME_IDS } from "./faces.js";
import { rulesHtml, translate } from "./i18n.js";
import { paintBoard } from "./view.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const text = (page, key, vars) => translate(page.lang, key, vars);

function mark(id, on) {
  const button = $(id);
  button.classList.toggle("is-selected", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
}

function paintPickers(page) {
  THEME_IDS.forEach((theme) =>
    mark(`memory-theme-${theme}`, page.setup.theme === theme)
  );
  BACKS.forEach((back) => {
    mark(`memory-back-${back}`, page.setup.back === back);
    $(`memory-back-${back}`).setAttribute(
      "aria-label",
      text(page, "backN", { n: Number(back) })
    );
  });
}

export function paintSetup(page) {
  paintPickers(page);
  MODES.forEach((mode) =>
    mark(`memory-mode-${mode}`, page.setup.mode === mode)
  );
  LEVELS.forEach((level) =>
    mark(`memory-level-${level}`, page.setup.difficulty === level)
  );
  GRID_IDS.forEach((grid) =>
    mark(`memory-grid-${grid}`, page.setup.grid === grid)
  );
  $("memory-difficulty").hidden = page.setup.mode !== "bot";
  const start = $("memory-start-button");
  start.disabled = page.starting;
  start.textContent = text(page, page.starting ? "loading" : "start");
  $("memory-app").dataset.loading = page.starting ? "true" : "false";
}

function names(page, state) {
  if (state.config.mode === "solo") {
    return { top: text(page, "solo"), bottom: text(page, "you") };
  }
  if (state.config.mode === "bot") {
    return { top: text(page, "robot"), bottom: text(page, "you") };
  }
  return { top: text(page, "player2"), bottom: text(page, "player1") };
}

function topScore(page, state) {
  if (state.config.mode !== "solo") return String(state.scores[1]);
  const left = state.cards.length / 2 - state.scores[0];
  return text(page, "left", { n: left });
}

export function paintMute(page) {
  const button = $("memory-mute-button");
  button.dataset.muted = page.muted ? "true" : "false";
  button.setAttribute("aria-pressed", page.muted ? "true" : "false");
  button.setAttribute("aria-label", text(page, page.muted ? "unmute" : "mute"));
}

function paintBars(page, state) {
  const label = names(page, state);
  const live = state.phase !== "GAME_OVER";
  $("memory-p1-name").textContent = label.bottom;
  $("memory-p2-name").textContent = label.top;
  $("memory-p1-score").textContent = String(state.scores[0]);
  $("memory-p2-score").textContent = topScore(page, state);
  $("memory-player-one").dataset.active =
    live && state.active === 0 ? "true" : "false";
  $("memory-player-two").dataset.active =
    live && state.active === 1 ? "true" : "false";
  $("memory-play").dataset.active = String(state.active);
}

function endTitle(page, state) {
  if (state.config.mode === "solo") return text(page, "soloWin");
  if (state.winner === "tie") return text(page, "tie");
  if (state.config.mode === "bot") {
    return text(page, state.winner === 0 ? "win" : "lose");
  }
  return text(page, state.winner === 0 ? "p1wins" : "p2wins");
}

function paintEnd(page) {
  if (!page.ended || !page.state) return;
  $("memory-end-title").textContent = endTitle(page, page.state);
  $("memory-end-line").textContent =
    page.state.config.mode === "solo"
      ? text(page, "pairs", { n: page.state.scores[0] })
      : `${page.state.scores[0]} – ${page.state.scores[1]}`;
  $("memory-end").hidden = false;
}

export function paintPlay(page) {
  if (!page.state) return;
  paintBars(page, page.state);
  paintBoard($("memory-board"), page.state, {
    hidden: text(page, "hiddenCard"),
    face: (faceId) => text(page, "card", { n: Number(faceId) })
  });
  paintMute(page);
  paintEnd(page);
}

export function applyLanguage(page) {
  document.documentElement.lang = page.lang;
  document.title = text(page, "title");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text(page, node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", text(page, node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.lang === page.lang);
  });
  $("memory-rules").innerHTML = rulesHtml(page.lang);
  paintSetup(page);
  paintPlay(page);
}

export function reportEnd(state) {
  const score = state.scores[0];
  if (state.config.mode === "pass") {
    window.MuchogamesMatch.finish();
    return;
  }
  if (state.config.mode === "solo" || state.winner === 0) {
    window.MuchogamesMatch.finish({ won: true, score });
    return;
  }
  if (state.winner === "tie") {
    window.MuchogamesMatch.finish({ score });
    return;
  }
  window.MuchogamesMatch.finish({ won: false, score });
}
