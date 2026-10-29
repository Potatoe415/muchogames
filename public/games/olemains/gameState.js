/**
 * Game state management for Olemains
 */

export class GameState {
  constructor() {
    this.gameData = null;
    this.currentWords = [];
    this.currentWord = null;
    this.score = 0;
    this.timeLeft = 60;
    this.currentDeck = null;
    this.deckColor = null;
    this.language = 'fr';
  }

  /**
   * Load game data from JSON file
   * Uses an absolute path so it works both locally and when deployed.
   * @param {string} url - Path to words.json
   * @returns {Promise<void>}
   */
  async loadGameData(url = '/data/olemains/words.json') {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load game data: ${response.status}`);
      }
      this.gameData = await response.json();
      return this.gameData;
    } catch (error) {
      console.error('Error loading game data:', error);
      throw error;
    }
  }

  /**
   * Start a new game with the selected deck
   * @param {Object} deck - The deck to use
   * @param {string} bgColor - Background color for the deck
   * @param {number} timerDuration - Timer duration in seconds
   */
  startGame(deck, bgColor, timerDuration) {
    if (!deck?.words || deck.words.length === 0) {
      throw new Error('Deck has no words');
    }

    this.currentDeck = deck;
    this.deckColor = bgColor;
    this.currentWords = [...deck.words].sort(() => Math.random() - 0.5);
    this.currentWord = null;
    this.score = 0;
    this.timeLeft = timerDuration;
  }

  /**
   * Restore a saved match (see save.js decodeMatch)
   * @param {Object} match - Decoded save
   * @param {string} bgColor - Background color for the deck
   */
  restore(match, bgColor) {
    this.currentDeck = match.deck;
    this.deckColor = bgColor;
    this.currentWords = match.currentWords;
    this.currentWord = match.currentWord;
    this.score = match.score;
    this.timeLeft = match.timeLeft;
  }

  /**
   * Get the next word from the current deck
   * @returns {string|null} The next word or null if deck is empty
   */
  getNextWord() {
    if (this.currentWords.length === 0) {
      return null;
    }
    this.currentWord = this.currentWords.pop();
    return this.currentWordText();
  }

  /**
   * Text of the word on screen, in the current language
   * @returns {string}
   */
  currentWordText() {
    const word = this.currentWord;
    return word ? word[this.language] || word.fr : '';
  }

  /**
   * Update score based on turn result
   * @param {number} points - Points to add (1 for valid, 0 for pass)
   */
  updateScore(points) {
    this.score += points;
  }

  /**
   * Decrement timer
   */
  decrementTime() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
    }
  }

  /**
   * Check if game is over
   * @returns {boolean}
   */
  isGameOver() {
    return this.timeLeft <= 0 || this.currentWords.length === 0;
  }

  /**
   * Reset game state
   */
  reset() {
    this.currentWords = [];
    this.currentWord = null;
    this.score = 0;
    this.timeLeft = 60;
    this.currentDeck = null;
    this.deckColor = null;
  }
}