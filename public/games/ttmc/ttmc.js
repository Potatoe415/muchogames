// Game logic for TTMC: Game Dashboard (teams, resume), board, card dialog,
// win screen. The whole match lives in page.match and is saved after every
// step (store.js), so leaving by any route brings it back from the dashboard.
import { COPY, LANGS, THEME_LABELS, translate } from './i18n.js';
import { clearMatch, loadMatch, storeMatch } from './store.js';

const GAME_ID = 'ttmc';
const LANG_KEY = 'bergamots-lang';
const MAX_TEAMS = 8;
const TIMER_SECONDS = 30;
// Token walk after a move: one space per step, the whole walk in about
// WALK_MS, each step between STEP_MIN_MS and STEP_MAX_MS.
const WALK_MS = 1800;
const STEP_MIN_MS = 70;
const STEP_MAX_MS = 200;
const THEMES = ['Improbable', 'Mature', 'Plaisir', 'Scolaire'];
const SPECIAL_THEMES = ['Challenge', 'Débuter', 'Gagner', 'Superbe'];

const BOARD_TRACK = ['Débuter'];
let themeIdx = 0;
for (let i = 1; i <= 41; i++) {
  if (i % 10 === 5) BOARD_TRACK.push('Challenge');
  else if (i % 10 === 0) BOARD_TRACK.push('Superbe');
  else {
    BOARD_TRACK.push(THEMES[themeIdx % THEMES.length]);
    themeIdx++;
  }
}
BOARD_TRACK.push('Gagner'); // 42
const LAST = BOARD_TRACK.length - 1;

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
// Art in ./assets (cut by scripts/ttmc_slice.py; icons/ drawn by hand).
const TOKEN_ART = ['red', 'blue', 'yellow', 'purple', 'orange', 'green', 'pink', 'brown'].map(
  (c) => `./assets/token-${c}.webp`
);
const ICON_THEMES = ['Improbable', 'Mature', 'Plaisir', 'Scolaire', 'Challenge', 'Superbe'];

const page = {
  lang: readLang(),
  cards: [],
  names: [],
  count: 2,
  match: null,
  timer: null,
  // { id, pos, to, timer }: the token on its way; page.match already holds
  // the arrival (saved), this is display only.
  walk: null,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const themeClass = (theme) => theme.toLowerCase().replace(/é/g, 'e').replace(/ /g, '-');
const medallionArt = (theme) => `./assets/medallions/${themeClass(theme)}.webp`;

function picture(src, className) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.className = className;
  img.draggable = false;
  return img;
}

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.includes(saved) ? saved : 'fr';
  } catch {
    return 'fr';
  }
}

function setLanguage(lang) {
  page.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
  applyLanguage();
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
  const list = $('ttmc-teams-list');
  list.replaceChildren(
    ...Array.from({ length: page.count }, (_, i) => {
      const row = document.createElement('div');
      row.className = 'team-input-row';
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 40;
      input.dataset.id = `ttmc-team-name-${i + 1}`;
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
  $('ttmc-add-team-btn').hidden = page.count >= MAX_TEAMS;
}

// A text field keeps the arrows for itself (tv-remote.js too): Up / Down
// still move to the previous / next control of the dashboard.
function leaveInputWithArrows(event) {
  const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if (!step) return;
  const controls = [...$('ttmc-setup-screen').querySelectorAll('button, input')].filter(
    (el) => !el.disabled && !el.closest('[hidden]')
  );
  const next = controls[controls.indexOf(event.target) + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

function renderDashboard() {
  const ready = page.cards.length > 0;
  $('ttmc-start-btn').disabled = !ready;
  $('ttmc-load-status').hidden = ready;
  $('ttmc-resume-button').hidden = !ready || !loadMatch(page.cards, LAST);
}

function showScreen(name) {
  stopTimer();
  stopWalk(false);
  $('ttmc-setup-screen').hidden = name !== 'dashboard';
  $('ttmc-board-screen').hidden = name !== 'board';
  $('ttmc-win-screen').hidden = name !== 'win';
  $('game-back-button').hidden = name === 'board';
  $('ttmc-quit-button').hidden = name !== 'board';
  if (name !== 'board') $('ttmc-card-modal').hidden = true;
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
  // Every team starts on case 1, after the Débuter card.
  page.match = { teams: names.map((name, id) => ({ id, name, pos: 1 })), cur: 0, card: null };
  showScreen('board');
  drawCard('Débuter', true);
}

function resumeMatch() {
  const saved = loadMatch(page.cards, LAST);
  if (!saved) return renderDashboard();
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  page.match = saved;
  showScreen('board');
  renderMatch();
  if (saved.card?.step === 'question' && !saved.card.opening) startTimer();
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
  $('ttmc-turn-indicator').replaceChildren(picture(TOKEN_ART[turn], 'turn-avatar'), label);
  renderBoard();
  renderCard();
}

function renderBoard() {
  const track = $('ttmc-board-track');
  track.replaceChildren();
  BOARD_TRACK.forEach((theme, i) => {
    const space = document.createElement('div');
    space.className = `board-space ${themeClass(theme)}`;
    space.dataset.id = `ttmc-space-${i}`;
    space.title = THEME_LABELS[page.lang][theme] || theme;
    const badge = document.createElement('span');
    badge.className = 'space-badge';
    if (i === 0) badge.textContent = t('markStart');
    else if (i === LAST) badge.textContent = t('markEnd');
    else if (theme === 'Challenge') badge.textContent = t('markChallenge');
    else if (theme === 'Superbe') badge.textContent = t('markSuperbe');
    else badge.textContent = i;
    const art = ICON_THEMES.includes(theme)
      ? picture(`./assets/icons/${themeClass(theme)}.svg`, 'space-icon')
      : picture(medallionArt(theme), 'space-medallion');
    const tokens = document.createElement('div');
    tokens.className = 'space-tokens';
    page.match.teams.forEach((team) => {
      if (tokenPos(team) !== i) return;
      const token = picture(TOKEN_ART[team.id], tokenClass(team));
      token.dataset.id = `ttmc-team-token-${team.id + 1}`;
      token.alt = team.name;
      tokens.appendChild(token);
    });
    fitTokens(tokens);
    space.append(art, badge, tokens);
    track.appendChild(space);
  });
}

// Up to 4 tokens on a space share one overlapping row; more take two rows.
function fitTokens(tokens) {
  const count = tokens.children.length;
  tokens.style.setProperty('--n', String(Math.max(1, count)));
  tokens.classList.toggle('is-crowded', count > 4);
}

function tokenPos(team) {
  return page.walk?.id === team.id ? page.walk.pos : team.pos;
}

function tokenClass(team) {
  if (page.walk) return page.walk.id === team.id ? 'team-token is-walking' : 'team-token';
  return team.id === page.match.cur ? 'team-token is-current' : 'team-token';
}

function getSpaceTheme(pos) {
  if (pos >= LAST) return 'Gagner';
  return BOARD_TRACK[pos] || 'Improbable';
}

function drawCard(theme = getSpaceTheme(page.match.teams[page.match.cur].pos), opening = false) {
  const pool = page.cards.map((card, index) => ({ card, index })).filter(({ card }) => card.theme.toLowerCase() === theme.toLowerCase());
  const index = pool.length
    ? pool[Math.floor(Math.random() * pool.length)].index
    : Math.floor(Math.random() * page.cards.length);
  const direct = opening || SPECIAL_THEMES.includes(theme) || !page.cards[index].questions[0].level;
  page.match.card = { index, theme, step: direct ? 'question' : 'eval', note: null, opening, timeLeft: TIMER_SECONDS, move: 0 };
  save();
  renderCard();
  // The Débuter card has no 30 s timer.
  if (direct && !opening) startTimer();
}

function cardQuestion(card) {
  const { questions } = page.cards[card.index];
  return card.note === null ? questions[0] : questions.find((q) => parseInt(q.level, 10) === card.note);
}

function renderCard() {
  const card = page.match.card;
  $('ttmc-card-modal').hidden = !card;
  $('ttmc-draw-card-btn').hidden = Boolean(card || page.walk);
  if (!card) return;
  const data = page.cards[card.index];
  const theme = $('ttmc-card-theme');
  theme.textContent = THEME_LABELS[page.lang][data.theme] || data.theme;
  theme.className = `card-theme ${themeClass(data.theme)}`;
  $('ttmc-card-medallion').src = medallionArt(data.theme);
  $('ttmc-card-modal').dataset.theme = themeClass(data.theme);
  $('ttmc-card-subject').textContent = data.subject || '';
  const q = cardQuestion(card);
  $('ttmc-selected-note').textContent = card.note ? t('level', { n: card.note }) : THEME_LABELS[page.lang][card.theme] || card.theme;
  $('ttmc-card-question').textContent = q ? q.q : t('noQuestion');
  $('ttmc-card-answer').textContent = q ? q.a : t('noAnswer');
  $('ttmc-eval-step').hidden = card.step !== 'eval';
  $('ttmc-question-step').hidden = card.step !== 'question';
  $('ttmc-answer-step').hidden = card.step !== 'answer';
  paintTimer(card);
  if (card.step === 'answer') renderAnswerButtons(card);
  // A new step: the focus moves to its main button (TV remote).
  setTimeout(() => window.MuchogamesTv?.focusScreen(), 0);
}

function renderAnswerButtons(card) {
  const manual = SPECIAL_THEMES.includes(card.theme) && card.theme !== 'Gagner' && !card.opening;
  $('ttmc-manual-move').hidden = !manual;
  document.getElementById('validationButtons').hidden = manual;
  $('ttmc-move-value').textContent = String(card.move);
  const fail = $('ttmc-fail-btn');
  const success = $('ttmc-success-btn');
  fail.hidden = card.opening;
  if (card.opening) success.textContent = t('toBoard');
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
  Object.assign(card, { note, step: 'question', timeLeft: TIMER_SECONDS });
  save();
  renderCard();
  startTimer();
}

function paintTimer(card) {
  document.getElementById('timerFill').style.width = card.opening ? '100%' : `${(card.timeLeft / TIMER_SECONDS) * 100}%`;
}

function startTimer() {
  stopTimer();
  page.timer = setInterval(() => {
    const card = page.match?.card;
    if (!card || card.step !== 'question' || card.timeLeft <= 0) return stopTimer();
    card.timeLeft--;
    paintTimer(card);
    save();
  }, 1000);
}

function stopTimer() {
  clearInterval(page.timer);
  page.timer = null;
}

function showAnswer() {
  const card = page.match?.card;
  if (!card || card.step !== 'question') return;
  stopTimer();
  card.step = 'answer';
  save();
  renderCard();
}

function changeMove(step) {
  const card = page.match?.card;
  if (!card) return;
  card.move = Math.max(-LAST, Math.min(LAST, card.move + step));
  $('ttmc-move-value').textContent = String(card.move);
  save();
}

function endTurn(moveBy) {
  const match = page.match;
  if (!match?.card) return;
  const { opening } = match.card;
  match.card = null;
  const team = match.teams[match.cur];
  const from = team.pos;
  // Just dismissed the Débuter card: the first team now plays.
  if (!opening && team.pos >= LAST && moveBy > 0) return winMatch(team);
  if (!opening && team.pos < LAST) team.pos = Math.min(LAST, Math.max(1, team.pos + moveBy));
  if (!opening) match.cur = (match.cur + 1) % match.teams.length;
  save();
  if (team.pos !== from && !reducedMotion()) return walkToken(team, from);
  renderMatch();
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The token goes space by space to team.pos (already saved), then the next
// team's turn shows.
function walkToken(team, from) {
  const steps = Math.abs(team.pos - from);
  const stepMs = Math.max(STEP_MIN_MS, Math.min(STEP_MAX_MS, WALK_MS / steps));
  page.walk = { id: team.id, pos: from, to: team.pos, timer: null };
  renderMatch();
  page.walk.timer = setInterval(() => {
    const walk = page.walk;
    walk.pos += Math.sign(walk.to - walk.pos);
    stepToken(walk, stepMs);
    if (walk.pos !== walk.to) return;
    clearInterval(walk.timer);
    setTimeout(() => page.walk === walk && stopWalk(true), stepMs);
  }, stepMs);
}

// Moves the token element into the next space and slides it there with a
// small hop (FLIP: measured before and after the move).
function stepToken(walk, stepMs) {
  const token = $(`ttmc-team-token-${walk.id + 1}`);
  const target = $(`ttmc-space-${walk.pos}`)?.querySelector('.space-tokens');
  if (!token || !target) return;
  const before = token.getBoundingClientRect();
  const source = token.parentElement;
  target.append(token);
  fitTokens(source);
  fitTokens(target);
  const after = token.getBoundingClientRect();
  const dx = before.left - after.left;
  const dy = before.top - after.top;
  const lift = after.height * 0.45;
  token.animate(
    [
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: `translate(${dx / 2}px, ${dy / 2 - lift}px)` },
      { transform: 'none' }
    ],
    { duration: stepMs * 0.9, easing: 'ease-out' }
  );
}

function stopWalk(render) {
  if (!page.walk) return;
  clearInterval(page.walk.timer);
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
  $('ttmc-winner-name').textContent = team.name;
  $('ttmc-winner-token').src = TOKEN_ART[team.id];
  showScreen('win');
}

// --- Wiring ---------------------------------------------------------------

function bindControls() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });
  const evalGrid = $('ttmc-eval-grid');
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eval-btn';
    btn.dataset.id = `ttmc-eval-${i}`;
    if (i === 1) btn.dataset.tvFocus = '';
    btn.textContent = i;
    btn.addEventListener('click', () => selectNote(i));
    evalGrid.appendChild(btn);
  }
  const actions = {
    'ttmc-add-team-btn': () => {
      page.count = Math.min(MAX_TEAMS, page.count + 1);
      renderTeamInputs();
      $(`ttmc-team-name-${page.count}`)?.focus();
    },
    'ttmc-start-btn': () => startMatch(teamNames()),
    'ttmc-resume-button': resumeMatch,
    'ttmc-quit-button': quitMatch,
    'ttmc-draw-card-btn': () => page.match && !page.match.card && !page.walk && drawCard(),
    'ttmc-show-answer-btn': showAnswer,
    'ttmc-fail-btn': () => endTurn(0),
    'ttmc-success-btn': () => endTurn(page.match?.card?.note ?? 1),
    'ttmc-move-less': () => changeMove(-1),
    'ttmc-move-more': () => changeMove(1),
    'ttmc-move-confirm': () => endTurn(page.match?.card?.move ?? 0),
    'ttmc-restart-btn': () => startMatch(teamNames()),
    'ttmc-menu-button': () => showScreen('dashboard')
  };
  Object.entries(actions).forEach(([id, fn]) => $(id).addEventListener('click', fn));
}

async function loadCards() {
  try {
    const res = await fetch('/data/ttmc/ttmc_data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    page.cards = (data.cards || []).filter((card) => typeof card?.theme === 'string' && Array.isArray(card.questions) && card.questions.length);
  } catch (error) {
    console.warn('[ttmc] cards not loaded', error);
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
  await loadCards();
  renderDashboard();
  // The start button was disabled while loading: the remote focus moves to
  // it (or to Resume) now, instead of staying on the back button.
  if (!$('ttmc-setup-screen').hidden) window.MuchogamesTv?.focusScreen();
}

init();
