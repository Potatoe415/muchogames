// requestAnimationFrame loop with a fixed 60 Hz simulation step.
const STEP = 1 / 60;
const MAX_FRAME = 0.25;

export function createLoop(update, draw) {
  let rafId = 0;
  let last = 0;
  let accumulator = 0;

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    accumulator += Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
    draw(now / 1000);
  }

  return {
    start() {
      if (rafId) return;
      last = performance.now();
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}
