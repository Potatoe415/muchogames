// Page shell: language, options panel, level picker, HUD, end overlay and the
// match lifecycle (docs/PLATFORM_RULES.md). The match itself lives in game.js.
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { LEVELS, LEVEL_IDS } from "./levels.js";

const GAME_ID = "minesweeper";
const LANG_KEY = "bergamots-lang";
const BEST_KEY = "minesweeper-best-times";
const END_DELAY_MS = 700;

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
  summary: null,
  endTimer: 0,
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

function unmountGame() {
  clearTimeout(page.endTimer);
  page.game?.destroy();
  page.game = null;
  page.summary = null;
  $("minesweeper-end").hidden = true;
}

function mountGame(level) {
  unmountGame();
  page.level = level;
  showScreen(true);
  const stage = $("minesweeper-stage");
  page.game = createGame({
    host: $("minesweeper-board"),
    level,
    portrait: stage.clientHeight > stage.clientWidth,
    t,
    onHud,
    onEnd
  });
  page.game.setFlagMode(page.flagMode);
  syncPause();
}

function returnToStart() {
  unmountGame();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
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

function syncPause() {
  const optionsOpen = !$("game-options-panel").hidden;
  page.game?.setPaused(optionsOpen || document.hidden);
}

function toggleMode() {
  page.flagMode = !page.flagMode;
  page.game?.setFlagMode(page.flagMode);
  renderMode();
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
  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => startMatch(button.dataset.level));
  });
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
  document.addEventListener("visibilitychange", syncPause);
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindPage();
renderMode();
applyLanguage();
