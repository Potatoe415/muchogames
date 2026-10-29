/**
 * DOM element references and utilities for the Olemains game
 */

export const DOM = {
  setupView: document.getElementById('setup-view'),
  gameView: document.getElementById('game-view'),
  deckGrid: document.getElementById('deck-grid'),
  resumeButton: document.getElementById('olemains-resume-button'),
  timerInput: document.getElementById('timer-input'),
  wordDisplay: document.getElementById('current-word'),
  timerDisplay: document.getElementById('timer'),
  scoreDisplay: document.getElementById('score'),
  cardBackground: document.getElementById('card-background'),
  btnValid: document.getElementById('btn-valid'),
  btnPass: document.getElementById('btn-pass'),
  btnQuit: document.getElementById('btn-quit')
};

export function showElement(element) {
  element.classList.remove('hidden');
  element.classList.add('active');
}

export function hideElement(element) {
  element.classList.remove('active');
  element.classList.add('hidden');
}

export function setElementText(element, text) {
  element.textContent = text;
}

export function setElementStyle(element, styles) {
  Object.assign(element.style, styles);
}