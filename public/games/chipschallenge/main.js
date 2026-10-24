// Page shell: language, options panel, level select + passwords, dialogs and
// the match lifecycle (docs/PLATFORM_RULES.md). One match = one level, from
// its first attempt until the exit is reached (won) or the player leaves it;
// retries after a death or R stay in the same match.
import { createGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { LEVELS } from "./levels.js";
import {
  levelForPassword,
  loadProgress,
  recordWin,
  scoreLevel,
  unlock
} from "./progress.js";
import { fillList, renderLevelList, totalLine, winLines } from "./screens.js";
import { loadSheet } from "./sheet.js";
import { readStorage, writeStorage } from "./storage.js";

const GAME_ID = "chipschallenge";
const LANG_KEY = "bergamots-lang";
const SOUND_KEY = "chipschallenge-sound";
const OVERLAYS = {
  paused: "chips-paused",
  death: "chips-death",
  win: "chips-win"
};

/** @returns {HTMLElement} */
const $ = (id) => document.querySelector(`[data-id="${id}"]`);
/** @returns {NodeListOf<HTMLElement>} */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * @typedef {object} ShellWindow
 * @property {{ start(id: string): Promise<boolean>,
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
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
t.lang = () => page.lang;

function renderTitleCard() {
  const def = LEVELS[page.level - 1];
  $("chips-title-level").textContent =
    `${t("levelCard", { number: page.level })} · ${def.title}`;
  $("chips-title-password").textContent = t("passwordCard", {
    code: def.password
  });
}

function renderDialogs() {
  if (page.death) $("chips-death-text").textContent = t(`death_${page.death}`);
  if (page.result) {
    fillList($("chips-win-lines"), winLines(page.result, page.progress, t));
    $("chips-next-button").hidden = page.result.last;
  }
}

function applyLanguage() {
  document.documentElement.lang = page.lang;
  $$("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  $$("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  $$("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
  $("chips-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("chips-sound-toggle");
  sound.textContent = t(page.muted ? "soundOff" : "soundOn");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderLevelList($("chips-level-list"), page.progress, t);
  $("chips-total-score").textContent = totalLine(page.progress, t);
  renderTitleCard();
  renderDialogs();
  page.game?.refreshText();
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
  renderDialogs();
  syncPause();
}

function showScreen(playing) {
  $("chips-start-screen").hidden = playing;
  $("chips-stage").hidden = !playing;
}

function unmountGame() {
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
}

function abandonMatch() {
  if (shell.MuchogamesMatch.isInProgress()) {
    shell.MuchogamesMatch.finish({ won: false, score: 0 });
  }
}

function returnToSelect() {
  abandonMatch();
  unmountGame();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function onDeath(reason) {
  page.death = reason;
  showOverlay("death");
}

function onWin(world) {
  const number = world.number;
  const score = scoreLevel(number, world.timeLeft, page.failures);
  const { previousTime } = recordWin(
    page.progress,
    number,
    score.levelScore,
    world.timeLeft
  );
  page.result = {
    ...score,
    previousTime,
    timeLeft: world.timeLeft,
    limited: world.def.time > 0,
    last: number === LEVELS.length
  };
  shell.MuchogamesMatch.finish({ won: true, score: score.levelScore });
  showOverlay("win");
}

function retry() {
  if (!page.game) return;
  page.failures += 1;
  page.game.restart();
  showOverlay(null);
}

function restartKey() {
  if (!page.game || page.overlay === "win") return;
  const w = page.game.world();
  if (!w.dead && !w.started) return;
  retry();
}

function togglePause() {
  if (!page.game || page.overlay === "win" || page.overlay === "death") return;
  showOverlay(page.overlay === "paused" ? null : "paused");
}

function mountGame(level) {
  unmountGame();
  page.level = level;
  page.failures = 0;
  page.death = null;
  page.result = null;
  renderTitleCard();
  showScreen(true);
  page.game = createGame({
    level,
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
    onLoadError: () => ($("chips-load-error").hidden = false)
  });
  showOverlay(null);
}

async function startLevel(level) {
  if (page.starting || !page.progress.unlocked.has(level)) return;
  page.starting = true;
  abandonMatch();
  const allowed = await shell.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (allowed) mountGame(level);
  else if (page.game) returnToSelect();
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
    if (document.hidden && page.game && page.overlay === null) {
      showOverlay("paused");
    }
  });
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToSelect();
  });
}

bindPage();
applyLanguage();
loadSheet().catch(() => {});
