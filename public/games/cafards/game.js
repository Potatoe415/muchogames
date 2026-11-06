// Salade de Cafards page shell: Game Dashboard (resume, setup, new game),
// the match (piles, turns, red-light timer, collect), the end card, save and
// resume. Copy in i18n.js, deck rules in deck.js, settings and the red
// light in setup.js, rendering in board.js, save in save.js.
const GAME_ID = "cafards";
const RULES = { fr: "rules-fr.html", en: "rules-en.html", es: "rules-es.html" };
const { translate, applyCopy, readLanguage, storeLanguage } = window.CafardsI18n;
const state = {
  lang: readLanguage(),
  players: [],
  piles: [[], []],
  activePile: 0,
  current: 0,
  started: false,
  phase: "setup",
  config: { count: 4, deckSize: 128, winners: 1, timerOn: true, timerMs: 1500 }
};
let el = {};
let optionsPanelApi = null;
let starting = false;
const q = (selector) => document.querySelector(selector);
const byId = (dataId) => q(`[data-id="${dataId}"]`);
const t = (key, values) => translate(state.lang, key, values);

function cacheDom() {
  el = {
    setup: q("#setup"),
    game: q("#game"),
    playerCount: q("#playerCount"),
    deckSize: q("#deckSize"),
    winnersCount: q("#winnersCount"),
    timerEnabled: q("#timerEnabled"),
    timerSeconds: q("#timerSeconds"),
    steps: [...document.querySelectorAll(".step")],
    startBtn: q("#startBtn"),
    resumeBtn: byId("cafards-resume-button"),
    backLink: byId("game-back-button"),
    quitBtn: byId("cafards-quit-button"),
    setupError: byId("cafards-setup-error"),
    timerLight: q("#timerLight"),
    timerText: q("#timerText"),
    pileA: q("#pileA"),
    pileB: q("#pileB"),
    pileHits: [q("#pileAHit"), q("#pileBHit")],
    pileShells: [...document.querySelectorAll(".pile-shell")],
    players: q("#players"),
    cardTpl: q("#cardTpl"),
    langButtons: [...document.querySelectorAll(".lang-btn")],
    optionsBtn: q("#optionsBtn"),
    optionsPanel: q("#optionsPanel"),
    rulesSection: byId("game-options-rules"),
    rulesFrame: q("#rulesFrame"),
    winnerOverlay: q("#winnerOverlay"),
    winnerText: q("#winnerText"),
    endOverlay: byId("cafards-gameover-overlay"),
    finalWinners: byId("cafards-final-winners"),
    replayBtn: byId("cafards-replay-button"),
    menuBtn: byId("cafards-menu-button")
  };
}

function applyI18n() {
  applyCopy(state.lang);
  window.CafardsSetup.renderTimerToggle(el, t);
  if (!state.started) el.timerText.textContent = t("waitingTimer");
  if (el.rulesSection.open) el.rulesFrame.src = RULES[state.lang];
  if (state.players.length) render();
  if (!el.endOverlay.hidden) renderWinners();
}

const currentPlayer = () => state.players[state.current % state.players.length];
const { clearTimer } = window.CafardsSetup;

function resetTimer() {
  if (state.started) window.CafardsSetup.startTimer(el, state.config, t);
  else clearTimer();
}

// A remote user pressing a pile follows the play to the new active pile.
function setActivePile(index) {
  const followFocus = el.pileHits.includes(document.activeElement);
  state.activePile = index;
  window.CafardsBoard.markActivePile(state, el);
  if (followFocus) el.pileHits[index].focus({ preventScroll: true });
}

function render() {
  window.CafardsBoard.renderPiles(state, el, t);
  window.CafardsBoard.renderPlayers(state, el, t, collectCards);
}

function saveMatch() {
  if (state.phase === "playing") window.CafardsSave.storeMatch(state);
}

function renderResume() {
  el.resumeBtn.hidden = !window.CafardsSave.loadMatch();
}

function closeOptionsPanel() {
  optionsPanelApi?.close();
  el.rulesSection.open = false;
  el.rulesFrame.src = "about:blank";
}

// One screen at a time; the header's back link becomes the ✖ in a match.
function showScreen(name) {
  const playing = name === "game";
  document.body.className = playing ? "mode-game" : "mode-setup";
  el.setup.hidden = playing;
  el.game.hidden = !playing;
  el.backLink.hidden = playing;
  el.quitBtn.hidden = !playing;
  if (!playing) el.endOverlay.hidden = true;
}

function enterGame() {
  state.started = true;
  state.phase = "playing";
  el.endOverlay.hidden = true;
  showScreen("game");
  setActivePile(state.activePile);
  render();
  resetTimer();
  saveMatch();
}

async function startGame() {
  if (starting || state.phase === "playing") return;
  window.MuchogamesTv?.play();
  starting = true;
  await window.CafardsPreload.ready();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  starting = false;
  if (!allowed) return;
  try {
    closeOptionsPanel();
    window.CafardsSetup.readConfig(el, state.config);
    state.players = window.CafardsDeck.deal(state.config);
    state.current = 0;
    state.piles = [[], []];
    state.activePile = 0;
    enterGame();
  } catch (error) {
    el.setupError.textContent = t("setupError", { message: error.message || String(error) });
    el.setupError.hidden = false;
  }
}

async function resumeMatch() {
  if (starting || state.phase === "playing") return;
  const saved = window.CafardsSave.loadMatch();
  if (!saved) return renderResume();
  window.MuchogamesTv?.play();
  await window.CafardsPreload.ready();
  window.MuchogamesMatch.resume(GAME_ID);
  // The shared language (bergamots-lang) wins over the one saved with it.
  delete saved.lang;
  Object.assign(state, saved);
  window.CafardsSetup.writeConfig(el, state.config, t);
  closeOptionsPanel();
  applyI18n();
  enterGame();
}

// ✖ confirmed (game-session.js asked first) or the end card's Menu.
// Quitting is not an end: the save stays and no finish().
function showDashboard() {
  saveMatch();
  clearTimer();
  closeOptionsPanel();
  state.started = false;
  state.phase = "setup";
  state.players = [];
  state.piles = [[], []];
  el.timerText.textContent = t("waitingTimer");
  el.winnerOverlay.hidden = true;
  showScreen("setup");
  renderResume();
}

function renderWinners() {
  const names = state.players
    .map((player, index) => (player.hand.length === 0 ? t("playerName", { n: index + 1 }) : null))
    .filter(Boolean);
  el.finalWinners.textContent = names.length ? t("playerWins", { player: names.join(", ") }) : "";
}

// Real end: the save goes, finish() once (no `won`: one shared device).
function endMatch() {
  if (state.phase !== "playing") return;
  state.phase = "ended";
  state.started = false;
  clearTimer();
  el.timerText.textContent = t("gameOver");
  window.CafardsSave.clearMatch();
  window.MuchogamesMatch.finish();
  el.winnerOverlay.hidden = true;
  renderWinners();
  el.endOverlay.hidden = false;
}

function showWinnerBanner(index) {
  el.winnerText.textContent = t("playerWins", { player: t("playerName", { n: index + 1 }) });
  el.winnerOverlay.hidden = false;
  window.setTimeout(() => (el.winnerOverlay.hidden = true), 1400);
}

function checkWinCondition() {
  let newWinner = -1;
  state.players.forEach((player, index) => {
    if (player.hand.length === 0 && !player.alreadyWon) {
      player.alreadyWon = true;
      newWinner = index;
    }
  });
  const empty = state.players.filter((player) => player.hand.length === 0).length;
  if (empty >= state.config.winners) {
    endMatch();
    return true;
  }
  if (newWinner >= 0) showWinnerBanner(newWinner);
  return false;
}

function nextTurn() {
  state.current = (state.current + 1) % state.players.length;
  render();
  resetTimer();
  saveMatch();
}

function revealFromPile(index) {
  if (!state.started || index !== state.activePile) return;
  const player = currentPlayer();
  if (!player.hand.length) return endMatch();
  const card = player.hand.pop();
  card.pose = window.CafardsDeck.makePose(state.piles[index].length, index);
  card.justRevealed = true;
  state.piles[index].push(card);
  if (card.type === "tabou") setActivePile(index ? 0 : 1);
  render();
  if (checkWinCondition()) return;
  nextTurn();
}

function collectCards(playerIndex) {
  if (!state.started) return;
  const collected = [...state.piles[0], ...state.piles[1]];
  if (!collected.length) return;
  const player = state.players[playerIndex];
  player.animateFrom = player.hand.length;
  player.hand.unshift(...window.CafardsDeck.shuffle(collected));
  player.animateTo = player.hand.length;
  player.losses += collected.length;
  state.piles = [[], []];
  setActivePile(0);
  render();
  if (checkWinCondition()) return;
  resetTimer();
  saveMatch();
}

function bindSetup() {
  el.startBtn.addEventListener("click", startGame);
  el.replayBtn.addEventListener("click", startGame);
  el.resumeBtn.addEventListener("click", resumeMatch);
  el.quitBtn.addEventListener("click", showDashboard);
  el.menuBtn.addEventListener("click", showDashboard);
  window.CafardsSetup.bind(el, t);
}

function bindPage() {
  el.pileHits.forEach((button, index) => button.addEventListener("click", () => revealFromPile(index)));
  el.langButtons.forEach((button) =>
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang;
      storeLanguage(state.lang);
      applyI18n();
      saveMatch();
    })
  );
  optionsPanelApi = window.GameHeader?.initOptionsPanel(el.optionsBtn, el.optionsPanel) || null;
  el.rulesSection.addEventListener("toggle", () => {
    if (el.rulesSection.open) el.rulesFrame.src = RULES[state.lang];
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveMatch();
  });
  window.addEventListener("pagehide", saveMatch);
}

function init() {
  cacheDom();
  bindSetup();
  bindPage();
  showScreen("setup");
  applyI18n();
  renderResume();
}

document.addEventListener("DOMContentLoaded", init);
