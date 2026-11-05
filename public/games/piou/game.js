// One match: engine + view + input + the rAF loop. Flap = pointerdown on
// the play area (touch / mouse, no click delay), Space / ↑ / W anywhere,
// Enter or the remote's OK / ↑ on the focused play area.
import { createEngine } from "./engine.js";
import { createView } from "./view.js";

const MAX_FRAME = 0.05;
const SAVE_EVERY = 1;
const FLAP_KEYS = new Set([" ", "ArrowUp", "w", "W"]);
const CONTROLS = "button, a, input, select, textarea, summary";

class Game {
  constructor({ area, canvas, audio, saved, canPlay, onHud, onEnd }) {
    Object.assign(this, { area, audio, canPlay, onHud, onEnd });
    this.view = createView(canvas);
    this.engine = createEngine({ width: this.view.width, saved });
    this.frame = 0;
    this.last = 0;
    this.sinceSave = 0;
    this.bind();
    this.report();
    this.frame = requestAnimationFrame((now) => {
      this.last = now;
      this.tick(now);
    });
  }

  flap() {
    if (!this.canPlay()) return;
    this.engine.flap();
  }

  onPointer = (event) => {
    if (!event.isPrimary || event.button > 0) return;
    event.preventDefault();
    this.flap();
  };

  onKey = (event) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const onArea = event.target === this.area;
    const enter = event.key === "Enter" && onArea;
    if (!FLAP_KEYS.has(event.key) && !enter) return;
    // Space on another focused control (the pause button) is that control's.
    if (!onArea && event.target.matches?.(CONTROLS)) return;
    if (!this.canPlay()) return;
    event.preventDefault();
    this.flap();
  };

  onResize = () => this.engine.setWidth(this.view.resize());

  bind() {
    this.area.addEventListener("pointerdown", this.onPointer);
    document.addEventListener("keydown", this.onKey);
    this.observer = new ResizeObserver(this.onResize);
    this.observer.observe(this.area);
  }

  report() {
    this.sinceSave = 0;
    const { score, phase } = this.engine.state;
    this.onHud({ score, phase });
  }

  play(events) {
    events.forEach((name) => {
      if (name !== "end") this.audio.play(name);
    });
    if (events.length || this.sinceSave >= SAVE_EVERY) this.report();
  }

  tick = (now) => {
    this.frame = requestAnimationFrame(this.tick);
    const dt = Math.min(MAX_FRAME, (now - this.last) / 1000);
    this.last = now;
    if (this.canPlay()) this.engine.tick(dt);
    this.sinceSave += dt;
    const events = this.engine.drain();
    this.view.render(this.engine.state);
    this.play(events);
    if (events.includes("end")) {
      this.stop();
      this.onEnd({ score: this.engine.state.score });
    }
  };

  // A pause: the bird waits, frozen, for the next flap.
  hold() {
    this.engine.hold();
    this.report();
  }

  snapshot() {
    return this.engine.snapshot();
  }

  stop() {
    cancelAnimationFrame(this.frame);
  }

  destroy() {
    this.stop();
    this.area.removeEventListener("pointerdown", this.onPointer);
    document.removeEventListener("keydown", this.onKey);
    this.observer.disconnect();
  }
}

export const createGame = (parts) => new Game(parts);
