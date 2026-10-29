// Page shell: language, options panel, level picker, HUD, end overlay and the
// match lifecycle (docs/PLATFORM_RULES.md). The match itself lives in game.js.
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { LEVELS, LEVEL_IDS } from "./levels.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "minesweeper";
const LANG_KEY = "bergamots-lang";
const BEST_KEY = "minesweeper-best-times";
const END_DELAY_MS = 700;
const SAVE_EVERY_MS = 1000;

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function readStorage(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the value only lasts for this visit.
  }
}

function readBest() {
  try {
    const stored = JSON.parse(readStorage(BEST_KEY, "{}"));
    return Object.fromEntries(
      LEVEL_IDS.map((id) => [id, Number(stored?.[id]) || 0])
    );
  } catch {
    return Object.fromEntries(LEVEL_IDS.map((id) => [id, 0]));
  }
}

const storedLang = readStorage(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  best: readBest(),
  level: LEVEL_IDS[0],
  flagMode: false,
  game: null,
  saved: loadMatch(),
  summary: null,
  endTimer: 0,
  saveTimer: 0,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);

const counter = (n) =>
  n < 0 ? `-${String(-n).padStart(2, "0")}` : String(n).padStart(3, "0");

function bestText(level) {
  const best = page.best[level];
  return best ? t("best", { best }) : t("noBest");
}

function renderLevels() {
  LEVEL_IDS.forEach((id) => {
    const button = $(`minesweeper-level-${id}`);
    button.querySelector("[data-level-info]").textContent = t(
      "levelInfo",
      LEVELS[id]
    );
    button.querySelector("[data-level-best]").textContent = bestText(id);
  });
  const resume = $("minesweeper-resume-button");
  resume.hidden = !page.saved;
  if (!page.saved) return;
  resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
    level: t(page.saved.level),
    seconds: Math.floor(page.saved.elapsed / 1000)
  });
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  const vars = { level: t(page.level), seconds: s.seconds };
  $("minesweeper-end-title").textContent = t(s.won ? "won" : "lost");
  $("minesweeper-end-line").textContent = t(
    s.won ? "wonLine" : "lostLine",
    vars
  );
  $("minesweeper-end-best").textContent = s.newBest
    ? t("newBest")
    : bestText(page.level);
}

function renderMode() {
  const toggle = $("minesweeper-mode-toggle");
  toggle.dataset.mode = page.flagMode ? "flag" : "dig";
  toggle.setAttribute("aria-pressed", String(page.flagMode));
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
  $("minesweeper-rules-content").innerHTML = rulesHtml(page.lang);
  renderLevels();
  renderEnd();
  page.game?.relabel();
}

function onHud({ minesLeft, seconds, face }) {
  document.querySelector('[data-hud="mines"]').textContent = counter(minesLeft);
  document.querySelector('[data-hud="time"]').textContent = counter(seconds);
  $("minesweeper-new-game-button").dataset.face = face;
}

function onEnd({ won, seconds }) {
  const previous = page.best[page.level];
  const newBest = won && (!previous || seconds < previous);
  if (newBest) {
    page.best[page.level] = seconds;
    writeStorage(BEST_KEY, JSON.stringify(page.best));
  }
  page.summary = { won, seconds, newBest };
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({ won });
  page.endTimer = setTimeout(() => {
    renderEnd();
    $("minesweeper-end").hidden = false;
  }, END_DELAY_MS);
}

function showScreen(playing) {
  $("minesweeper-start-screen").hidden = playing;
  $("minesweeper-stage").hidden = !playing;
}

// A finished match has no snapshot, so this only ever stores one in play.
function saveMatch() {
  const snapshot = page.game?.snapshot();
  if (snapshot) storeMatch({ ...snapshot, flagMode: page.flagMode });
}

function unmountGame() {
  saveMatch();
  clearTimeout(page.endTimer);
  clearInterval(page.saveTimer);
  page.game?.destroy();
  page.game = null;
  page.summary = null;
  $("minesweeper-end").hidden = true;
}

function mountGame(level, saved) {
  unmountGame();
  page.level = level;
  showScreen(true);
  const stage = $("minesweeper-stage");
  page.game = createGame({
    host: $("minesweeper-board"),
    level,
    portrait: stage.clientHeight > stage.clientWidth,
    saved,
    t,
    onHud,
    onEnd,
    onMove: saveMatch
  });
  page.game.setFlagMode(page.flagMode);
  syncPause();
  saveMatch();
  page.saveTimer = setInterval(saveMatch, SAVE_EVERY_MS);
}

// Quitting is not an end: `finish()` here carries no result and the save
// stays, offered again by the resume button.
function returnToStart() {
  unmountGame();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  page.saved = loadMatch();
  showScreen(false);
  applyLanguage();
}

async function startMatch(level) {
  if (page.starting) return;
  page.starting = true;
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame(level);
  else if (page.game) returnToStart();
}

function resumeMatch() {
  if (page.starting) return;
  const saved = loadMatch();
  page.saved = saved;
  if (!saved) return renderLevels();
  window.MuchogamesMatch.resume(GAME_ID);
  page.flagMode = saved.flagMode;
  renderMode();
  mountGame(saved.level, saved);
}

function syncPause() {
  const optionsOpen = !$("game-options-panel").hidden;
  page.game?.setPaused(optionsOpen || document.hidden);
}

function toggleMode() {
  page.flagMode = !page.flagMode;
  page.game?.setFlagMode(page.flagMode);
  renderMode();
  saveMatch();
}

function onVisibility() {
  syncPause();
  if (document.hidden) saveMatch();
}

function bindPage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  new MutationObserver(syncPause).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      writeStorage(LANG_KEY, page.lang);
      applyLanguage();
    });
  });
  bindMatch();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

function bindMatch() {
  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => startMatch(button.dataset.level));
  });
  $("minesweeper-resume-button").addEventListener("click", resumeMatch);
  $("minesweeper-new-game-button").addEventListener("click", () =>
    startMatch(page.level)
  );
  $("minesweeper-replay-button").addEventListener("click", () =>
    startMatch(page.level)
  );
  $("minesweeper-change-level-button").addEventListener("click", returnToStart);
  $("minesweeper-see-board-button").addEventListener("click", () => {
    $("minesweeper-end").hidden = true;
  });
  $("minesweeper-mode-toggle").addEventListener("click", toggleMode);
}

bindPage();
renderMode();
applyLanguage();
