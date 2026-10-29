/**
 * Main game controller for Olemains
 * Coordinates game state, UI, and timer
 */

import { DOM } from './dom.js';
import { GameState } from './gameState.js';
import { clearMatch, loadMatch, storeMatch } from './save.js';
import { GameTimer } from './timer.js';
import { buildDeckMenu, mapColor, readTimerInput, renderResume, updateHUD, showGameOver, showWord, showSetupView, showGameView, showError } from './ui.js';
import { isValidGameData } from './validation.js';
import { loadRulesIfExists } from '../../shared/js/engine.js';

function readHubLanguage() {
  try {
    const stored = localStorage.getItem('bergamots-lang');
    return ['fr', 'en', 'es'].includes(stored) ? stored : 'fr';
  } catch {
    return 'fr';
  }
}

class OlemainsGame {
  constructor() {
    this.gameState = new GameState();
    this.timer = new GameTimer();
    this.isGameActive = false;
    this.rulesHtml = null;
    this.saved = null;
    this.endTimer = null;
  }

  /**
   * Initialize the game
   */
  async init() {
    document.documentElement.lang = readHubLanguage();
    this.gameState.language = document.documentElement.lang;

    this.setupEventListeners();
    await this.initRulesSupport();
    
    try {
      await this.gameState.loadGameData();
      
      if (!isValidGameData(this.gameState.gameData)) {
        throw new Error('Invalid game data structure');
      }
      
      this.showDeckSelection();
    } catch (error) {
      console.error('Game initialization failed:', error);
      showError(error.message);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    DOM.btnValid.addEventListener('click', () => this.processTurn(1));
    DOM.btnPass.addEventListener('click', () => this.processTurn(0));
    DOM.btnQuit.addEventListener('click', () => this.quitGame());
    DOM.resumeButton.addEventListener('click', () => this.resumeGame());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.saveMatch();
    });
    window.addEventListener('pagehide', () => this.saveMatch());
  }

  async initRulesSupport() {
    const button = document.getElementById('olemains-options-button');
    const panel = document.getElementById('olemains-options-panel');
    if (window.GameHeader) {
      window.GameHeader.initOptionsPanel(button, panel);
    }
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.changeLanguage(btn.dataset.lang));
    });
    this.markActiveLanguage();
    await this.refreshRules();
  }

  async refreshRules() {
    const section = document.getElementById('olemains-rules-section');
    const content = document.getElementById('olemains-rules-content');
    this.rulesHtml = await loadRulesIfExists('olemains', this.gameState.language);
    section.style.display = this.rulesHtml ? '' : 'none';
    content.innerHTML = this.rulesHtml || '';
  }

  // Words already carry fr/en/es; the next word drawn uses the new language.
  changeLanguage(language) {
    this.gameState.language = language;
    document.documentElement.lang = language;
    this.markActiveLanguage();
    renderResume(this.saved, language);
    void this.refreshRules();
  }

  markActiveLanguage() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === this.gameState.language);
    });
  }

  /**
   * Show deck selection menu
   */
  showDeckSelection() {
    buildDeckMenu(this.decks(), (deck, bgColor) => {
      this.startGame(deck, bgColor);
    });
    this.saved = loadMatch(this.decks());
    renderResume(this.saved, this.gameState.language);
  }

  decks() {
    return this.gameState.gameData?.decks || [];
  }

  // Only a match in play is stored; endGame has already cleared it.
  saveMatch() {
    if (this.isGameActive && this.gameState.timeLeft > 0) {
      storeMatch(this.gameState, this.decks());
    }
  }

  /**
   * Resume the saved match: no coin, timer restarts from the saved time left
   */
  resumeGame() {
    if (this.isStarting || this.isGameActive) return;
    const saved = loadMatch(this.decks());
    if (!saved) {
      this.showDeckSelection();
      return;
    }
    window.MuchogamesMatch.resume('olemains');
    const bgColor = mapColor(saved.deck.color);
    this.gameState.restore(saved, bgColor);
    showGameView(bgColor);
    this.updateDisplay();
    showWord(this.gameState.currentWordText());
    this.startTimer();
    this.isGameActive = true;
    this.saveMatch();
  }

  /**
   * Start a new game with selected deck
   * @param {Object} deck - The deck to use
   * @param {string} bgColor - Background color for the deck
   */
  async startGame(deck, bgColor) {
    if (this.isStarting || this.isGameActive) return;
    this.isStarting = true;
    const allowed = await window.MuchogamesMatch.start('olemains');
    this.isStarting = false;
    if (!allowed) return;
    try {
      const timerDuration = readTimerInput();
      this.gameState.startGame(deck, bgColor, timerDuration);
      
      showGameView(bgColor);
      this.updateDisplay();
      this.pullNextWord();
      this.startTimer();
      
      this.isGameActive = true;
      this.saveMatch();
    } catch (error) {
      console.error('Failed to start game:', error);
      showError(error.message);
    }
  }

  /**
   * Process a game turn
   * @param {number} points - Points to award (1 for valid, 0 for pass)
   */
  processTurn(points) {
    if (!this.isGameActive || this.gameState.isGameOver()) {
      return;
    }

    this.gameState.updateScore(points);
    this.updateDisplay();
    this.pullNextWord();
    this.saveMatch();
  }

  /**
   * Get and display the next word
   */
  pullNextWord() {
    if (this.gameState.isGameOver()) {
      this.endGame("Fin du paquet !");
      return;
    }

    const nextWord = this.gameState.getNextWord();
    if (nextWord) {
      showWord(nextWord);
    }
  }

  /**
   * Start the game timer
   */
  startTimer() {
    this.timer.start(
      this.gameState.timeLeft,
      (remaining) => {
        this.gameState.timeLeft = remaining;
        this.updateDisplay();
        this.saveMatch();
      },
      () => {
        this.endGame("Temps écoulé !");
      }
    );
  }

  /**
   * Update game display
   */
  updateDisplay() {
    updateHUD(this.gameState.score, this.gameState.timeLeft);
  }

  /**
   * End the current game
   * @param {string} reason - Reason for game end
   */
  endGame(reason) {
    clearMatch();
    this.saved = null;
    window.MuchogamesMatch.finish();
    this.isGameActive = false;
    this.timer.stop();
    
    showGameOver(reason, this.gameState.deckColor);
    
    this.endTimer = setTimeout(() => {
      this.quitGame();
    }, 3000);
  }

  /**
   * Quit current game and return to setup.
   * Quitting is not an end: no finish(), the save stays and the setup
   * screen offers it again through the resume button.
   */
  quitGame() {
    clearTimeout(this.endTimer);
    this.saveMatch();
    this.isGameActive = false;
    this.timer.stop();
    this.gameState.reset();
    
    showSetupView();
    this.showDeckSelection();
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new OlemainsGame();
  game.init();
});