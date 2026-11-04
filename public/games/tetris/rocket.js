// The Game Boy reward: a rocket lifts off when a match ends at 100 000
// points or more, bigger at 150 000, 200 000 and 250 000. Tap to skip.
const TIERS = [100000, 150000, 200000, 250000];
// Matches the tr-liftoff animation in stage.css, plus a beat.
const LIFTOFF_MS = 3800;
const STILL_MS = 1800;

// 0 = no rocket, 1-4 = its size.
export const rocketTier = (score) => TIERS.filter((min) => score >= min).length;

// Shows the launch on `layer`; resolves once it is over or skipped.
export function launchRocket(layer, tier) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  layer.dataset.tier = String(tier);
  layer.hidden = false;
  return new Promise((resolve) => {
    const life = new AbortController();
    const done = () => {
      life.abort();
      clearTimeout(timer);
      layer.hidden = true;
      resolve();
    };
    const timer = setTimeout(done, still ? STILL_MS : LIFTOFF_MS);
    layer.addEventListener("click", done, { signal: life.signal });
  });
}
