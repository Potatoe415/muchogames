// Junior level: a gentler draw for the child. Instead of the next tiles of the
// bag, several random draws are tried and the one giving the friendliest
// rack is kept: about 43 % vowels (2 of 5), no hard letters (worth 8+), few doubles, and
// as many real 3–5-letter words as possible from the rack alone. Tiles not
// taken stay in the bag.
import { BLANK, tileValue, VOWELS } from "./tiles.js";

const TRIES = 24;
const WORD_CAP = 30;

// Distinct dictionary words of 3–5 letters spelled with rack tiles (blanks
// ignored), explored through dictionary prefixes only.
function countWords(rack, dict) {
  const letters = rack.filter((l) => l !== BLANK);
  const used = Array(letters.length).fill(false);
  const found = new Set();
  const walk = (prefix) => {
    if (found.size >= WORD_CAP) return;
    if (prefix.length >= 3 && dict.has(prefix)) found.add(prefix);
    if (prefix.length === 5) return;
    letters.forEach((letter, n) => {
      if (used[n] || !dict.hasPrefix(prefix + letter)) return;
      used[n] = true;
      walk(prefix + letter);
      used[n] = false;
    });
  };
  walk("");
  return found.size;
}

function rackScore(rack, dict) {
  const vowels = rack.filter((l) => VOWELS.has(l)).length;
  const hard = rack.filter((l) => l !== BLANK && tileValue(l) >= 8).length;
  const doubles = rack.length - new Set(rack).size;
  return (
    countWords(rack, dict) -
    4 * Math.abs(vowels - Math.round(rack.length * 0.43)) -
    8 * hard -
    3 * Math.max(0, doubles - 1)
  );
}

function randomPick(size, need) {
  const indices = [...Array(size).keys()];
  for (let i = 0; i < need; i++) {
    const j = i + Math.floor(Math.random() * (size - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, need);
}

// -> chooser(rack, bag, need) -> bag indices to draw.
export function makeJuniorDraw(dict) {
  return (rack, bag, need) => {
    if (bag.length <= need) return [...bag.keys()];
    let best = null;
    for (let n = 0; n < TRIES; n++) {
      const pick = randomPick(bag.length, need);
      const score = rackScore([...rack, ...pick.map((i) => bag[i])], dict);
      if (!best || score > best.score) best = { pick, score };
    }
    return best.pick;
  };
}
