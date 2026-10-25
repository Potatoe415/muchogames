// The 149 original levels, read once from assets/CHIPS.DAT (taken from
// github.com/bgradin/ChipsChallenge) by the rules engine. LEVELS (number,
// title, password per level) is a live binding: empty until loadLevels()
// resolves; levelPack() is what engine.createLevel() needs.
import { parsePack } from "./engine.js";

const DAT_URL = new URL("./assets/CHIPS.DAT", import.meta.url).href;

export let LEVELS = [];
let pack = null;
let pending = null;

export const levelPack = () => pack;

export function loadLevels() {
  pending ??= fetch(DAT_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`CHIPS.DAT: HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((buffer) => {
      ({ pack, levels: LEVELS } = parsePack(buffer));
      return LEVELS;
    })
    .catch((error) => {
      pending = null;
      throw error;
    });
  return pending;
}
