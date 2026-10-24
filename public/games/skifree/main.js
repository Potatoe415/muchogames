// Page shell: language, options panel, start screen, overlays, course
// toasts and the match lifecycle (docs/PLATFORM_RULES.md). The run itself
// lives in game.js and is destroyed whenever the page is left or a new
// match starts.
import { PX_PER_M } from "./config.js";
import { createGame } from "./game.js";
import { formatTime } from "./hud.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import {
  courseMessage,
  loadRecords,
  recordLines,
  submitRecord
} from "./records.js";
import { loadSheet } from "./sprites.js";
import { readStorage, writeStorage } from "./storage.js";

const GAME_ID = "skifree";
const LANG_KEY = "bergamots-lang";
const SOUND_KEY = "skifree-sound";
const TOAST_MS = 5000;
const OVERLAYS = { paused: "skifree-paused", over: "skifree-game-over" };

/** @returns {HTMLElement} */
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = readStorage(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  muted: readStorage(SOUND_KEY, "on") === "off",
  records: loadRecords(),
  game: null,
  overlay: null,
  summary: null,
  toast: null,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);

function fillList(list, lines) {
  list.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    })
  );
}

function renderOverText() {
  const s = page.summary;
  if (!s) return;
  $("skifree-over-stats").textContent = t("overStats", s);
  $("skifree-over-best").textContent = s.newBest
    ? t("newBest")
    : t("recordDist", { value: `${page.records.dist ?? 0} m` });
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
  $("skifree-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("skifree-sound-toggle");
  sound.textContent = t(page.muted ? "soundOff" : "soundOn");
  sound.setAttribute("aria-pressed", String(!page.muted));
  fillList($("skifree-start-records"), recordLines(page.records, t));
  renderOverText();
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
  renderOverText();
  syncPause();
}

function hideToast() {
  clearTimeout(page.toast);
  page.toast = null;
  $("skifree-course-toast").hidden = true;
}

function onCourse(result) {
  fillList(
    $("skifree-course-toast-text"),
    courseMessage(result, page.records, t)
  );
  $("skifree-course-toast").hidden = false;
  clearTimeout(page.toast);
  page.toast = setTimeout(hideToast, TOAST_MS);
}

function onEaten() {
  const { skier, time } = page.game.summary();
  const dist = Math.max(0, Math.round(skier.y / PX_PER_M));
  const newBest = dist > 0 && submitRecord(page.records, "dist", dist);
  page.summary = { dist, time: formatTime(time), style: skier.style, newBest };
  window.MuchogamesMatch.finish({ score: dist });
  showOverlay("over");
}

function currentScore() {
  const y = page.game?.summary().skier.y ?? 0;
  return Math.max(0, Math.round(y / PX_PER_M));
}

function unmountGame() {
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
  hideToast();
}

function showScreen(playing) {
  $("skifree-start-screen").hidden = playing;
  $("skifree-stage").hidden = !playing;
}

function returnToStart() {
  if (window.MuchogamesMatch.isInProgress()) {
    window.MuchogamesMatch.finish({ score: currentScore() });
  }
  unmountGame();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function mountGame() {
  unmountGame();
  page.summary = null;
  showScreen(true);
  page.game = createGame({
    stage: $("skifree-stage"),
    canvas: $("skifree-canvas"),
    host: $("skifree-board"),
    buttons: {
      jump: $("skifree-jump-button"),
      turbo: $("skifree-turbo-button")
    },
    muted: page.muted,
    t,
    onCourse,
    onEaten,
    onPauseKey: togglePause,
    onRestartKey: restartMatch,
    onLoadError: () => ($("skifree-load-error").hidden = false)
  });
  showOverlay(null);
}

async function startMatch() {
  if (page.starting) return;
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame();
  else if (page.game) returnToStart();
}

function restartMatch() {
  if (!page.game || page.starting) return;
  if (window.MuchogamesMatch.isInProgress()) {
    window.MuchogamesMatch.finish({ score: currentScore() });
  }
  startMatch();
}

function togglePause() {
  if (!page.game || page.overlay === "over") return;
  showOverlay(page.overlay === "paused" ? null : "paused");
}

function toggleSound() {
  page.muted = !page.muted;
  writeStorage(SOUND_KEY, page.muted ? "off" : "on");
  page.game?.setMuted(page.muted);
  applyLanguage();
}

function setLanguage(lang) {
  page.lang = lang;
  writeStorage(LANG_KEY, lang);
  applyLanguage();
}

function pauseWhenHidden() {
  if (document.hidden && page.game && page.overlay === null)
    showOverlay("paused");
}

function onButton(id, run) {
  const button = $(id);
  button.addEventListener("click", () => {
    button.blur();
    run();
  });
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
  onButton("skifree-sound-toggle", toggleSound);
  onButton("skifree-start-button", startMatch);
  onButton("skifree-replay-button", startMatch);
  onButton("skifree-resume-button", () => showOverlay(null));
  onButton("skifree-pause-button", togglePause);
  onButton("skifree-restart-button", restartMatch);
  document.addEventListener("visibilitychange", pauseWhenHidden);
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
}

bindPage();
applyLanguage();
loadSheet().catch(() => {});
