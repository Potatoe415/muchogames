/**
 * Main game controller for Olemains: Game Dashboard (resume, timer, deck,
 * new game), match (timer, turns, pause), end screen, save and resume.
 */

import { loadRulesIfExists } from '../../shared/js/engine.js';

import { DOM } from './dom.js';
import { GameState } from './gameState.js';
import { applyCopy, readLanguage, storeLanguage } from './i18n.js';
import { clearMatch, loadMatch, storeMatch } from './save.js';
import { GameTimer } from './timer.js';
import {
  buildDeckMenu,
  mapColor,
  markDeck,
  readTimerInput,
  renderGameOver,
  renderResume,
  setCardColor,
  showError,
  showPause,
  showScreen,
  showWord,
  stepTimerInput,
  updateHUD
} from './ui.js';
import { isValidGameData } from './validation.js';

const GAME_ID = 'olemains';

class OlemainsGame {
  constructor() {
    this.gameState = new GameState();
    this.timer = new GameTimer();
    this.isGameActive = false;
    this.isStarting = false;
    this.isPaused = false;
    this.saved = null;
    this.selectedDeck = 0;
    this.endReason = null;
  }

  async init() {
    this.gameState.language = readLanguage();
    applyCopy(this.gameState.language);
    this.bindControls();
    this.bindPage();
    showScreen('dashboard');
    await this.refreshRules();
    try {
      await this.gameState.loadGameData();
      if (!isValidGameData(this.gameState.gameData)) {
        throw new Error('Invalid game data structure');
      }
      this.showDashboard();
      // Resume only shows once words.json is in: the remote lands on it.
      window.MuchogamesTv?.focusScreen();
    } catch (error) {
      console.error('Game initialization failed:', error);
      DOM.startButton.disabled = true;
      showError(error.message, this.gameState.language);
    }
  }

  bindControls() {
    DOM.btnValid.addEventListener('click', () => this.processTurn(1));
    DOM.btnPass.addEventListener('click', () => this.processTurn(0));
    DOM.btnQuit.addEventListener('click', () => this.quitGame());
    DOM.resumeButton.addEventListener('click', () => this.resumeGame());
    DOM.startButton.addEventListener('click', () => this.startGame());
    DOM.replayButton.addEventListener('click', () => this.startGame());
    DOM.menuButton.addEventListener('click', () => this.showDashboard());
    DOM.continueButton.addEventListener('click', () => this.continueGame());
    DOM.timerSteps.forEach((btn) => {
      btn.addEventListener('click', () => stepTimerInput(Number(btn.dataset.step)));
    });
    DOM.langButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.changeLanguage(btn.dataset.lang));
    });
  }

  bindPage() {
    window.GameHeader?.initOptionsPanel(DOM.optionsButton, DOM.optionsPanel);
    // Window capture runs before game-session.js's "Leave match?" dialog:
    // the clock stops while the players decide. Opening the options too.
    window.addEventListener('click', (event) => {
      if (event.target.closest?.('#btn-quit, #olemains-options-button')) this.pause();
    }, true);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
    window.addEventListener('pagehide', () => this.saveMatch());
  }

  async refreshRules() {
    const rulesHtml = await loadRulesIfExists(GAME_ID, this.gameState.language);
    DOM.rulesContent.innerHTML = rulesHtml || '';
  }

  // Words carry fr/en/es: the word on screen switches at once.
  changeLanguage(language) {
    this.gameState.language = language;
    storeLanguage(language);
    applyCopy(language);
    renderResume(this.saved, language);
    if (this.isGameActive) showWord(this.gameState.currentWordText());
    if (this.endReason) {
      renderGameOver(this.endReason, this.gameState.score, language);
    }
    void this.refreshRules();
  }

  decks() {
    return this.gameState.gameData?.decks || [];
  }

  showDashboard() {
    this.endReason = null;
    buildDeckMenu(this.decks(), this.selectedDeck, (index) => {
      this.selectedDeck = index;
      markDeck(index);
    });
    this.saved = loadMatch(this.decks());
    renderResume(this.saved, this.gameState.language);
    showScreen('dashboard');
  }

  // Only a match in play is stored; endGame has already cleared it.
  saveMatch() {
    if (this.isGameActive && this.gameState.timeLeft > 0) {
      storeMatch(this.gameState, this.decks());
    }
  }

  enterMatch(bgColor) {
    this.isGameActive = true;
    this.endReason = null;
    setCardColor(bgColor);
    this.updateDisplay();
    showScreen('play');
  }

  // A resumed match comes back paused: Continue restarts the clock.
  resumeGame() {
    if (this.isStarting || this.isGameActive) return;
    const saved = loadMatch(this.decks());
    if (!saved) return this.showDashboard();
    window.MuchogamesTv?.play();
    window.MuchogamesMatch.resume(GAME_ID);
    const bgColor = mapColor(saved.deck.color);
    this.gameState.restore(saved, bgColor);
    this.enterMatch(bgColor);
    showWord(this.gameState.currentWordText());
    this.saveMatch();
    this.isPaused = true;
    showPause(true);
  }

  async startGame() {
    const deck = this.decks()[this.selectedDeck];
    if (this.isStarting || this.isGameActive || !deck) return;
    window.MuchogamesTv?.play();
    this.isStarting = true;
    const allowed = await window.MuchogamesMatch.start(GAME_ID);
    this.isStarting = false;
    if (!allowed) return;
    const bgColor = mapColor(deck.color);
    this.gameState.startGame(deck, bgColor, readTimerInput());
    this.enterMatch(bgColor);
    this.pullNextWord();
    this.isPaused = false;
    showPause(false);
    this.startTimer();
    this.saveMatch();
  }

  pause() {
    if (!this.isGameActive || this.isPaused) return;
    this.timer.stop();
    this.isPaused = true;
    this.saveMatch();
    showPause(true);
  }

  continueGame() {
    if (!this.isGameActive || !this.isPaused) return;
    this.isPaused = false;
    showPause(false);
    this.startTimer();
  }

  processTurn(points) {
    if (!this.isGameActive || this.isPaused) return;
    this.gameState.updateScore(points);
    this.updateDisplay();
    this.pullNextWord();
    this.saveMatch();
  }

  pullNextWord() {
    if (this.gameState.isGameOver()) return this.endGame('deckEmpty');
    const nextWord = this.gameState.getNextWord();
    if (nextWord) showWord(nextWord);
  }

  startTimer() {
    this.timer.start(
      this.gameState.timeLeft,
      (remaining) => {
        this.gameState.timeLeft = remaining;
        this.updateDisplay();
        this.saveMatch();
      },
      () => this.endGame('timeUp')
    );
  }

  updateDisplay() {
    updateHUD(this.gameState.score, this.gameState.timeLeft);
  }

  // Real end (deck or clock ran out): the save goes, finish() once.
  endGame(reasonKey) {
    if (!this.isGameActive) return;
    clearMatch();
    this.saved = null;
    this.isGameActive = false;
    this.timer.stop();
    window.MuchogamesMatch.finish();
    this.endReason = reasonKey;
    renderGameOver(reasonKey, this.gameState.score, this.gameState.language);
    showPause(false);
    showScreen('gameover');
  }

  /**
   * ✖ confirmed (game-session.js asked first): quitting is not an end, no
   * finish(), the save stays and the dashboard offers Resume.
   */
  quitGame() {
    this.saveMatch();
    this.isGameActive = false;
    this.isPaused = false;
    this.timer.stop();
    showPause(false);
    this.gameState.reset();
    this.showDashboard();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void new OlemainsGame().init();
});
