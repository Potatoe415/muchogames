/**
 * UI rendering for the Olemains game: deck choice, resume button, HUD,
 * screens, pause overlay, end screen.
 */

import { DOM } from './dom.js';
import { translate } from './i18n.js';

const TIMER_MIN = 10;
const TIMER_MAX = 300;
const TIMER_DEFAULT = 60;

/**
 * Color mapping utility
 * @param {string} colorString - Color name
 * @returns {string} Hex color code
 */
export function mapColor(colorString) {
  const colors = {
    green: '#28a745',
    orange: '#fd7e14',
    pink: '#e83e8c',
    blue: '#007bff'
  };
  return colors[colorString] || '#6c757d';
}

const deckDataId = (deck, index) =>
  `olemains-deck-${/^[a-z0-9-]+$/.test(deck.id || '') ? deck.id : index}`;

/**
 * Deck choice (one pressed at a time); the New game button starts it.
 * @param {Array} decks - Array of deck objects
 * @param {number} selected - Index of the chosen deck
 * @param {Function} onSelect - Called with the index of the deck tapped
 */
export function buildDeckMenu(decks, selected, onSelect) {
  DOM.deckGrid.innerHTML = '';
  decks.forEach((deck, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'om-deck';
    btn.dataset.id = deckDataId(deck, index);
    btn.textContent = deck.title;
    btn.style.backgroundColor = mapColor(deck.color);
    btn.addEventListener('click', () => onSelect(index));
    DOM.deckGrid.appendChild(btn);
  });
  markDeck(selected);
}

export function markDeck(selected) {
  [...DOM.deckGrid.children].forEach((btn, index) => {
    btn.setAttribute('aria-pressed', String(index === selected));
  });
}

/**
 * Show the resume button for a saved match, or hide it
 * @param {Object|null} match - Decoded save (see save.js)
 * @param {string} language - fr, en or es
 */
export function renderResume(match, language) {
  DOM.resumeButton.hidden = !match;
  if (!match) return;
  DOM.resumeButton.querySelector('[data-resume-title]').textContent =
    translate(language, 'resume');
  DOM.resumeButton.querySelector('[data-resume-info]').textContent =
    translate(language, 'resumeInfo', {
      deck: match.deck.title,
      seconds: match.timeLeft,
      score: match.score
    });
}

const clampTimer = (value) =>
  Math.min(TIMER_MAX, Math.max(TIMER_MIN, Math.round(value)));

/**
 * Read timer input value with validation
 * @returns {number} Valid timer duration (10-300 seconds)
 */
export function readTimerInput() {
  const raw = DOM.timerInput.valueAsNumber;
  return Number.isFinite(raw) ? clampTimer(raw) : TIMER_DEFAULT;
}

// − / + buttons: the remote and touch never need to type a number.
export function stepTimerInput(delta) {
  DOM.timerInput.value = String(clampTimer(readTimerInput() + delta));
}

export function updateHUD(score, timeLeft) {
  DOM.scoreDisplay.textContent = String(score);
  DOM.timerDisplay.textContent = String(timeLeft);
}

export function showWord(word) {
  DOM.wordDisplay.textContent = word;
}

export function setCardColor(bgColor) {
  DOM.cardBackground.style.backgroundColor = bgColor;
}

/**
 * One screen at a time: dashboard, play or gameover. The header's back
 * button (to the hub) becomes the ✖ (to the dashboard) during a match.
 */
export function showScreen(name) {
  const inMatch = name === 'play';
  DOM.setupView.hidden = name !== 'dashboard';
  DOM.gameView.hidden = !inMatch;
  DOM.gameOverView.hidden = name !== 'gameover';
  DOM.backButton.hidden = inMatch;
  DOM.btnQuit.hidden = !inMatch;
}

export function showPause(paused) {
  DOM.pauseOverlay.hidden = !paused;
}

/**
 * End screen copy
 * @param {string} reasonKey - deckEmpty or timeUp
 */
export function renderGameOver(reasonKey, score, language) {
  DOM.finalReason.textContent = translate(language, reasonKey);
  DOM.finalScore.textContent = translate(language, 'finalScore', { score });
}

export function showError(message, language) {
  DOM.errorText.textContent = translate(language, 'error', { message });
  DOM.errorText.hidden = false;
}
