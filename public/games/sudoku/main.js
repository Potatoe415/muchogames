// Page shell: language, options panel, level picker and resume, end overlay
// and the match lifecycle (docs/PLATFORM_RULES.md). The grid lives in play.js.
import { generate } from "./generator.js";
import { LANGS, formatTime, translate } from "./i18n.js";
import { LEVEL_IDS } from "./levels.js";
import { newState } from "./model.js";
import { createPlay } from "./play.js";
import { rulesHtml } from "./rules.js";
import * as store from "./store.js";

const GAME_ID = "sudoku";
const LANG_KEY = "bergamots-lang";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = store.readStorage(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  best: store.loadBest(),
  prefs: store.loadPrefs(),
  saved: store.loadGame(),
  level: LEVEL_IDS[0],
  play: null,
  panel: null,
  summary: null,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);

function bestText(level) {
  const best = page.best[level];
  return best ? t("best", { time: formatTime(best) }) : t("noBest");
}

function renderStart() {
  LEVEL_IDS.forEach((id) => {
    const button = $(`sudoku-level-${id}`);
    button.querySelector("[data-level-best]").textContent = bestText(id);
  });
  const resume = $("sudoku-resume-button");
  resume.hidden = !page.saved;
  if (!page.saved) return;
  resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
    level: t(page.saved.level),
    time: formatTime(page.saved.seconds)
  });
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  const time = formatTime(s.seconds);
  $("sudoku-end-line").textContent = t("wonLine", { level: t(page.level), time });
  $("sudoku-end-stats").textContent = t("wonStats", s);
  $("sudoku-end-best").textContent = s.newBest
    ? t("newBest")
    : bestText(page.level);
}

function applyLanguage() {
  document.documentElement.lang = page.lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
  $("sudoku-rules-content").innerHTML = rulesHtml(page.lang);
  $("sudoku-hud-level").textContent = t(page.level);
  renderStart();
  renderEnd();
  page.play?.relabel();
}

function showScreen(playing) {
  $("sudoku-start-screen").hidden = playing;
  $("sudoku-stage").hidden = !playing;
  $("sudoku-options-play").hidden = !playing;
}

// 0 means "no record" in storage, so a record is at least one second.
function onWin(result) {
  const seconds = Math.max(1, result.seconds);
  const previous = page.best[page.level];
  const newBest = !previous || seconds < previous;
  if (newBest) {
    page.best[page.level] = seconds;
    store.saveBest(page.best);
  }
  page.saved = null;
  page.summary = { ...result, newBest };
  window.MuchogamesMatch.finish({ won: true });
  renderEnd();
  $("sudoku-end").hidden = false;
}

function unmount() {
  page.play?.destroy();
  page.play = null;
  page.summary = null;
  $("sudoku-end").hidden = true;
}

function mount(state) {
  unmount();
  page.level = state.level;
  page.saved = state;
  showScreen(true);
  $("sudoku-hud-level").textContent = t(state.level);
  page.play = createPlay({
    els: playElements(),
    state,
    showErrors: page.prefs.showErrors,
    t,
    onWin
  });
  syncHold();
}

function playElements() {
  return {
    stage: $("sudoku-stage"),
    board: $("sudoku-board"),
    pad: $("sudoku-pad"),
    time: $("sudoku-hud-time"),
    mistakes: $("sudoku-hud-mistakes-value"),
    undo: $("sudoku-undo-button"),
    erase: $("sudoku-erase-button"),
    notes: $("sudoku-notes-toggle"),
    hint: $("sudoku-hint-button"),
    pause: $("sudoku-pause-button"),
    continue: $("sudoku-continue-button"),
    pauseOverlay: $("sudoku-pause-overlay")
  };
}

// The unfinished grid stays saved: "Reprendre" brings it back for free.
function returnToStart() {
  unmount();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  page.saved = store.loadGame();
  showScreen(false);
  applyLanguage();
}

async function startMatch(level) {
  if (page.starting) return;
  page.starting = true;
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return page.play && returnToStart();
  const state = newState(level, generate(level));
  store.saveGame(state);
  mount(state);
}

function resumeMatch() {
  if (!page.saved || page.starting) return;
  window.MuchogamesMatch.resume(GAME_ID);
  mount(page.saved);
}

function syncHold() {
  page.play?.setHold(!$("game-options-panel").hidden || document.hidden);
}

function bindOptions() {
  const panel = $("game-options-panel");
  page.panel = window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    panel
  );
  new MutationObserver(syncHold).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      store.writeStorage(LANG_KEY, page.lang);
      applyLanguage();
    });
  });
  bindGameOptions();
}

function bindGameOptions() {
  const errors = $("sudoku-show-errors-toggle");
  errors.checked = page.prefs.showErrors;
  errors.addEventListener("change", () => {
    page.prefs.showErrors = errors.checked;
    store.savePrefs(page.prefs);
    page.play?.setShowErrors(errors.checked);
  });
  $("sudoku-fill-notes-button").addEventListener("click", () => {
    page.panel?.close();
    page.play?.fillNotes();
  });
  $("sudoku-options-change-level").addEventListener("click", () => {
    page.panel?.close();
    returnToStart();
  });
}

function bindPage() {
  bindOptions();
  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => startMatch(button.dataset.level));
  });
  $("sudoku-resume-button").addEventListener("click", resumeMatch);
  $("sudoku-replay-button").addEventListener("click", () =>
    startMatch(page.level)
  );
  $("sudoku-change-level-button").addEventListener("click", returnToStart);
  document.addEventListener("visibilitychange", syncHold);
  window.addEventListener("pagehide", unmount);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindPage();
showScreen(false);
applyLanguage();
