// Page shell: language, options panel, start screen, overlays and the match
// lifecycle (docs/PLATFORM_RULES.md). The match itself lives in game.js and
// is destroyed whenever the page is left or a new match starts.
import { createGame } from "./game.js";
import { createHud } from "./hud.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import * as prefs from "./prefs.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "2048";
const OVERLAYS = {
  paused: "2048-paused",
  win: "2048-win",
  end: "2048-end"
};

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const stored = prefs.loadPrefs();
const page = {
  ...stored,
  lang: LANGS.includes(stored.lang) ? stored.lang : "fr",
  game: null,
  saved: loadMatch(),
  summary: null,
  overlay: null,
  newBest: false,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const hud = createHud({ t, $ });

function renderStart() {
  $("2048-start-best").textContent = t("bestLine", { best: page.best });
  const resume = $("2048-resume-button");
  resume.hidden = !page.saved;
  if (page.saved) {
    resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
      score: page.saved.score
    });
  }
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  $("2048-end-title").textContent = t(s.won ? "endWon" : "endLost");
  $("2048-end-score").textContent = t("endScore", s);
  $("2048-end-top").textContent = t("endTop", s);
  $("2048-end-best").textContent = page.newBest
    ? t("newBest")
    : t("bestLine", { best: page.best });
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
  $("2048-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("2048-sound-toggle");
  sound.textContent = t(page.muted ? "off" : "on");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderStart();
  renderEnd();
  hud.repaint();
}

const canPlay = () => page.overlay === null && $("game-options-panel").hidden;

function showOverlay(name) {
  page.overlay = name;
  Object.entries(OVERLAYS).forEach(([key, id]) => {
    $(id).hidden = key !== name;
  });
  renderEnd();
  if (name === null && page.game) $("2048-board").focus();
}

function showScreen(playing) {
  $("2048-start-screen").hidden = playing;
  $("2048-stage").hidden = !playing;
}

// A finished match has no snapshot, so this only ever stores one in play.
function saveMatch() {
  const match = page.game?.snapshot();
  if (match) storeMatch(match);
}

function onEnd(summary) {
  page.summary = summary;
  page.newBest = summary.score > page.best;
  if (page.newBest) {
    page.best = summary.score;
    prefs.saveBest(summary.score);
  }
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({ won: summary.won, score: summary.score });
  showOverlay("end");
}

function onHud(state) {
  hud.render(state, page.best);
  saveMatch();
}

function mountGame(saved) {
  unmountGame();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  page.game = createGame({
    board: $("2048-board"),
    host: $("2048-board-area"),
    saved,
    muted: page.muted,
    canPlay,
    onHud,
    onWin: () => showOverlay("win"),
    onEnd
  });
  showOverlay(null);
  saveMatch();
}

async function startMatch() {
  if (page.starting) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame(null);
}

function resumeMatch() {
  if (page.starting) return;
  const saved = loadMatch();
  page.saved = saved;
  if (!saved) return renderStart();
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  mountGame(saved);
}

function unmountGame() {
  saveMatch();
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
}

// Quitting is not an end: no finish(), the save stays for the resume
// button.
function returnToStart() {
  unmountGame();
  page.saved = loadMatch();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function undoFromMenu() {
  page.game?.undo();
  showOverlay(null);
}

function toggleSound() {
  page.muted = !page.muted;
  prefs.saveMuted(page.muted);
  page.game?.setMuted(page.muted);
  applyLanguage();
}

function setLanguage(lang) {
  page.lang = lang;
  prefs.saveLang(lang);
  applyLanguage();
}

function bindStart() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  $("2048-sound-toggle").addEventListener("click", toggleSound);
  $("2048-play-button").addEventListener("click", startMatch);
  $("2048-resume-button").addEventListener("click", resumeMatch);
}

function bindStage() {
  $("2048-undo-button").addEventListener("click", () => page.game?.undo());
  $("2048-menu-button").addEventListener("click", () => {
    if (page.game && page.overlay === null) showOverlay("paused");
  });
  $("2048-continue-button").addEventListener("click", () => showOverlay(null));
  $("2048-paused-undo-button").addEventListener("click", undoFromMenu);
  $("2048-paused-menu-button").addEventListener("click", returnToStart);
  $("2048-keep-going-button").addEventListener("click", () =>
    showOverlay(null)
  );
  $("2048-stop-button").addEventListener("click", () => page.game?.finish());
  $("2048-replay-button").addEventListener("click", startMatch);
  $("2048-end-menu-button").addEventListener("click", returnToStart);
}

function bindPage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveMatch();
  });
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindStart();
bindStage();
bindPage();
applyLanguage();
