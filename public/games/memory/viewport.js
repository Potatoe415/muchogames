export function placeBars() {
  const viewport = window.visualViewport;
  const top = viewport ? Math.max(0, viewport.offsetTop) : 0;
  const bottom = viewport
    ? Math.max(0, window.innerHeight - viewport.height - top)
    : 0;
  const root = document.documentElement.style;
  root.setProperty("--memory-obstructed-top", `${Math.round(top)}px`);
  root.setProperty("--memory-obstructed", `${Math.round(bottom)}px`);
  if (window.scrollY !== 0) window.scrollTo(0, 0);
  const nav = document.querySelector(".game-nav");
  if (nav) root.setProperty("--memory-nav-height", `${nav.offsetHeight}px`);
}

export function watchViewport() {
  placeBars();
  window.visualViewport?.addEventListener("resize", placeBars);
  window.visualViewport?.addEventListener("scroll", placeBars);
  window.addEventListener("resize", placeBars);
}
