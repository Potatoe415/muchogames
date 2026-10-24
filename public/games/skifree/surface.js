// DPR-aware canvas sized by a ResizeObserver. The world is drawn at an
// integer zoom (device pixels per original pixel) so every bitmap stays
// pixel-perfect; big screens get a bigger zoom.
const MAX_DPR = 3;

function cssScale(width, height) {
  const short = Math.min(width, height);
  if (short >= 1000) return 2;
  return short >= 700 ? 1.5 : 1;
}

// Calls onResize(size) with size = { width, height } in CSS pixels plus
// `zoom`, `viewW`, `viewH` (world pixels visible). disconnect() releases
// every observer.
export function createSurface(canvas, host, onResize) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const size = { width: 1, height: 1, dpr: 1, zoom: 1, viewW: 1, viewH: 1 };
  let media = null;

  const watchRatio = (dpr) => {
    media?.removeEventListener("change", apply);
    media = window.matchMedia(`(resolution: ${dpr}dppx)`);
    media.addEventListener("change", apply);
  };

  function apply() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    size.width = Math.max(1, Math.floor(rect.width));
    size.height = Math.max(1, Math.floor(rect.height));
    size.dpr = dpr;
    size.zoom = Math.max(
      1,
      Math.round(dpr * cssScale(size.width, size.height))
    );
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    size.viewW = canvas.width / size.zoom;
    size.viewH = canvas.height / size.zoom;
    ctx.imageSmoothingEnabled = false;
    watchRatio(dpr);
    onResize(size);
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
