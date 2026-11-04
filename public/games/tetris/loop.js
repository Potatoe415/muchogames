// The real-time loop: advances the engine, plays events, draws, and reports
// the HUD / a periodic save. The engine owns all rules; this only paces it.
const MAX_FRAME = 0.1;
const SAVE_EVERY = 1;

class Loop {
  constructor(parts) {
    Object.assign(this, parts);
    this.frame = 0;
    this.last = 0;
    this.sinceSave = 0;
  }

  step(dt) {
    this.input.update(dt);
    this.engine.tick(dt, this.input.soft());
    this.sinceSave += dt;
  }

  report(events) {
    if (!events.length && this.sinceSave < SAVE_EVERY) return;
    this.sinceSave = 0;
    this.onHud(this.engine.state);
  }

  tick = (now) => {
    this.frame = requestAnimationFrame(this.tick);
    const dt = Math.min(MAX_FRAME, (now - this.last) / 1000);
    this.last = now;
    const { state } = this.engine;
    if (this.canPlay() && !state.over) this.step(dt);
    const events = this.engine.drain();
    events.forEach(this.onEvent);
    this.view.render(state);
    this.report(events);
    if (state.over) {
      this.stop();
      this.onOver();
    }
  };

  start() {
    this.frame = requestAnimationFrame((now) => {
      this.last = now;
      this.tick(now);
    });
  }

  stop = () => cancelAnimationFrame(this.frame);
}

export const createLoop = (parts) => new Loop(parts);
