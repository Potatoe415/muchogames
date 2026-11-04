// Page shell: language, options panel, start screen, overlays and the match
// lifecycle (docs/PLATFORM_RULES.md). The match itself lives in game.js and
// is destroyed whenever the page is left, paused or a new match starts.
import { createAudio } from "./audio.js";
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate, translateCount } from "./i18n.js";
import * as prefs from "./prefs.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";

const GAME_ID = "simon";
const OVERLAYS = { paused: "simon-paused", end: "simon-end" };
const STATUS = { show: "watch", input: "yourTurn", over: "oops" };

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const stored = prefs.loadPrefs();
const page = {
  ...stored,
  lang: LANGS.includes(stored.lang) ? stored.lang : "fr",
  audio: createAudio(),
  game: null,
  hud: null,
  saved: loadMatch(),
  summary: null,
  overlay: null,
  newBest: false,
  starting: false
};
page.audio.setMuted(page.muted);

const t = (key, vars) => translate(page.lang, key, vars);
const tn = (key, n, vars) => translateCount(page.lang, key, n, vars);
const roundsOf = (match) => match.sequence.length - 1;

function renderStart() {
  $("simon-start-best").textContent = tn("startBest", page.best, page);
  const resume = $("simon-resume-button");
  resume.hidden = !page.saved;
  if (!page.saved) return;
  const score = roundsOf(page.saved);
  resume.querySelector("[data-resume-info]").textContent = tn(
    "resumeInfo",
    score,
    { score }
  );
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  $("simon-end-score").textContent = tn("endScore", s.score, s);
  $("simon-end-best").textContent = page.newBest
    ? t("newBest")
    : tn("bestLine", page.best, page);
}

function renderHud() {
  if (!page.hud) return;
  const { score, phase } = page.hud;
  $("simon-score-value").textContent = String(score);
  $("simon-best-value").textContent = String(Math.max(page.best, score));
  $("simon-hub-count").textContent = String(score);
  $("simon-status").textContent = t(STATUS[phase]);
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
  $("simon-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("simon-sound-toggle");
  sound.textContent = t(page.muted ? "off" : "on");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderStart();
  renderEnd();
  renderHud();
}

const canPlay = () => page.overlay === null && $("game-options-panel").hidden;

function showOverlay(name) {
  page.overlay = name;
  Object.entries(OVERLAYS).forEach(([key, id]) => {
    $(id).hidden = key !== name;
  });
  renderEnd();
}

function showScreen(playing) {
  $("simon-start-screen").hidden = playing;
  $("simon-stage").hidden = !playing;
}

// A finished match has no snapshot, so this only ever stores one in play.
function saveMatch() {
  const match = page.game?.snapshot();
  if (match) storeMatch(match);
}

function onEnd({ score }) {
  page.summary = { score };
  page.newBest = score > page.best;
  if (page.newBest) {
    page.best = score;
    prefs.saveBest(score);
  }
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({ score });
  showOverlay("end");
}

function onHud(state) {
  page.hud = state;
  renderHud();
  // A mistake is final: the save goes now, not after the end animation.
  if (state.phase === "over") clearMatch();
  else saveMatch();
}

function mountGame(saved) {
  unmountGame();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  showOverlay(null);
  page.game = createGame({
    board: $("simon-board"),
    audio: page.audio,
    saved,
    canPlay,
    onHud,
    onEnd
  });
  saveMatch();
}

async function startMatch() {
  if (page.starting) return;
  page.audio.unlock();
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
  page.audio.unlock();
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

// Pausing stops the playback; continuing replays the round from the save.
function pause() {
  if (!page.game || page.overlay !== null) return;
  if (page.hud?.phase === "over") return;
  unmountGame();
  showOverlay("paused");
}

function unpause() {
  const saved = loadMatch();
  if (saved) mountGame(saved);
  else returnToStart();
}

// Quitting is not an end: no finish(), the save stays for the resume
// button.
function returnToStart() {
  unmountGame();
  page.hud = null;
  page.saved = loadMatch();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function toggleSound() {
  page.muted = !page.muted;
  prefs.saveMuted(page.muted);
  page.audio.setMuted(page.muted);
  applyLanguage();
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
  $("simon-sound-toggle").addEventListener("click", toggleSound);
  $("simon-play-button").addEventListener("click", startMatch);
  $("simon-resume-button").addEventListener("click", resumeMatch);
  $("simon-menu-button").addEventListener("click", pause);
  $("simon-continue-button").addEventListener("click", unpause);
  $("simon-paused-menu-button").addEventListener("click", returnToStart);
  $("simon-replay-button").addEventListener("click", startMatch);
  $("simon-end-menu-button").addEventListener("click", returnToStart);
}

function bindPage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  $("game-options-button").addEventListener("click", pause);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindControls();
bindPage();
applyLanguage();
