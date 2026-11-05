// Canvas sizing: the 720×880 board is fitted (letterboxed) into its box,
// and the backing store follows the real screen pixels (sharp on a 4K TV),
// lowered automatically when the device cannot hold ~45 fps.
const W = 720;
const H = 880;
const MAX_HEIGHT_PX = 2160;
const MIN_QUALITY = 0.5;

export function createView(canvas, box) {
  const ctx = canvas.getContext("2d");
  const state = { quality: 1, scaleX: 1, scaleY: 1, frames: 0, time: 0 };

  function fit() {
    const scale = Math.min(box.clientWidth / W, box.clientHeight / H);
    if (!(scale > 0)) return;
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const wanted = W * scale * dpr * state.quality;
    const maxWidth = (MAX_HEIGHT_PX * W) / H;
    const width = Math.round(Math.max(W * 0.5, Math.min(wanted, maxWidth)));
    const height = Math.round((width * H) / W);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    state.scaleX = width / W;
    state.scaleY = height / H;
  }

  const observer = new ResizeObserver(fit);
  observer.observe(box);
  fit();

  return {
    // Resets the transform to logical units and clears the board.
    begin() {
      ctx.setTransform(state.scaleX, 0, 0, state.scaleY, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, W, H);
      return ctx;
    },
    // Average frame time over 120 frames; too slow lowers the resolution.
    monitor(dt) {
      if (dt <= 0 || dt > 0.25) return;
      state.frames++;
      state.time += dt;
      if (state.frames < 120) return;
      const slow = state.time / state.frames > 1 / 45;
      state.frames = 0;
      state.time = 0;
      if (!slow || state.quality <= MIN_QUALITY) return;
      state.quality = Math.max(MIN_QUALITY, state.quality * 0.8);
      fit();
    },
    destroy() {
      observer.disconnect();
    }
  };
}
