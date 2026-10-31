// Chess clock: time left per side, counting down for the side that runs.
// Pure timekeeping; clock-ui.js shows it, pauses it and detects flag falls.
export const CLOCK_IDS = ["none", "5", "10", "30"];

export const clockMinutes = (id) => (id === "none" ? 0 : Number(id));

// saved: { white, black } in ms, from serialize().
export function createClock(minutes, saved) {
  const full = minutes * 60000;
  const left = { 1: saved?.white ?? full, [-1]: saved?.black ?? full };
  let running = 0;
  let since = 0;

  function commit() {
    if (!running) return;
    const now = performance.now();
    left[running] = Math.max(0, left[running] - (now - since));
    since = now;
  }

  return {
    get running() {
      return running;
    },
    remaining: (side) =>
      Math.max(
        0,
        left[side] - (running === side ? performance.now() - since : 0)
      ),
    run(side) {
      commit();
      running = side;
      since = performance.now();
    },
    stop() {
      commit();
      running = 0;
    },
    serialize() {
      commit();
      return { white: Math.round(left[1]), black: Math.round(left[-1]) };
    }
  };
}
