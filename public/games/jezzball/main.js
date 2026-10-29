// Page shell: language, options panel, start screen, overlays and the match
// lifecycle (docs/PLATFORM_RULES.md). The game itself lives in game.js and
// is destroyed whenever the page is left or a new match starts.
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { summary as levelSummary } from "./rules.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "jezzball";
const SAVE_EVERY_MS = 1000;
const LANG_KEY = "bergamots-lang";
const BEST_KEY = "jezzball-best-score";
const SOUND_KEY = "jezzball-sound";
const SWIPE_KEY = "jezzball-swipe";
const OVERLAYS = {
  cleared: "jezzball-level-cleared",
  over: "jezzball-game-over",
  paused: "jezzball-paused"
};

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
    // Storage unavailable: the setting only lasts for this visit.
  }
}

const storedLang = readStorage(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  muted: readStorage(SOUND_KEY, "on") === "off",
  swipe: readStorage(SWIPE_KEY, "on") === "on",
  best: Number(readStorage(BEST_KEY, "0")) || 0,
  game: null,
  saved: loadMatch(),
  saveTimer: 0,
  summary: null,
  overlay: null,
  newBest: false,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);

function renderOverlayText() {
  const s = page.summary;
  if (!s) return;
  $("jezzball-cleared-title").textContent = t("levelCleared", s);
  $("jezzball-cleared-area").textContent = t("areaLine", s);
  $("jezzball-cleared-percent").textContent = t("percentBonus", s);
  $("jezzball-cleared-time").textContent = t("timeBonus", s);
  $("jezzball-cleared-score").textContent = t("scoreLine", s);
  $("jezzball-over-reason").textContent = t(
    s.reason === "time" ? "overTime" : "overHit"
  );
  $("jezzball-over-stats").textContent = t("overStats", s);
  $("jezzball-over-score").textContent = t("scoreLine", s);
  $("jezzball-over-best").textContent = page.newBest
    ? t("newBest")
    : t("best", { best: page.best });
}

function renderContinue() {
  const button = $("jezzball-continue-button");
  button.hidden = !page.saved;
  if (!page.saved) return;
  button.querySelector("[data-continue-info]").textContent = t("continueInfo", {
    level: page.saved.config.level,
    score: page.saved.score
  });
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
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
  $("jezzball-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("jezzball-sound-toggle");
  sound.textContent = t(page.muted ? "off" : "on");
  sound.setAttribute("aria-pressed", String(!page.muted));
  const swipe = $("jezzball-swipe-toggle");
  swipe.textContent = t(page.swipe ? "on" : "off");
  swipe.setAttribute("aria-pressed", String(page.swipe));
  $("jezzball-start-best").textContent = t("best", { best: page.best });
  renderContinue();
  renderOverlayText();
}

function syncPause() {
  const optionsOpen = !$("game-options-panel").hidden;
  page.game?.setPaused(optionsOpen || page.overlay === "paused");
}

function showOverlay(name) {
  page.overlay = name;
  Object.entries(OVERLAYS).forEach(([key, id]) => {
    $(id).hidden = key !== name;
  });
  renderOverlayText();
  syncPause();
}

function showScreen(playing) {
  $("jezzball-start-screen").hidden = playing;
  $("jezzball-stage").hidden = !playing;
}

function onLevelCleared(summary) {
  page.summary = summary;
  showOverlay("cleared");
}

function onGameOver(summary) {
  page.summary = summary;
  page.newBest = summary.score > page.best;
  if (page.newBest) {
    page.best = summary.score;
    writeStorage(BEST_KEY, String(page.best));
  }
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({ score: summary.score });
  showOverlay("over");
}

// A finished match has no snapshot, so this only ever stores one in play.
function saveMatch() {
  const state = page.game?.snapshot();
  if (state) storeMatch(state);
}

function mountGame(saved) {
  unmountGame();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  page.game = createGame({
    stage: $("jezzball-stage"),
    canvas: $("jezzball-canvas"),
    host: $("jezzball-board"),
    muted: page.muted,
    best: page.best,
    swipe: page.swipe,
    saved,
    onLevelCleared,
    onGameOver,
    onChange: saveMatch
  });
  showOverlay(null);
  saveMatch();
  page.saveTimer = setInterval(saveMatch, SAVE_EVERY_MS);
}

async function startMatch() {
  if (page.starting) return;
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame(null);
}

function resumeMatch() {
  if (page.starting) return;
  const saved = loadMatch();
  page.saved = saved;
  if (!saved) return renderContinue();
  window.MuchogamesMatch.resume(GAME_ID);
  mountGame(saved);
  if (saved.phase === "cleared") {
    page.summary = levelSummary(saved);
    showOverlay("cleared");
  } else {
    showOverlay("paused");
  }
}

function unmountGame() {
  saveMatch();
  clearInterval(page.saveTimer);
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
}

// Quitting is not an end: no finish(), the save stays for the continue
// button.
function returnToStart() {
  unmountGame();
  page.saved = loadMatch();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function toggleSound() {
  page.muted = !page.muted;
  writeStorage(SOUND_KEY, page.muted ? "off" : "on");
  page.game?.setMuted(page.muted);
  applyLanguage();
}

function toggleSwipe() {
  page.swipe = !page.swipe;
  writeStorage(SWIPE_KEY, page.swipe ? "on" : "off");
  page.game?.setSwipe(page.swipe);
  applyLanguage();
}

function setLanguage(lang) {
  page.lang = lang;
  writeStorage(LANG_KEY, lang);
  applyLanguage();
}

function onVisibility() {
  if (!document.hidden) return;
  saveMatch();
  if (page.game && page.overlay === null) showOverlay("paused");
}

function bindPage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  new MutationObserver(syncPause).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  $("jezzball-sound-toggle").addEventListener("click", toggleSound);
  $("jezzball-swipe-toggle").addEventListener("click", toggleSwipe);
  $("jezzball-continue-button").addEventListener("click", resumeMatch);
  $("jezzball-start-button").addEventListener("click", startMatch);
  $("jezzball-replay-button").addEventListener("click", startMatch);
  $("jezzball-resume-button").addEventListener("click", () =>
    showOverlay(null)
  );
  $("jezzball-next-level-button").addEventListener("click", () => {
    page.game?.nextLevel();
    showOverlay(null);
  });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindPage();
applyLanguage();
