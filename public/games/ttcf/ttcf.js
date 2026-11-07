// Game logic for TTCF: Game Dashboard (teams, resume), board, card dialog,
// win screen. The whole match lives in page.match and is saved after every
// step (store.js), so leaving by any route brings it back from the dashboard.
import { LAST, THEMES, TOKEN_ART, medallionArt, picture, renderBoard, spaceTheme, themeClass, walkToken } from './board.js';
import { COPY, LANGS, THEME_LABELS, translate } from './i18n.js';
import { clearMatch, hasMatch, loadMatch, readMode, storeMatch, storeMode } from './store.js';
import { createWheel } from './wheel.js';

const GAME_ID = 'ttcf';
const LANG_KEY = 'bergamots-lang';
const MAX_TEAMS = 8;
const TIMER_SECONDS = 30;
const SPECIAL_THEMES = ['Challenge', 'Débuter', 'Gagner', 'Superbe'];

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const page = {
  lang: readLang(),
  cards: [],
  names: [],
  count: 2,
  match: null,
  timer: null,
  // { id, pos, to, stop() }: the token on its way; page.match already holds
  // the arrival (saved), this is display only.
  walk: null,
  starting: false,
  // 'board' or 'wheel', chosen on the dashboard; a match keeps its own.
  mode: readMode(),
  wheel: null,
  spinning: false,
  turning: false,
  // Answer shown, card turned back to its question side (display only: not
  // saved, the timer goes on).
  peek: false,
  // The card side last drawn: a new side starts scrolled to its top.
  face: null
};

const t = (key, vars) => translate(page.lang, key, vars);

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.includes(saved) ? saved : 'fr';
  } catch {
    return 'fr';
  }
}

async function setLanguage(lang) {
  page.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
  applyLanguage();
  await loadCards(lang);
  if (page.lang !== lang) return;
  if (!$('ttcf-board-screen').hidden && page.match) renderMatch();
  else if (!$('ttcf-setup-screen').hidden) renderDashboard();
}

function applyLanguage() {
  const copy = COPY[page.lang];
  document.documentElement.lang = page.lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = copy[node.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', copy[node.dataset.i18nAria]);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    node.innerHTML = copy[node.dataset.i18nHtml];
  });
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === page.lang);
  });
  renderTeamInputs();
  if (page.match) renderMatch();
}

// --- Game Dashboard -------------------------------------------------------

function renderTeamInputs() {
  const list = $('ttcf-teams-list');
  list.replaceChildren(
    ...Array.from({ length: page.count }, (_, i) => {
      const row = document.createElement('div');
      row.className = 'team-input-row';
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 40;
      input.dataset.id = `ttcf-team-name-${i + 1}`;
      input.placeholder = t('teamN', { n: i + 1 });
      input.setAttribute('aria-label', t('teamName', { n: i + 1 }));
      input.value = page.names[i] ?? '';
      input.addEventListener('input', () => (page.names[i] = input.value));
      input.addEventListener('keydown', leaveInputWithArrows);
      row.append(picture(TOKEN_ART[i], 'team-avatar'), input);
      return row;
    })
  );
  // Past 4 teams the list goes to two columns (1-4, then 5-8).
  list.classList.toggle('is-two-columns', page.count > 4);
  $('ttcf-add-team-btn').hidden = page.count >= MAX_TEAMS;
}

// A text field keeps the arrows for itself (tv-remote.js too): Up / Down
// still move to the previous / next control of the dashboard.
function leaveInputWithArrows(event) {
  const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if (!step) return;
  const controls = [...$('ttcf-setup-screen').querySelectorAll('button, input')].filter(
    (el) => !el.disabled && !el.closest('[hidden]')
  );
  const next = controls[controls.indexOf(event.target) + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

function renderModes() {
  document.querySelectorAll('[data-mode]').forEach((chip) => {
    const on = chip.dataset.mode === page.mode;
    chip.classList.toggle('active', on);
    chip.setAttribute('aria-pressed', String(on));
  });
}

function setMode(mode) {
  page.mode = mode;
  storeMode(mode);
  renderModes();
}

function renderDashboard() {
  renderModes();
  const ready = page.cards.length > 0;
  $('ttcf-start-btn').disabled = !ready;
  $('ttcf-load-status').hidden = ready;
  // Resume shows (disabled) while the deck loads, so the acorn row, which
  // makes room for it, never flashes in and out (see index.html).
  const resume = $('ttcf-resume-button');
  resume.hidden = !(ready ? loadMatch(page.cards, LAST) : hasMatch(LAST));
  resume.disabled = !ready;
  $('ttcf-setup-hero').hidden = false;
}

function showScreen(name) {
  stopTimer();
  stopWalk(false);
  $('ttcf-setup-screen').hidden = name !== 'dashboard';
  $('ttcf-board-screen').hidden = name !== 'board';
  $('ttcf-win-screen').hidden = name !== 'win';
  $('game-back-button').hidden = name === 'board';
  $('ttcf-quit-button').hidden = name !== 'board';
  if (name !== 'board') $('ttcf-card-modal').hidden = true;
  if (name === 'dashboard') renderDashboard();
}

// --- Match ----------------------------------------------------------------

function teamNames() {
  return Array.from({ length: page.count }, (_, i) =>
    (page.names[i] ?? '').trim().slice(0, 40) || t('teamN', { n: i + 1 })
  );
}

async function startMatch(names) {
  if (page.starting || !page.cards.length) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  const started = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!started) return;
  // Every team starts on D; the Débuter card says which team plays first.
  page.match = { mode: page.mode, teams: names.map((name, id) => ({ id, name, pos: 0 })), cur: 0, card: null };
  showScreen('board');
  // The new match's board, not the last one's tokens, under the Débuter card.
  renderMatch();
  drawCard('Débuter', true);
}

function resumeMatch() {
  const saved = loadMatch(page.cards, LAST);
  if (!saved) return renderDashboard();
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  page.match = saved;
  page.mode = saved.mode;
  page.peek = false;
  showScreen('board');
  renderMatch();
  if (timed(saved.card)) startTimer();
}

function save() {
  if (page.match) storeMatch(page.match);
}

// Runs once game-session.js's "Leave match?" dialog is confirmed.
function quitMatch() {
  save();
  page.match = null;
  showScreen('dashboard');
}

function renderMatch() {
  const { teams, cur } = page.match;
  // While a token walks, the banner still shows the team that moves.
  const turn = page.walk?.id ?? cur;
  const label = document.createElement('span');
  label.textContent = t('turnOf', { name: teams[turn].name });
  $('ttcf-turn-indicator').replaceChildren(picture(TOKEN_ART[turn], 'turn-avatar'), label);
  const wheel = page.match.mode === 'wheel';
  $('ttcf-board-screen').classList.toggle('is-wheel', wheel);
  $('ttcf-board-area').hidden = wheel;
  $('ttcf-wheel-area').hidden = !wheel;
  if (wheel) {
    page.wheel ??= createWheel($('ttcf-wheel'), themeClass, {
      canSpin: () => Boolean(page.match && !page.match.card && !page.walk && !page.spinning),
      onFling: (landing) => playSpin(landing)
    });
    renderScores();
  } else renderBoard({ match: page.match, walk: page.walk, t, labels: THEME_LABELS[page.lang] });
  renderCard();
}

// Wheel mode: each team's acorn and how far it got (the same 42 steps).
function renderScores() {
  const { teams, cur } = page.match;
  $('ttcf-wheel-scores').replaceChildren(
    ...teams.map((team) => {
      const row = document.createElement('li');
      row.className = team.id === cur ? 'wheel-score is-current' : 'wheel-score';
      row.dataset.id = `ttcf-wheel-score-${team.id + 1}`;
      const name = document.createElement('span');
      name.className = 'wheel-score-name';
      name.textContent = team.name;
      const bar = document.createElement('span');
      bar.className = 'wheel-score-bar';
      bar.style.setProperty('--progress', String(team.pos / LAST));
      const pos = document.createElement('span');
      pos.className = 'wheel-score-pos';
      pos.textContent = `${team.pos}/${LAST}`;
      row.append(picture(TOKEN_ART[team.id], 'wheel-score-token'), name, bar, pos);
      return row;
    })
  );
}

// Spins, then draws a card of the theme it lands on (the Gagner card once
// the team reached the end). Not saved until it lands: a reload mid-spin
// just shows the wheel again.
function spinWheel() {
  if (!page.match || page.match.card || page.walk || page.spinning || page.wheel.isBusy()) return;
  playSpin(page.wheel.spin(reducedMotion()));
}

// landing: the wheel's promise (button or swipe), resolving with a theme.
async function playSpin(landing) {
  const match = page.match;
  page.spinning = true;
  $('ttcf-spin-btn').disabled = true;
  const theme = await landing;
  page.spinning = false;
  $('ttcf-spin-btn').disabled = false;
  if (page.match !== match || match.card) return;
  const team = match.teams[match.cur];
  drawCard(team.pos >= LAST ? 'Gagner' : theme);
}

// bonus: the Superbe card whose rule this card is played under.
function drawCard(theme = spaceTheme(page.match.teams[page.match.cur].pos), opening = false, bonus = null) {
  // A skipped card is not drawn again straight away.
  const previous = page.match.card?.index;
  const same = page.cards.map((card, index) => ({ card, index })).filter(({ card }) => card.theme.toLowerCase() === theme.toLowerCase());
  const pool = same.length > 1 ? same.filter(({ index }) => index !== previous) : same;
  const index = pool.length
    ? pool[Math.floor(Math.random() * pool.length)].index
    : Math.floor(Math.random() * page.cards.length);
  const superbe = page.cards[index].theme === 'Superbe';
  const direct = opening || (SPECIAL_THEMES.includes(theme) && !superbe) || !page.cards[index].questions[0].level;
  const step = superbe ? 'bonus' : direct ? 'question' : 'eval';
  page.match.card = { index, theme, step, note: null, opening, timeLeft: TIMER_SECONDS, move: 0, bonus };
  page.peek = false;
  save();
  renderCard();
  // The Débuter card has no 30 s timer.
  if (step === 'question' && !opening) startTimer();
}

// A Superbe card names its theme (`imposed`, set in every language's deck) or
// leaves it free: the themes the team may play.
function bonusThemes(index) {
  const imposed = page.cards[index].questions[0].imposed;
  return imposed ? [imposed] : THEMES;
}

// The Superbe card's rule, then a card of the chosen theme under it.
function renderBonus(card) {
  const themes = bonusThemes(card.index);
  const labels = THEME_LABELS[page.lang];
  $('ttcf-bonus-theme').textContent = themes.length === 1 ? t('bonusImposed', { theme: labels[themes[0]] }) : t('bonusFree');
  $('ttcf-bonus-text').textContent = page.cards[card.index].questions[0].a || '';
  $('ttcf-bonus-choices').replaceChildren(
    ...themes.map((theme, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn bonus-choice ${themeClass(theme)}`;
      btn.dataset.id = `ttcf-bonus-play-${themeClass(theme)}`;
      if (i === 0) btn.dataset.tvFocus = '';
      btn.textContent = themes.length === 1 ? t('bonusPlay', { theme: labels[theme] }) : labels[theme];
      btn.addEventListener('click', () => playBonus(theme));
      return btn;
    })
  );
}

function playBonus(theme) {
  const card = page.match?.card;
  if (!card || card.step !== 'bonus' || !bonusThemes(card.index).includes(theme)) return;
  drawCard(theme, false, card.index);
}

// On the card played under a Superbe rule: the rule stays in sight.
function renderBonusRule(card) {
  const rule = $('ttcf-bonus-rule');
  rule.hidden = card.bonus == null;
  if (card.bonus == null) return;
  const bonus = page.cards[card.bonus];
  const title = document.createElement('strong');
  title.textContent = t('bonusRule', { subject: bonus.subject });
  rule.replaceChildren(title, document.createTextNode(` ${bonus.questions[0].a || ''}`));
}

function cardQuestion(card) {
  const { questions } = page.cards[card.index];
  return card.note === null ? questions[0] : questions.find((q) => parseInt(q.level, 10) === card.note);
}

function renderCard() {
  const card = page.match.card;
  $('ttcf-card-modal').hidden = !card;
  const wheel = page.match.mode === 'wheel';
  $('ttcf-draw-card-btn').hidden = Boolean(card || page.walk || wheel);
  $('ttcf-spin-btn').hidden = Boolean(card || !wheel);
  if (!card) {
    page.peek = false;
    page.face = null;
    return;
  }
  const data = page.cards[card.index];
  const theme = $('ttcf-card-theme');
  theme.textContent = THEME_LABELS[page.lang][data.theme] || data.theme;
  theme.className = `card-theme ${themeClass(data.theme)}`;
  $('ttcf-card-medallion').src = medallionArt(data.theme);
  $('ttcf-card-modal').dataset.theme = themeClass(data.theme);
  $('ttcf-card-subject').textContent = data.subject || '';
  const q = cardQuestion(card);
  $('ttcf-selected-note').textContent = card.note ? t('level', { n: card.note }) : THEME_LABELS[page.lang][card.theme] || card.theme;
  $('ttcf-card-question').textContent = q ? q.q : t('noQuestion');
  $('ttcf-card-answer').textContent = q ? q.a : t('noAnswer');
  // The Débuter card is an instruction, not a question: it shows with its
  // answer at once, and only the button to the board.
  const step = card.opening ? 'answer' : card.step;
  const flippable = step === 'answer' && !card.opening;
  // The side on show: the question again while the answer card is turned back.
  const face = flippable && page.peek ? 'question' : step;
  // A long question is scrolled down to reach its button: the other side
  // (the answer) must start at its top, or its first lines stay out of sight.
  if (face !== page.face) $('ttcf-card-modal').querySelector('.modal-content').scrollTop = 0;
  page.face = face;
  $('ttcf-card-modal').classList.toggle('is-opening', card.opening);
  $('ttcf-bonus-step').hidden = face !== 'bonus';
  if (face === 'bonus') renderBonus(card);
  renderBonusRule(card);
  $('ttcf-eval-step').hidden = face !== 'eval';
  $('ttcf-question-step').hidden = face !== 'question' && !card.opening;
  $('ttcf-answer-step').hidden = face !== 'answer';
  $('ttcf-card-flip').hidden = !flippable;
  $('ttcf-timer').hidden = !timed(card);
  paintTimer(card);
  if (face === 'answer') renderAnswerButtons(card);
  // Until the answer shows, the question can be skipped or cancelled.
  const open = !card.opening && step !== 'answer';
  $('ttcf-card-close').hidden = !open;
  $('ttcf-skip-btn').hidden = !open;
  // A new step: the focus moves to its main button (TV remote).
  setTimeout(() => window.MuchogamesTv?.focusScreen(), 0);
}

function renderAnswerButtons(card) {
  // Challenge and Superbe rules move by their own count: set with + and −.
  const manual = (card.bonus != null || SPECIAL_THEMES.includes(card.theme)) && card.theme !== 'Gagner' && !card.opening;
  $('ttcf-manual-move').hidden = !manual;
  document.getElementById('validationButtons').hidden = manual;
  $('ttcf-move-value').textContent = String(card.move);
  const fail = $('ttcf-fail-btn');
  const success = $('ttcf-success-btn');
  fail.hidden = card.opening;
  if (card.opening) success.textContent = t(page.match.mode === 'wheel' ? 'toWheel' : 'toBoard');
  else if (card.theme === 'Gagner') {
    fail.textContent = t('failStay');
    success.textContent = t('successWin');
  } else {
    fail.textContent = t('fail');
    success.textContent = t('success', { n: card.note ?? 1 });
  }
}

function selectNote(note) {
  const card = page.match?.card;
  if (!card || card.step !== 'eval') return;
  // Under a Superbe rule the move starts at the rating, then + and −.
  Object.assign(card, { note, step: 'question', timeLeft: TIMER_SECONDS, move: card.bonus != null ? note : card.move });
  save();
  renderCard();
  startTimer();
}

function paintTimer(card) {
  document.getElementById('timerFill').style.width = card.opening ? '100%' : `${(card.timeLeft / TIMER_SECONDS) * 100}%`;
}

// The 30 s run from the question on, through the answer and any turn of the
// card, until the turn ends (not on Débuter, nor on a Superbe rule or a rating).
const timed = (card) => Boolean(card && !card.opening && (card.step === 'question' || card.step === 'answer'));

function startTimer() {
  stopTimer();
  page.timer = setInterval(() => {
    const card = page.match?.card;
    if (!timed(card) || card.timeLeft <= 0) return stopTimer();
    card.timeLeft--;
    paintTimer(card);
    save();
  }, 1000);
}

function stopTimer() {
  clearInterval(page.timer);
  page.timer = null;
}

// ✕: no card any more, the same team draws (or spins) again.
function cancelCard() {
  const card = page.match?.card;
  if (!card || card.opening || card.step === 'answer') return;
  stopTimer();
  page.match.card = null;
  save();
  renderMatch();
}

// "Passer la question": another card of the same theme, same team.
function skipCard() {
  const card = page.match?.card;
  if (!card || card.opening || card.step === 'answer') return;
  stopTimer();
  drawCard(card.theme, false, card.bonus ?? null);
}

function showAnswer() {
  const card = page.match?.card;
  if (page.peek) return flipBack();
  if (!card || card.step !== 'question') return;
  card.step = 'answer';
  save();
  turnCard(renderCard);
}

// The ↺ button on the answer side: the card turns back to its question, and
// again to its answer. The timer goes on.
function flipBack() {
  const card = page.match?.card;
  if (!card || card.opening || card.step !== 'answer' || page.turning) return;
  page.peek = !page.peek;
  turnCard(renderCard);
}

// The card turns over (a quarter turn, the new side drawn edge-on, then the
// last quarter); with reduced motion it just changes side.
function turnCard(paint) {
  const el = $('ttcf-card-modal').querySelector('.modal-content');
  if (reducedMotion() || !el.animate) return paint();
  page.turning = true;
  const half = (from, to, easing) =>
    el.animate([{ transform: `perspective(1200px) rotateY(${from}deg)` }, { transform: `perspective(1200px) rotateY(${to}deg)` }], { duration: 200, easing }).finished;
  half(0, 90, 'ease-in')
    .then(() => {
      paint();
      return half(-90, 0, 'ease-out');
    })
    .catch(paint)
    .finally(() => {
      page.turning = false;
    });
}

function changeMove(step) {
  const card = page.match?.card;
  if (!card) return;
  card.move = Math.max(-LAST, Math.min(LAST, card.move + step));
  $('ttcf-move-value').textContent = String(card.move);
  save();
}

function endTurn(moveBy) {
  const match = page.match;
  if (!match?.card) return;
  const { opening } = match.card;
  stopTimer();
  match.card = null;
  const team = match.teams[match.cur];
  const from = team.pos;
  // Just dismissed the Débuter card: the first team now plays.
  if (!opening && team.pos >= LAST && moveBy > 0) return winMatch(team);
  if (!opening && team.pos < LAST) team.pos = Math.min(LAST, Math.max(0, team.pos + moveBy));
  if (!opening) match.cur = (match.cur + 1) % match.teams.length;
  save();
  if (team.pos !== from && !reducedMotion() && match.mode !== 'wheel') {
    // The arrival is saved; the walk is display only, then the next team's turn shows.
    walkToken(team.id, from, team.pos, {
      onStart: (walk) => {
        page.walk = walk;
        renderMatch();
      },
      onEnd: () => stopWalk(true)
    });
    return;
  }
  renderMatch();
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function stopWalk(render) {
  if (!page.walk) return;
  page.walk.stop();
  page.walk = null;
  if (render && page.match) renderMatch();
}

// A party game with several teams on one device: "started" only, no won
// or lost (docs/PLATFORM_RULES.md section 4.4).
function winMatch(team) {
  const names = page.match.teams.map((t) => t.name);
  page.match = null;
  clearMatch();
  window.MuchogamesMatch.finish();
  page.names = names;
  page.count = names.length;
  $('ttcf-winner-name').textContent = team.name;
  $('ttcf-winner-token').src = TOKEN_ART[team.id];
  showScreen('win');
}

// --- Wiring ---------------------------------------------------------------

function bindControls() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });
  const evalGrid = $('ttcf-eval-grid');
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eval-btn';
    btn.dataset.id = `ttcf-eval-${i}`;
    if (i === 1) btn.dataset.tvFocus = '';
    btn.textContent = i;
    btn.addEventListener('click', () => selectNote(i));
    evalGrid.appendChild(btn);
  }
  const actions = {
    'ttcf-add-team-btn': () => {
      page.count = Math.min(MAX_TEAMS, page.count + 1);
      renderTeamInputs();
      $(`ttcf-team-name-${page.count}`)?.focus();
    },
    'ttcf-start-btn': () => startMatch(teamNames()),
    'ttcf-resume-button': resumeMatch,
    'ttcf-quit-button': quitMatch,
    'ttcf-draw-card-btn': () => page.match && !page.match.card && !page.walk && drawCard(),
    'ttcf-spin-btn': spinWheel,
    'ttcf-mode-board': () => setMode('board'),
    'ttcf-mode-wheel': () => setMode('wheel'),
    'ttcf-show-answer-btn': showAnswer,
    'ttcf-card-close': cancelCard,
    'ttcf-card-flip': flipBack,
    'ttcf-skip-btn': skipCard,
    'ttcf-fail-btn': () => endTurn(0),
    'ttcf-success-btn': () => endTurn(page.match?.card?.note ?? 1),
    'ttcf-move-less': () => changeMove(-1),
    'ttcf-move-more': () => changeMove(1),
    'ttcf-move-confirm': () => endTurn(page.match?.card?.move ?? 0),
    'ttcf-restart-btn': () => startMatch(teamNames()),
    'ttcf-menu-button': () => showScreen('dashboard')
  };
  Object.entries(actions).forEach(([id, fn]) => $(id).addEventListener('click', fn));
}

// One deck per language, same card order in each (a save's card index works in all).
async function loadCards(lang) {
  try {
    const res = await fetch(`/data/ttcf/ttcf_data_${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const cards = (data.cards || []).filter((card) => typeof card?.theme === 'string' && Array.isArray(card.questions) && card.questions.length);
    if (page.lang === lang) page.cards = cards;
  } catch (error) {
    console.warn('[ttcf] cards not loaded', error);
  }
}

async function init() {
  window.GameHeader?.initOptionsPanel(document.getElementById('settingsButton'), document.getElementById('settingsPanel'));
  bindControls();
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
  applyLanguage();
  showScreen('dashboard');
  await loadCards(page.lang);
  renderDashboard();
  // The start button was disabled while loading: the remote focus moves to
  // it (or to Resume) now, instead of staying on the back button.
  if (!$('ttcf-setup-screen').hidden) window.MuchogamesTv?.focusScreen();
}

init();
