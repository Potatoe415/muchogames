// Page shell: language, options panel, level select + passwords, dialogs and
// the match lifecycle (docs/PLATFORM_RULES.md). One match = one level, from
// its first attempt until the exit is reached (won); retries after a death or
// R stay in the same match. Leaving keeps it saved (save.js) for "Reprendre";
// starting another level replaces it without recording a result.
import {
  $,
  $$,
  applyLanguage as renderCopy,
  renderDialogs,
  renderTitleCard
} from "./copy.js";
import { createGame } from "./game.js";
import { LANGS, translate } from "./i18n.js";
import { LEVELS, loadLevels } from "./levels.js";
import {
  levelForPassword,
  loadProgress,
  recordWin,
  scoreLevel,
  unlock
} from "./progress.js";
import { clearMatch, readMatch, writeMatch } from "./save.js";
import { loadSheet } from "./sheet.js";
import { readStorage, writeStorage } from "./storage.js";

const GAME_ID = "chipschallenge";
const LANG_KEY = "bergamots-lang";
const SOUND_KEY = "chipschallenge-sound";
const SAVE_THROTTLE_MS = 1000;
const OVERLAYS = {
  paused: "chips-paused",
  death: "chips-death",
  win: "chips-win"
};

/**
 * @typedef {object} ShellWindow
 * @property {{ start(id: string): Promise<boolean>, resume(id: string): void,
 *   finish(result?: object): void, isInProgress(): boolean }} MuchogamesMatch
 * @property {{ initOptionsPanel(trigger: Element, panel: Element): void }}
 *   [GameHeader]
 */
const shell = /** @type {ShellWindow} */ (/** @type {unknown} */ (window));

const storedLang = readStorage(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  muted: readStorage(SOUND_KEY, "on") === "off",
  progress: loadProgress(),
  game: null,
  level: 1,
  failures: 0,
  overlay: null,
  death: null,
  result: null,
  starting: false,
  inMatch: false,
  saveTimer: 0
};

const t = (key, vars) => translate(page.lang, key, vars);
const applyLanguage = () => renderCopy(page, t);

function saveMatch() {
  clearTimeout(page.saveTimer);
  page.saveTimer = 0;
  if (!page.game || !page.inMatch) return;
  writeMatch({
    level: page.level,
    failures: page.failures,
    ...page.game.snapshot()
  });
}

function saveSoon() {
  page.saveTimer ||= setTimeout(saveMatch, SAVE_THROTTLE_MS);
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
  renderDialogs(page, t);
  syncPause();
}

function showScreen(playing) {
  $("chips-start-screen").hidden = playing;
  $("chips-stage").hidden = !playing;
}

function unmountGame() {
  saveMatch();
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
}

// A new match replaces the current one: no result recorded for it.
function endMatch() {
  if (shell.MuchogamesMatch.isInProgress()) shell.MuchogamesMatch.finish();
}

function returnToSelect() {
  unmountGame();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function onDeath(reason) {
  page.death = reason;
  saveMatch();
  showOverlay("death");
}

function onWin(result) {
  const { number, timeLeft, limited } = result;
  const score = scoreLevel(number, timeLeft, page.failures);
  const { previousTime } = recordWin(
    page.progress,
    number,
    score.levelScore,
    timeLeft
  );
  page.result = {
    ...score,
    previousTime,
    timeLeft,
    limited,
    last: number === LEVELS.length
  };
  page.inMatch = false;
  clearMatch();
  shell.MuchogamesMatch.finish({ won: true, score: score.levelScore });
  showOverlay("win");
}

function retry() {
  if (!page.game) return;
  page.failures += 1;
  page.game.restart();
  saveMatch();
  showOverlay(null);
}

function restartKey() {
  if (!page.game || page.overlay === "win") return;
  const { started, over } = page.game.progress();
  if (!over && !started) return;
  retry();
}

function togglePause() {
  if (!page.game || page.overlay === "win" || page.overlay === "death") return;
  showOverlay(page.overlay === "paused" ? null : "paused");
}

function mountGame(level, saved = null) {
  unmountGame();
  page.level = level;
  page.failures = saved ? saved.failures : 0;
  page.death = null;
  page.result = null;
  page.inMatch = true;
  renderTitleCard(page, t);
  showScreen(true);
  page.game = createGame({
    level,
    saved,
    stage: $("chips-stage"),
    canvas: $("chips-board"),
    host: $("chips-board-host"),
    panel: $("chips-panel"),
    pad: $("chips-dpad"),
    titleCard: $("chips-title-card"),
    muted: page.muted,
    t,
    onDeath,
    onWin,
    onCommand,
    onTic: saveSoon,
    onLoadError: () => ($("chips-load-error").hidden = false)
  });
  saveMatch();
  showOverlay(saved ? "paused" : null);
}

async function startLevel(level) {
  if (page.starting || !page.progress.unlocked.has(level)) return;
  page.starting = true;
  endMatch();
  const allowed = await shell.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame(level);
  else if (page.game) returnToSelect();
}

function resumeMatch() {
  const saved = readMatch();
  if (page.starting || !saved) return applyLanguage();
  shell.MuchogamesMatch.resume(GAME_ID);
  mountGame(saved.level, saved);
}

function changeLevel(delta) {
  if (!page.game) return;
  for (let n = page.level + delta; n >= 1 && n <= LEVELS.length; n += delta) {
    if (page.progress.unlocked.has(n)) return startLevel(n);
  }
}

function onCommand(name) {
  if (name === "pause") togglePause();
  else if (name === "restart") restartKey();
  else if (name === "next") changeLevel(1);
  else if (name === "previous") changeLevel(-1);
}

function submitPassword(event) {
  event.preventDefault();
  const input = /** @type {HTMLInputElement} */ ($("chips-password-input"));
  const level = levelForPassword(input.value);
  $("chips-password-error").hidden = level > 0;
  if (!level) return;
  input.value = "";
  unlock(page.progress, level);
  applyLanguage();
  startLevel(level);
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
  shell.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  new MutationObserver(syncPause).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
  $$("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      writeStorage(LANG_KEY, page.lang);
      applyLanguage();
    });
  });
  $("chips-level-list").addEventListener("click", (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    const button = /** @type {HTMLButtonElement | null} */ (
      target.closest("[data-level]")
    );
    if (button && !button.disabled) startLevel(Number(button.dataset.level));
  });
  $("chips-password-form").addEventListener("submit", submitPassword);
  bindButtons();
  bindLifecycle();
}

function bindButtons() {
  onButton("chips-sound-toggle", () => {
    page.muted = !page.muted;
    writeStorage(SOUND_KEY, page.muted ? "off" : "on");
    page.game?.setMuted(page.muted);
    applyLanguage();
  });
  onButton("chips-continue-button", resumeMatch);
  onButton("chips-restart-button", restartKey);
  onButton("chips-pause-button", togglePause);
  onButton("chips-levels-button", returnToSelect);
  onButton("chips-resume-button", () => showOverlay(null));
  onButton("chips-retry-button", retry);
  onButton("chips-next-button", () => startLevel(page.level + 1));
  onButton("chips-win-levels-button", returnToSelect);
}

function bindLifecycle() {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden || !page.game) return;
    saveMatch();
    if (page.overlay === null) showOverlay("paused");
  });
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToSelect();
  });
}

bindPage();
applyLanguage();
loadSheet().catch(() => {});
loadLevels()
  .then(() => {
    page.progress = loadProgress();
    applyLanguage();
  })
  .catch(() => ($("chips-levels-error").hidden = false));
