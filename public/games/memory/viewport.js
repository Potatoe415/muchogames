// iOS 26 Safari counts the area under its floating toolbar in innerHeight, so
// the hidden strip is measured as the page bottom past the visible bottom.
export function placeBars() {
  if (window.scrollY !== 0) window.scrollTo(0, 0);
  const viewport = window.visualViewport;
  const top = viewport ? Math.max(0, viewport.offsetTop) : 0;
  const shownBottom = viewport
    ? viewport.offsetTop + viewport.height
    : window.innerHeight;
  const pageBottom = document.body.getBoundingClientRect().bottom;
  const bottom = Math.max(0, pageBottom - shownBottom);
  const root = document.documentElement.style;
  root.setProperty("--memory-obstructed-top", `${Math.round(top)}px`);
  root.setProperty("--memory-obstructed", `${Math.round(bottom)}px`);
  const nav = document.querySelector(".game-nav");
  if (nav) root.setProperty("--memory-nav-height", `${nav.offsetHeight}px`);
}

export function watchViewport() {
  placeBars();
  window.visualViewport?.addEventListener("resize", placeBars);
  window.visualViewport?.addEventListener("scroll", placeBars);
  window.addEventListener("resize", placeBars);
}
