// The 149 original levels, read once from assets/CHIPS.DAT (taken from
// github.com/bgradin/ChipsChallenge). LEVELS is a live binding: empty until
// loadLevels() resolves.
import { parseDat } from "./datfile.js";

const DAT_URL = new URL("./assets/CHIPS.DAT", import.meta.url).href;

export let LEVELS = [];
let pending = null;

export function loadLevels() {
  pending ??= fetch(DAT_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`CHIPS.DAT: HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((buffer) => {
      LEVELS = parseDat(buffer);
      return LEVELS;
    })
    .catch((error) => {
      pending = null;
      throw error;
    });
  return pending;
}
