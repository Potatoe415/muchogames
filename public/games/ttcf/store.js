// The match in progress under one key, so leaving by any route and coming
// back resumes it (docs/PLATFORM_RULES.md section 5). Everything read back is
// validated against the loaded cards and the board: a bad save is dropped.
const SAVE_KEY = 'muchogames_ttcf_save';
const MODE_KEY = 'muchogames_ttcf_mode';
const VERSION = 1;
const MODES = ['board', 'wheel'];
const STEPS = ['bonus', 'eval', 'question', 'answer'];
const MAX_TEAMS = 8;

const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function validTeam(team, i, last) {
  return team?.id === i && typeof team.name === 'string' && team.name.length <= 40 && isInt(team.pos, 0, last);
}

// cards null: the deck is not loaded yet, the card index is not checked.
function validCard(card, cards, last) {
  if (card === null) return true;
  return (
    isInt(card?.index, 0, cards ? cards.length - 1 : Infinity) &&
    typeof card.theme === 'string' &&
    STEPS.includes(card.step) &&
    (card.note === null || isInt(card.note, 1, 10)) &&
    typeof card.opening === 'boolean' &&
    isInt(card.timeLeft, 0, 30) &&
    isInt(card.move, -last, last) &&
    // A card played under a Superbe card's rule: that card's index.
    (card.bonus == null || (isInt(card.bonus, 0, cards ? cards.length - 1 : Infinity) && (!cards || cards[card.bonus].theme === 'Superbe')))
  );
}

function isValidMatch(match, cards, last) {
  const teams = match?.teams;
  return (
    Array.isArray(teams) &&
    teams.length >= 2 &&
    teams.length <= MAX_TEAMS &&
    MODES.includes(match.mode) &&
    teams.every((team, i) => validTeam(team, i, last)) &&
    isInt(match.cur, 0, teams.length - 1) &&
    validCard(match.card, cards, last)
  );
}

export function loadMatch(cards, last) {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data) return null;
    // A save from before the wheel mode is a board match.
    const match = data.match && { mode: 'board', ...data.match };
    if (data.v === VERSION && isValidMatch(match, cards, last)) return match;
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Unreadable save or storage unavailable: no match to resume.
  }
  return null;
}

// Before the deck is loaded: whether a save is there to resume, so the
// dashboard shows its final layout at once (loadMatch checks it in full).
export function hasMatch(last) {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    return data?.v === VERSION && isValidMatch({ mode: 'board', ...data.match }, null, last);
  } catch {
    return false;
  }
}

export function storeMatch(match) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: VERSION, match }));
  } catch {
    // Storage full or unavailable: the match only lasts for this visit.
  }
}

export function readMode() {
  try {
    const mode = localStorage.getItem(MODE_KEY);
    return MODES.includes(mode) ? mode : 'board';
  } catch {
    return 'board';
  }
}

export function storeMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
