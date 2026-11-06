// Square DPR-aware canvas for the 288x288 window, sized by a ResizeObserver
// on its host. The zoom (device pixels per original pixel) is free, so the
// window fills its host (99% of a portrait phone, platform rule 6.3, owner
// 2026-11-06); smoothing stays off, so an original pixel spans 3 or 4
// device pixels at a non-integer zoom.
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
    const px = Math.max(1, Math.floor(fit * dpr));
    const zoom = px / VIEW_PX;
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
