// Writes the match in progress with what the player sees besides the deals
// (auction shown during the play, open score / hands panels), and again when
// the page is left.
import { matchOver } from "./chicago.js";
import { saveMatch } from "./store.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export const PANELS = {
  hands: "bridge-hands-panel",
  score: "bridge-score-panel"
};

const openPanels = () =>
  Object.keys(PANELS).filter((panel) => !$(PANELS[panel]).hidden);

// A finished match was already cleared and must not be written back.
export function saveProgress(match, auction) {
  if (match && !matchOver(match)) {
    saveMatch(match, { auction, panels: openPanels() });
  }
}

// A phone may kill a hidden tab without any further event.
export function saveOnLeave(save) {
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
}
