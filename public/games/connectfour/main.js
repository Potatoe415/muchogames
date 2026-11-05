// Page shell: language, options panel, Game Dashboard / match screens, save
// and resume, match lifecycle (docs/PLATFORM_RULES.md). Two players share
// the device, so finish() gets no `won` and no score. Rules in rules.js,
// the grid in board.js.
import { createBoard } from "./board.js";
import { LANGS, translate } from "./i18n.js";
import { ROWS, canDrop, drop, isOver, newMatch } from "./rules.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "connectfour";
const LANG_KEY = "bergamots-lang";
const COLORS = { 1: "red", 2: "yellow" };
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const page = {
  lang: readLang(),
  match: null,
  saved: loadMatch(),
  notice: "",
  starting: false
};
const t = (key, vars) => translate(page.lang, key, vars);

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.includes(saved) ? saved : "fr";
  } catch {
    return "fr";
  }
}

function setLanguage(lang) {
  page.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
  applyLanguage();
}

function renderRules() {
  const body = $("connectfour-rules-content");
  body.replaceChildren(
    ...t("rulesBody").map((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      return p;
    })
  );
}

function applyLanguage() {
  document.documentElement.lang = page.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const chosen = button.dataset.lang === page.lang;
    button.classList.toggle("active", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
  renderRules();
  renderDashboard();
  if (page.match) render();
}

function renderDashboard() {
  const resume = $("connectfour-resume-button");
  resume.hidden = !page.saved;
  if (!page.saved) return;
  resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
    count: page.saved.moves.length
  });
}

function statusText(match) {
  if (match.winner) return t("win", { player: t(COLORS[match.winner]) });
  if (match.draw) return t("draw");
  return page.notice || t("turn", { player: t(COLORS[match.turn]) });
}

function columnLabel(col, filled) {
  const n = col + 1;
  if (filled === ROWS) return t("columnFull", { n });
  return t("column", { n, free: ROWS - filled });
}

// Draws everything from page.match.
function render(animate = false) {
  const match = page.match;
  const shown = match.winner || match.turn;
  $("connectfour-turn-disc").dataset.disc = match.draw ? "" : COLORS[shown];
  $("connectfour-status").textContent = statusText(match);
  $("connectfour-end-panel").hidden = !isOver(match);
  board.render(match, { animate, label: columnLabel });
}

function showScreen(playing) {
  $("connectfour-dashboard-screen").hidden = playing;
  $("connectfour-play-screen").hidden = !playing;
  $("game-back-button").hidden = playing;
  $("connectfour-quit-button").hidden = !playing;
  if (!playing) renderDashboard();
}

function mountMatch(match) {
  page.match = match;
  page.notice = "";
  storeMatch(match);
  render();
  showScreen(true);
}

async function startMatch() {
  if (page.starting) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountMatch(newMatch());
}

function resumeMatch() {
  page.saved = loadMatch();
  if (!page.saved) return renderDashboard();
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  mountMatch(page.saved);
}

// The match reached its end: the save goes, finish() runs once.
function endMatch() {
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({});
}

function playColumn(col) {
  const match = page.match;
  if (!match || isOver(match)) return;
  if (!canDrop(match, col)) {
    page.notice = t("full");
    return render();
  }
  page.match = drop(match, col);
  page.notice = "";
  if (isOver(page.match)) endMatch();
  else storeMatch(page.match);
  render(true);
}

function saveOnLeave() {
  if (page.match && !isOver(page.match)) storeMatch(page.match);
}

// Quitting is not an end: no finish(), the save stays for Resume.
function returnToDashboard() {
  saveOnLeave();
  page.match = null;
  page.saved = loadMatch();
  showScreen(false);
}

function bindControls() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  $("connectfour-start-button").addEventListener("click", startMatch);
  $("connectfour-resume-button").addEventListener("click", resumeMatch);
  $("connectfour-replay-button").addEventListener("click", startMatch);
  $("connectfour-menu-button").addEventListener("click", returnToDashboard);
  $("connectfour-quit-button").addEventListener("click", returnToDashboard);
}

function bindPage() {
  window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  window.addEventListener("pagehide", saveOnLeave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveOnLeave();
  });
}

const board = createBoard($("connectfour-board"), { onDrop: playColumn });
bindControls();
bindPage();
applyLanguage();
showScreen(false);
