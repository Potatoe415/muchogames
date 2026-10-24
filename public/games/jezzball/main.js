// Page shell: language, options panel, start screen, overlays and the match
// lifecycle (docs/PLATFORM_RULES.md). The game itself lives in game.js and
// is destroyed whenever the page is left or a new match starts.
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";

const GAME_ID = "jezzball";
const LANG_KEY = "bergamots-lang";
const BEST_KEY = "jezzball-best-score";
const SOUND_KEY = "jezzball-sound";
const DOUBLE_TAP_KEY = "jezzball-double-tap";
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
  doubleTap: readStorage(DOUBLE_TAP_KEY, "off") === "on",
  best: Number(readStorage(BEST_KEY, "0")) || 0,
  game: null,
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
  const doubleTap = $("jezzball-double-tap-toggle");
  doubleTap.textContent = t(page.doubleTap ? "on" : "off");
  doubleTap.setAttribute("aria-pressed", String(page.doubleTap));
  $("jezzball-start-best").textContent = t("best", { best: page.best });
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
  window.MuchogamesMatch.finish({ score: summary.score });
  showOverlay("over");
}

function mountGame() {
  page.game?.destroy();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  page.game = createGame({
    stage: $("jezzball-stage"),
    canvas: $("jezzball-canvas"),
    host: $("jezzball-board"),
    muted: page.muted,
    best: page.best,
    doubleTap: page.doubleTap,
    onLevelCleared,
    onGameOver
  });
  showOverlay(null);
}

async function startMatch() {
  if (page.starting) return;
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame();
}

function unmountGame() {
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
}

function returnToStart() {
  unmountGame();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
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

function toggleDoubleTap() {
  page.doubleTap = !page.doubleTap;
  writeStorage(DOUBLE_TAP_KEY, page.doubleTap ? "on" : "off");
  page.game?.setDoubleTap(page.doubleTap);
  applyLanguage();
}

function setLanguage(lang) {
  page.lang = lang;
  writeStorage(LANG_KEY, lang);
  applyLanguage();
}

function pauseWhenHidden() {
  if (document.hidden && page.game && page.overlay === null) {
    showOverlay("paused");
  }
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
  $("jezzball-double-tap-toggle").addEventListener("click", toggleDoubleTap);
  $("jezzball-start-button").addEventListener("click", startMatch);
  $("jezzball-replay-button").addEventListener("click", startMatch);
  $("jezzball-resume-button").addEventListener("click", () =>
    showOverlay(null)
  );
  $("jezzball-next-level-button").addEventListener("click", () => {
    page.game?.nextLevel();
    showOverlay(null);
  });
  document.addEventListener("visibilitychange", pauseWhenHidden);
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindPage();
applyLanguage();
