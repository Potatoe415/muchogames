// Page shell: language, options panel, Game Dashboard / match / overlays,
// coins (MuchogamesMatch), save and resume, score and best per difficulty.
// The match itself lives in game.js and is destroyed whenever it is left.
import { loadImages } from "./assets.js";
import { createAudio } from "./audio.js";
import { initDpadPosition } from "./dpad-position.js";
import { createGame } from "./game.js";
import { createHud } from "./hud.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { bindInput } from "./input.js";
import * as prefs from "./prefs.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "easyfrog";
const OVERLAYS = { paused: "easyfrog-paused", end: "easyfrog-end" };
const END_IMAGES = {
  true: "images/screen_victory.png",
  false: "images/screen_gameover.png"
};

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const savedLang = prefs.loadLang();

const page = {
  lang: LANGS.includes(savedLang) ? savedLang : "fr",
  settings: prefs.loadSettings(),
  audio: createAudio(),
  images: {},
  game: null,
  unbindInput: null,
  difficulty: "normal",
  overlay: null,
  summary: null,
  starting: false
};
page.audio.setMuted(!page.settings.soundEnabled);
page.ready = Promise.all([loadBoardImages(), page.audio.loadAll()]);

const t = (key, vars) => translate(page.lang, key, vars);
const formatNumber = (n) => n.toLocaleString(page.lang);
const hud = createHud(formatNumber);

async function loadBoardImages() {
  page.images = await loadImages();
}

function renderDashboard() {
  $("easyfrog-best-score").textContent = formatNumber(prefs.loadBest("normal"));
  $("easyfrog-best-score-easy").textContent = formatNumber(
    prefs.loadBest("easy")
  );
  const saved = loadMatch();
  const resume = $("easyfrog-resume-button");
  resume.hidden = !saved;
  if (!saved) return;
  resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
    difficulty: t(saved.difficulty),
    level: saved.level,
    score: formatNumber(saved.score)
  });
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  $("easyfrog-end-image").src = END_IMAGES[s.won];
  $("easyfrog-end-title").textContent = t(s.won ? "victory" : "gameOver");
  $("easyfrog-final-score").textContent = formatNumber(s.score);
  $("easyfrog-final-best-score").textContent = formatNumber(s.best);
  $("easyfrog-new-best").hidden = !s.newBest;
}

function renderSettings() {
  document.querySelectorAll("[data-setting]").forEach((button) => {
    const on = page.settings[button.dataset.setting];
    button.textContent = t(on ? "on" : "off");
    button.setAttribute("aria-pressed", String(on));
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
    const chosen = button.dataset.lang === page.lang;
    button.classList.toggle("active", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
  $("easyfrog-rules-content").innerHTML = rulesHtml(page.lang);
  hud.reset();
  renderSettings();
  renderDashboard();
  renderEnd();
}

function showScreen(playing) {
  $("easyfrog-dashboard-screen").hidden = playing;
  $("easyfrog-play-screen").hidden = !playing;
  $("game-back-button").hidden = playing;
  $("easyfrog-quit-button").hidden = !playing;
  $("easyfrog-pause-button").hidden = !playing;
}

function showOverlay(name) {
  page.overlay = name;
  Object.entries(OVERLAYS).forEach(([key, id]) => {
    $(id).hidden = key !== name;
  });
}

const canPlay = () =>
  page.overlay === null && $("game-options-panel").hidden && !!page.game;
const focusBoard = () => $("easyfrog-board").focus({ preventScroll: true });

function saveMatch() {
  const match = page.game?.snapshot();
  if (match) storeMatch(match);
}

// The match reached its end screen: record, finish(), then the card.
function onEnd({ won, score }) {
  const { difficulty } = page;
  const newBest = prefs.storeBest(difficulty, score);
  clearMatch();
  window.MuchogamesMatch.finish({ won, score });
  page.summary = { won, score, newBest, best: prefs.loadBest(difficulty) };
  renderEnd();
  showOverlay("end");
}

function unmountGame() {
  saveMatch();
  page.unbindInput?.();
  page.game?.destroy();
  Object.assign(page, { game: null, unbindInput: null, overlay: null });
}

function mountGame(difficulty, saved) {
  unmountGame();
  Object.assign(page, { difficulty, summary: null });
  hud.reset();
  showScreen(true);
  showOverlay(null);
  page.game = createGame({
    canvas: $("easyfrog-canvas"),
    board: $("easyfrog-board"),
    images: page.images,
    audio: page.audio,
    settings: page.settings,
    difficulty,
    saved,
    onHud: hud.render,
    onSave: saveMatch,
    onEnd
  });
  page.unbindInput = bindInput({
    board: $("easyfrog-board"),
    dpad: $("easyfrog-dpad"),
    handlers: {
      canPlay,
      move: (dir) => page.game?.move(dir),
      pause,
      cheat: (action) => page.game?.cheat(action)
    }
  });
  saveMatch();
  focusBoard();
}

async function startMatch(difficulty) {
  if (page.starting) return;
  page.audio.unlock();
  window.MuchogamesTv?.play();
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  if (allowed) await page.ready;
  page.starting = false;
  if (allowed) mountGame(difficulty, null);
}

// A real-time game comes back paused.
async function resumeMatch() {
  if (page.starting) return;
  const saved = loadMatch();
  if (!saved) return renderDashboard();
  page.audio.unlock();
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  page.starting = true;
  await page.ready;
  page.starting = false;
  mountGame(saved.difficulty, saved);
  pause();
}

function pause() {
  if (!page.game || page.overlay !== null) return;
  page.game.pause();
  saveMatch();
  showOverlay("paused");
}

function unpause() {
  if (page.overlay !== "paused") return;
  showOverlay(null);
  page.game?.resume();
  focusBoard();
}

// Leaving is not an end: no finish(), the save stays for Resume.
function returnToDashboard() {
  unmountGame();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  renderDashboard();
  window.MuchogamesTv?.focusScreen();
}

function toggleSetting(key) {
  page.settings[key] = !page.settings[key];
  prefs.saveSettings(page.settings);
  page.audio.setMuted(!page.settings.soundEnabled);
  renderSettings();
}

function setLanguage(lang) {
  page.lang = lang;
  prefs.saveLang(lang);
  applyLanguage();
}

function bindControls() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  document.querySelectorAll("[data-setting]").forEach((button) => {
    const key = button.dataset.setting;
    button.addEventListener("click", () => toggleSetting(key));
  });
  const on = (id, fn) => $(id).addEventListener("click", fn);
  on("easyfrog-start-button", () => startMatch("normal"));
  on("easyfrog-start-easy-button", () => startMatch("easy"));
  on("easyfrog-resume-button", resumeMatch);
  on("easyfrog-pause-button", pause);
  on("easyfrog-continue-button", unpause);
  on("easyfrog-restart-button", () => startMatch(page.difficulty));
  on("easyfrog-paused-menu-button", returnToDashboard);
  on("easyfrog-quit-button", returnToDashboard);
  on("easyfrog-replay-button", () => startMatch(page.difficulty));
  on("easyfrog-menu-button", returnToDashboard);
}

// A quit control pauses the frog first, while game-session.js asks.
function pauseBeforeQuit(event) {
  if (event.target.closest?.("[data-match-quit]")) pause();
}

function onEscape(event) {
  if (event.key !== "Escape" || window.MuchogamesTv?.isOn()) return;
  if (page.overlay !== "paused" || !$("game-options-panel").hidden) return;
  // Handled: input.js must not read this Escape as "pause" again.
  event.preventDefault();
  unpause();
}

function bindPage() {
  window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  $("game-options-button").addEventListener("click", pause);
  window.addEventListener("click", pauseBeforeQuit, true);
  document.addEventListener("keydown", onEscape);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("pagehide", saveMatch);
}

bindControls();
bindPage();
initDpadPosition(page.settings, prefs.saveSettings);
applyLanguage();
