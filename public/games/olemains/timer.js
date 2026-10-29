/**
 * Timer management for Olemains game
 */

export class GameTimer {
  constructor() {
    this.intervalId = null;
    this.onTick = null;
    this.onTimeout = null;
  }

  /**
   * Start the game timer
   * @param {number} duration - Duration in seconds
   * @param {Function} onTick - Callback called every second
   * @param {Function} onTimeout - Callback called when time runs out
   */
  start(duration, onTick, onTimeout) {
    this.stop();
    
    this.onTick = onTick;
    this.onTimeout = onTimeout;
    
    let remaining = duration;
    
    this.intervalId = setInterval(() => {
      remaining--;
      
      if (this.onTick) {
        this.onTick(remaining);
      }
      
      if (remaining <= 0) {
        const onTimeout = this.onTimeout;
        this.stop();
        if (onTimeout) {
          onTimeout();
        }
      }
    }, 1000);
  }

  /**
   * Stop the timer
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onTick = null;
    this.onTimeout = null;
  }

  /**
   * Check if timer is running
   * @returns {boolean}
   */
  isRunning() {
    return this.intervalId !== null;
  }
}