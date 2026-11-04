// Page shell: language, options panel, start screen, overlays and the match
// lifecycle (docs/PLATFORM_RULES.md). The match itself lives in game.js and
// is destroyed whenever the page is left or a new match starts.
import { createGame } from "./game.js";
import { createHud } from "./hud.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import * as prefs from "./prefs.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";
import { levelFor } from "./scoring.js";

const GAME_ID = "tetris";
const OVERLAYS = { paused: "tetris-paused", end: "tetris-end" };

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
const hud = createHud({ $ });

function renderStart() {
  $("tetris-start-best").textContent = t("startBest", { best: page.best });
  $("tetris-play-button").querySelector("[data-play-info]").textContent = t(
    "playInfo",
    { level: page.startLevel }
  );
  const resume = $("tetris-resume-button");
  resume.hidden = !page.saved;
  if (page.saved) {
    resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
      level: levelFor(page.saved.startLevel, page.saved.lines),
      score: page.saved.score
    });
  }
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  $("tetris-end-title").textContent = t(s.won ? "endWon" : "endLost");
  $("tetris-end-score").textContent = t("endScore", s);
  $("tetris-end-stats").textContent = t("endStats", s);
  $("tetris-end-best").textContent = page.newBest
    ? t("newBest")
    : t("bestLine", { best: page.best });
}

function renderLevelChips() {
  const box = $("tetris-level-chips");
  box.replaceChildren();
  for (let level = 1; level <= prefs.MAX_START_LEVEL; level += 1) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tr-chip";
    chip.dataset.id = `tetris-level-${level}`;
    chip.textContent = String(level);
    chip.setAttribute("aria-pressed", String(level === page.startLevel));
    chip.addEventListener("click", () => setStartLevel(level));
    box.append(chip);
  }
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
  $("tetris-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("tetris-sound-toggle");
  sound.textContent = t(page.muted ? "off" : "on");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderLevelChips();
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
  if (name === null && page.game) $("tetris-board").focus();
  if (name !== null) page.game?.releaseKeys();
}

function showScreen(playing) {
  $("tetris-start-screen").hidden = playing;
  $("tetris-stage").hidden = !playing;
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

function onLock({ lines, spin, combo, b2b }) {
  const parts = [];
  if (spin !== "none") parts.push(t(spin === "mini" ? "spinMini" : "spin"));
  if (lines > 0) parts.push(t(`clear${lines}`));
  if (parts.length && b2b) parts.push(t("b2b"));
  if (combo > 0) parts.push(t("combo", { n: combo }));
  if (parts.length) hud.toast(parts.join(" · "));
}

function pauseGame() {
  if (page.game && page.overlay === null) showOverlay("paused");
}

function mountGame(saved) {
  unmountGame();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  page.game = createGame({
    host: $("tetris-play-area"),
    canvases: {
      board: $("tetris-board"),
      hold: $("tetris-hold-canvas"),
      next: $("tetris-next-canvas")
    },
    saved,
    startLevel: page.startLevel,
    muted: page.muted,
    canPlay,
    onHud,
    onLock,
    onEnd,
    onPause: pauseGame
  });
  // A real-time match always comes back paused.
  showOverlay(saved ? "paused" : null);
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

// Quitting is not an end: no finish(), the save stays for the resume button.
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

function setStartLevel(level) {
  page.startLevel = level;
  prefs.saveStartLevel(level);
  applyLanguage();
}

function bindStart() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  $("tetris-sound-toggle").addEventListener("click", toggleSound);
  $("tetris-play-button").addEventListener("click", startMatch);
  $("tetris-resume-button").addEventListener("click", resumeMatch);
}

function bindStage() {
  $("tetris-pause-button").addEventListener("click", pauseGame);
  $("tetris-continue-button").addEventListener("click", () => showOverlay(null));
  $("tetris-paused-menu-button").addEventListener("click", returnToStart);
  $("tetris-replay-button").addEventListener("click", startMatch);
  $("tetris-end-menu-button").addEventListener("click", returnToStart);
}

function bindPage() {
  window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    pauseGame();
    saveMatch();
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
