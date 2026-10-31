// Page shell: language, settings, screens, end overlay, saving and the match
// lifecycle (docs/PLATFORM_RULES.md). The match on screen lives in play.js.
import { createBot } from "./bot.js";
import { renderHud } from "./hud.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { createMatch, restoreMatch } from "./match.js";
import { createPlay } from "./play.js";
import { WHITE } from "./rules.js";
import {
  bindChoices,
  matchConfig,
  renderChoices,
  renderLevel,
  renderResume
} from "./setup.js";
import { setSoundEnabled, sound } from "./sound.js";
import {
  clearGame,
  loadSaved,
  loadSettings,
  loadStats,
  readText,
  saveGame,
  saveSettings,
  saveStats,
  writeText
} from "./store.js";

const GAME_ID = "chess";
const LANG_KEY = "bergamots-lang";
const END_DELAY_MS = 900;

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = readText(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  settings: loadSettings(),
  stats: loadStats(),
  bot: createBot(),
  play: null,
  match: null,
  config: null,
  info: {},
  summary: null,
  endTimer: 0,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const isSolo = () => page.config?.mode === "solo";
const showLevel = () => renderLevel(page.settings.level, page.stats, t);
const hintsOn = () => page.settings.hints === "on";

function updateHud(info) {
  if (info) page.info = info;
  $("chess-hint-button").hidden = Boolean(page.summary) || !hintsOn();
  if (!page.match) return;
  renderHud({
    match: page.match,
    config: page.config,
    info: page.info,
    over: Boolean(page.summary),
    t
  });
  $("chess-again-button").hidden = !page.summary;
}

function endLine({ winner, reason }) {
  if (reason !== "checkmate") return t(`${reason}Line`);
  const side = t(winner === WHITE ? "sideBlack" : "sideWhite");
  return t("checkmateLine", { side });
}

function renderEnd() {
  const summary = page.summary;
  if (!summary) return;
  const { winner } = summary;
  let result = "win";
  if (winner === 0) result = "draw";
  else if (isSolo() && winner !== page.config.side) result = "loss";
  const title =
    isSolo() || !winner ? result : winner === WHITE ? "whiteWins" : "blackWins";
  $("chess-end").dataset.result = result;
  $("chess-end-title").textContent = t(title);
  $("chess-end-line").textContent = endLine(summary);
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
  $("chess-rules-content").innerHTML = rulesHtml(page.lang);
  showLevel();
  page.play?.relabel();
  updateHud();
  renderEnd();
}

function applySettings() {
  $("chess-app").dataset.theme = page.settings.theme;
  setSoundEnabled(page.settings.sound === "on");
  renderChoices(page.settings);
  showLevel();
  page.play?.setShowMoves(page.settings.showMoves === "on");
  updateHud();
}

function choose(setting, value) {
  page.settings[setting] = value;
  saveSettings(page.settings);
  applySettings();
}

function showScreen(playing) {
  $("chess-start-screen").hidden = playing;
  $("chess-stage").hidden = !playing;
}

function recordResult({ winner }) {
  if (!isSolo()) return;
  const won = winner === page.config.side;
  const stats = page.stats[page.config.level];
  stats.played += 1;
  if (won) stats.won += 1;
  if (!winner) stats.drawn += 1;
  saveStats(page.stats);
  showLevel();
  if (winner) (won ? sound.win : sound.lose)();
}

function onEnd(status) {
  page.summary = status;
  clearGame();
  recordResult(status);
  if (!isSolo()) sound.win();
  const decided = isSolo() && status.winner !== 0;
  window.MuchogamesMatch.finish(
    decided ? { won: status.winner === page.config.side } : undefined
  );
  updateHud();
  page.endTimer = setTimeout(() => {
    renderEnd();
    $("chess-end").hidden = false;
  }, END_DELAY_MS);
}

function unmount() {
  clearTimeout(page.endTimer);
  page.play?.destroy();
  Object.assign(page, { play: null, match: null, summary: null, info: {} });
  $("chess-end").hidden = true;
}

function mount(match, config) {
  unmount();
  Object.assign(page, { match, config });
  showScreen(true);
  page.play = createPlay({
    host: $("chess-board"),
    match,
    config,
    bot: page.bot,
    t,
    showMoves: page.settings.showMoves === "on",
    onUpdate: updateHud,
    onMoved: saveNow,
    onEnd
  });
}

function saveNow() {
  if (page.match && !page.summary)
    saveGame(page.config, page.match.serialize());
}

// The saved match replayed against the rules; a corrupt save is dropped.
function loadResumable() {
  const saved = loadSaved();
  const match = saved && restoreMatch(saved.moves);
  if (match) return { config: saved.config, match };
  clearGame();
  return null;
}

// Quitting mid-match keeps the save (no finish); an ended match already
// cleared it in onEnd. Either way the start screen reflects what is saved.
function returnToStart() {
  saveNow();
  unmount();
  renderResume(loadResumable());
  showScreen(false);
}

async function startMatch() {
  if (page.starting) return;
  page.starting = true;
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  const config = matchConfig(page.settings);
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return void (page.play && returnToStart());
  saveGame(config, []);
  renderResume(null);
  mount(createMatch(), config);
}

function resumeMatch() {
  const resumable = loadResumable();
  renderResume(resumable);
  if (!resumable) return;
  window.MuchogamesMatch.resume(GAME_ID);
  mount(resumable.match, resumable.config);
}

function onKey(event) {
  if (!page.play || !$("game-options-panel").hidden || event.altKey) return;
  if (!$("chess-promotion").hidden) return;
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "z") page.play.undo();
  else if (!event.ctrlKey && !event.metaKey && key === "h" && hintsOn()) {
    page.play.hint();
  } else return;
  event.preventDefault();
}

function bindPage() {
  window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      writeText(LANG_KEY, page.lang);
      applyLanguage();
    });
  });
  bindChoices(choose);
  const actions = {
    "chess-play-button": startMatch,
    "chess-resume-button": resumeMatch,
    "chess-undo-button": () => page.play?.undo(),
    "chess-hint-button": () => hintsOn() && page.play?.hint(),
    "chess-again-button": startMatch,
    "chess-quit-button": returnToStart,
    "chess-replay-button": startMatch,
    "chess-change-settings-button": returnToStart,
    "chess-see-board-button": () => ($("chess-end").hidden = true)
  };
  Object.entries(actions).forEach(([id, fn]) =>
    $(id).addEventListener("click", fn)
  );
  document.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveNow();
  });
}

bindPage();
applySettings();
applyLanguage();
renderResume(loadResumable());
