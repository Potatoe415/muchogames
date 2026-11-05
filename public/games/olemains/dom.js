/**
 * DOM element references for the Olemains game
 */

const byId = (dataId) => document.querySelector(`[data-id="${dataId}"]`);

export const DOM = {
  setupView: document.getElementById('setup-view'),
  gameView: document.getElementById('game-view'),
  gameOverView: byId('olemains-gameover-screen'),
  backButton: byId('game-back-button'),
  optionsButton: document.getElementById('olemains-options-button'),
  optionsPanel: document.getElementById('olemains-options-panel'),
  rulesSection: document.getElementById('olemains-rules-section'),
  rulesContent: document.getElementById('olemains-rules-content'),
  langButtons: [...document.querySelectorAll('.lang-btn')],
  deckGrid: document.getElementById('deck-grid'),
  resumeButton: document.getElementById('olemains-resume-button'),
  startButton: document.getElementById('olemains-start-button'),
  errorText: document.getElementById('olemains-error'),
  timerInput: document.getElementById('timer-input'),
  timerSteps: [...document.querySelectorAll('.om-step')],
  wordDisplay: document.getElementById('current-word'),
  timerDisplay: document.getElementById('timer'),
  scoreDisplay: document.getElementById('score'),
  cardBackground: document.getElementById('card-background'),
  btnValid: document.getElementById('btn-valid'),
  btnPass: document.getElementById('btn-pass'),
  btnQuit: document.getElementById('btn-quit'),
  pauseOverlay: byId('olemains-pause-overlay'),
  continueButton: byId('olemains-continue-button'),
  finalReason: byId('olemains-final-reason'),
  finalScore: byId('olemains-final-score'),
  replayButton: byId('olemains-replay-button'),
  menuButton: byId('olemains-menu-button')
};
