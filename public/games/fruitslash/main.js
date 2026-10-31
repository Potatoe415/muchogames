// Page shell: language, options panel, start screen, HUD, overlays and the
// match lifecycle (docs/PLATFORM_RULES.md). The match itself lives in
// game.js and is destroyed whenever the page is left or a new match starts.
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import * as prefs from "./prefs.js";
import { starsFor } from "./rules.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "fruitslash";
const SAVE_EVERY_MS = 1000;
const URGENT_SECONDS = 10;
const OVERLAYS = { paused: "fruitslash-paused", end: "fruitslash-end" };

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const stored = prefs.loadPrefs();
const page = {
  ...stored,
  lang: LANGS.includes(stored.lang) ? stored.lang : "fr",
  game: null,
  saved: loadMatch(),
  saveTimer: 0,
  summary: null,
  overlay: null,
  newBest: false,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);

function renderHud({ score, timeLeft }) {
  const whole = Math.ceil(timeLeft);
  document.querySelector('[data-hud="score"]').textContent = score;
  document.querySelector('[data-hud="time"]').textContent = whole;
  $("fruitslash-hud-time").classList.toggle(
    "is-urgent",
    whole <= URGENT_SECONDS
  );
}

function renderResume() {
  const button = $("fruitslash-resume-button");
  button.hidden = !page.saved;
  if (!page.saved) return;
  const { theme, mode, score, timeLeft } = page.saved;
  button.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
    theme: t(theme),
    mode: t(mode),
    score,
    time: Math.ceil(timeLeft)
  });
}

function renderStart() {
  $("fruitslash-start-best").textContent = t("bestLine", page.best);
  document.querySelectorAll("[data-theme]").forEach((button) => {
    const chosen = button.dataset.theme === page.theme;
    button.classList.toggle("active", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  const stars = starsFor(s.mode, s.score);
  const starRow = $("fruitslash-end-stars");
  starRow.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  starRow.setAttribute("aria-label", t("stars", { n: stars }));
  $("fruitslash-end-score").textContent = t("endScore", s);
  $("fruitslash-end-sliced").textContent = t("endSliced", s);
  $("fruitslash-end-combo").hidden = s.bestCombo < 3;
  $("fruitslash-end-combo").textContent = t("endCombo", { combo: s.bestCombo });
  $("fruitslash-end-best").textContent = page.newBest
    ? t("newBest")
    : t("best", { best: page.best[s.mode] });
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
  $("fruitslash-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("fruitslash-sound-toggle");
  sound.textContent = t(page.muted ? "off" : "on");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderStart();
  renderResume();
  renderEnd();
}

function syncPause() {
  const optionsOpen = !$("game-options-panel").hidden;
  page.game?.setPaused(optionsOpen || page.overlay !== null);
}

function showOverlay(name) {
  page.overlay = name;
  Object.entries(OVERLAYS).forEach(([key, id]) => {
    $(id).hidden = key !== name;
  });
  renderEnd();
  syncPause();
}

function showScreen(playing) {
  $("fruitslash-start-screen").hidden = playing;
  $("fruitslash-stage").hidden = !playing;
}

function onEnd(summary) {
  const { mode, score } = summary;
  page.summary = summary;
  page.newBest = score > page.best[mode];
  if (page.newBest) {
    page.best[mode] = score;
    prefs.saveBest(mode, score);
  }
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({ score });
  showOverlay("end");
}

// A finished match has no snapshot, so this only ever stores one in play.
function saveMatch() {
  const world = page.game?.snapshot();
  if (world) storeMatch(world);
}

function mountGame(saved) {
  unmountGame();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  page.game = createGame({
    canvas: $("fruitslash-canvas"),
    host: $("fruitslash-board"),
    saved,
    mode: page.mode,
    theme: page.theme,
    muted: page.muted,
    t,
    onHud: renderHud,
    onEnd
  });
  showOverlay(null);
  saveMatch();
  page.saveTimer = setInterval(saveMatch, SAVE_EVERY_MS);
}

async function startMatch(mode) {
  if (page.starting) return;
  page.mode = mode;
  prefs.saveMode(mode);
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame(null);
}

// A resumed match always comes back paused.
function resumeMatch() {
  if (page.starting) return;
  const saved = loadMatch();
  page.saved = saved;
  if (!saved) return renderResume();
  window.MuchogamesMatch.resume(GAME_ID);
  page.mode = saved.mode;
  page.theme = saved.theme;
  mountGame(saved);
  showOverlay("paused");
}

function unmountGame() {
  saveMatch();
  clearInterval(page.saveTimer);
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

function chooseTheme(theme) {
  page.theme = theme;
  prefs.saveTheme(theme);
  renderStart();
}

function onVisibility() {
  if (!document.hidden) return;
  saveMatch();
  if (page.game && page.overlay === null) showOverlay("paused");
}

function onKey(event) {
  if (event.key !== "p" && event.key !== "P") return;
  if (page.game && page.overlay === null) showOverlay("paused");
}

function bindStart() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => chooseTheme(button.dataset.theme));
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => startMatch(button.dataset.mode));
  });
  $("fruitslash-sound-toggle").addEventListener("click", toggleSound);
  $("fruitslash-resume-button").addEventListener("click", resumeMatch);
}

function bindStage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  new MutationObserver(syncPause).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
  $("fruitslash-pause-button").addEventListener("click", () =>
    showOverlay("paused")
  );
  $("fruitslash-continue-button").addEventListener("click", () =>
    showOverlay(null)
  );
  $("fruitslash-replay-button").addEventListener("click", () =>
    startMatch(page.mode)
  );
  $("fruitslash-menu-button").addEventListener("click", returnToStart);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindStart();
bindStage();
applyLanguage();
