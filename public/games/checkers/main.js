// Page shell: language, settings, screens, end overlay, saving and the match
// lifecycle (docs/PLATFORM_RULES.md). The match on screen lives in play.js.
import { createBot } from "./bot.js";
import { renderHud } from "./hud.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { createMatch, restoreMatch } from "./match.js";
import { createPlay } from "./play.js";
import { countPieces, LIGHT } from "./rules.js";
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

const GAME_ID = "checkers";
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
  $("checkers-hint-button").hidden = Boolean(page.summary) || !hintsOn();
  if (!page.match) return;
  renderHud({
    match: page.match,
    config: page.config,
    info: page.info,
    over: Boolean(page.summary),
    t
  });
  $("checkers-again-button").hidden = !page.summary;
}

function endLine({ winner, reason }) {
  if (reason !== "blocked") return t(`${reason}Line`);
  const loser = -winner;
  const side = t(loser === LIGHT ? "sideLight" : "sideDark");
  const { men, kings } = countPieces(page.match.board, loser);
  return t(men + kings ? "blockedLine" : "capturedLine", { side });
}

function renderEnd() {
  const summary = page.summary;
  if (!summary) return;
  const { winner } = summary;
  let result = "win";
  if (winner === 0) result = "draw";
  else if (isSolo() && winner !== page.config.side) result = "loss";
  const title =
    isSolo() || !winner ? result : winner === LIGHT ? "lightWins" : "darkWins";
  $("checkers-end").dataset.result = result;
  $("checkers-end-title").textContent = t(title);
  $("checkers-end-line").textContent = endLine(summary);
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
  $("checkers-rules-content").innerHTML = rulesHtml(page.lang);
  showLevel();
  page.play?.relabel();
  updateHud();
  renderEnd();
}

function applySettings() {
  $("checkers-app").dataset.theme = page.settings.theme;
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
  $("checkers-start-screen").hidden = playing;
  $("checkers-stage").hidden = !playing;
}

function recordResult({ winner }) {
  if (!isSolo()) return;
  const won = winner === page.config.side;
  const stats = page.stats[page.config.level];
  stats.played += 1;
  if (won) stats.won += 1;
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
    $("checkers-end").hidden = false;
  }, END_DELAY_MS);
}

function unmount() {
  clearTimeout(page.endTimer);
  page.play?.destroy();
  Object.assign(page, { play: null, match: null, summary: null, info: {} });
  $("checkers-end").hidden = true;
}

function mount(match, config) {
  unmount();
  Object.assign(page, { match, config });
  showScreen(true);
  page.play = createPlay({
    host: $("checkers-board"),
    match,
    config,
    bot: page.bot,
    t,
    showMoves: page.settings.showMoves === "on",
    onUpdate: updateHud,
    onMoved: () => saveGame(config, match.serialize()),
    onEnd
  });
}

function returnToStart() {
  unmount();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  clearGame();
  renderResume(null);
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
  clearGame();
  renderResume(null);
  mount(createMatch(config.variant), config);
}

function resumeMatch() {
  const saved = loadSaved();
  const match = saved && restoreMatch(saved.config.variant, saved.moves);
  if (!match) {
    clearGame();
    return void renderResume(null);
  }
  window.MuchogamesMatch.resume(GAME_ID);
  mount(match, saved.config);
}

function onKey(event) {
  if (!page.play || !$("game-options-panel").hidden || event.altKey) return;
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
    "checkers-play-button": startMatch,
    "checkers-resume-button": resumeMatch,
    "checkers-undo-button": () => page.play?.undo(),
    "checkers-hint-button": () => hintsOn() && page.play?.hint(),
    "checkers-again-button": startMatch,
    "checkers-quit-button": returnToStart,
    "checkers-replay-button": startMatch,
    "checkers-change-settings-button": returnToStart,
    "checkers-see-board-button": () => ($("checkers-end").hidden = true)
  };
  Object.entries(actions).forEach(([id, fn]) =>
    $(id).addEventListener("click", fn)
  );
  document.addEventListener("keydown", onKey);
}

bindPage();
applySettings();
applyLanguage();
renderResume(loadSaved());
