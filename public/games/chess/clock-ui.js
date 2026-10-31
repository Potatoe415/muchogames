// The match clock on screen: time left in each player bar, flag fall, the
// Pause button and overlay. Pauses by itself when the page is hidden or the
// options panel opens; a resumed match comes back paused.
import { createClock } from "./clock.js";

const TICK_MS = 100;
const SAVE_MS = 1000;
const LOW_MS = 30000;

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function formatClock(ms) {
  if (ms < 10000) return `0:0${(Math.floor(ms / 100) / 10).toFixed(1)}`;
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// bottom: side shown in the bottom bar. onFlag(side) when its time runs out,
// onSave() about once a second while running, onPause(on) on every change.
export function createMatchClock(options) {
  const { minutes, saved, paused, bottom, turn } = options;
  const { onFlag, onSave, onPause } = options;
  const clock = createClock(minutes, saved);
  const bars = {
    [bottom]: $("chess-player-bottom"),
    [-bottom]: $("chess-player-top")
  };
  const state = { turn, paused, over: false, savedAt: 0 };
  const panel = $("game-options-panel");

  function render() {
    [1, -1].forEach((side) => {
      const node = bars[side].querySelector("[data-bar-clock]");
      const ms = clock.remaining(side);
      node.hidden = false;
      node.textContent = formatClock(ms);
      node.classList.toggle("is-running", clock.running === side);
      node.classList.toggle("is-low", ms < LOW_MS);
    });
    $("chess-pause-button").hidden = state.over;
    $("chess-pause").hidden = !state.paused;
  }

  function tick() {
    const side = clock.running;
    if (side && clock.remaining(side) <= 0) {
      clock.stop();
      state.over = true;
      render();
      return void onFlag(side);
    }
    if (side && performance.now() - state.savedAt > SAVE_MS) {
      state.savedAt = performance.now();
      onSave();
    }
    render();
  }

  function setPaused(on) {
    if (state.over || on === state.paused) return;
    state.paused = on;
    if (on) clock.stop();
    else clock.run(state.turn);
    onPause(on);
    onSave();
    render();
    if (on) $("chess-continue-button").focus();
  }

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);
  const onVisibility = () => document.hidden && pause();
  const observer = new MutationObserver(() => !panel.hidden && pause());
  observer.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", onVisibility);
  $("chess-pause-button").addEventListener("click", pause);
  $("chess-continue-button").addEventListener("click", resume);
  const timer = setInterval(tick, TICK_MS);
  if (!paused) clock.run(turn);
  onPause(paused);
  render();

  return {
    // The side to move changed (move or undo).
    follow(side) {
      state.turn = side;
      if (!state.paused && !state.over) clock.run(side);
      render();
    },
    halt() {
      clock.stop();
      Object.assign(state, { over: true, paused: false });
      render();
    },
    serialize: () => clock.serialize(),
    destroy() {
      clearInterval(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      $("chess-pause-button").removeEventListener("click", pause);
      $("chess-continue-button").removeEventListener("click", resume);
      document.querySelectorAll("[data-bar-clock]").forEach((node) => {
        node.hidden = true;
      });
      $("chess-pause-button").hidden = true;
      $("chess-pause").hidden = true;
    }
  };
}
