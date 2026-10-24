// Square DPR-aware canvas for the 288x288 window, sized by a ResizeObserver
// on its host. The zoom (device pixels per original pixel) is an integer
// whenever the host can fit at least one full-size window, so every tile
// stays pixel-perfect.
import { VIEW_PX } from "./render.js";

const MAX_DPR = 3;
const FRAME_CSS = 4;

export function createSurface(canvas, host) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const size = { zoom: 1 };
  let media = null;

  const watchRatio = (dpr) => {
    media?.removeEventListener("change", apply);
    media = window.matchMedia(`(resolution: ${dpr}dppx)`);
    media.addEventListener("change", apply);
  };

  function apply() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const fit = Math.min(rect.width, rect.height) - FRAME_CSS;
    const avail = Math.max(1, Math.floor(fit * dpr));
    const zoom =
      avail >= VIEW_PX ? Math.floor(avail / VIEW_PX) : avail / VIEW_PX;
    const px = Math.max(1, Math.round(VIEW_PX * zoom));
    canvas.width = px;
    canvas.height = px;
    canvas.style.width = `${px / dpr}px`;
    canvas.style.height = `${px / dpr}px`;
    size.zoom = zoom;
    ctx.imageSmoothingEnabled = false;
    watchRatio(dpr);
  }

  const observer = new ResizeObserver(apply);
  observer.observe(host);
  apply();
  return {
    ctx,
    size,
    disconnect() {
      observer.disconnect();
      media?.removeEventListener("change", apply);
      media = null;
    }
  };
}
