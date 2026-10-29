/* blackstories-save.js
  Session save for Black Stories (endless: the save is only replaced by a new
  session, never deleted by an end screen).
  Saved shape: { lang, history: [storyId, ...], pos, revealed }
*/

const SAVE_KEY = "blackstories-current";
const LANGS = ["fr", "en", "es"];

const RESUME_LABELS = {
  fr: "Reprendre",
  en: "Resume",
  es: "Reanudar",
};

export function resumeLabel(lang) {
  return RESUME_LABELS[lang] || RESUME_LABELS.fr;
}

function isValidSave(save) {
  return (
    !!save &&
    LANGS.includes(save.lang) &&
    Array.isArray(save.history) &&
    save.history.length > 0 &&
    save.history.every((id) => typeof id === "string" && id) &&
    Number.isInteger(save.pos) &&
    save.pos >= 0 &&
    save.pos < save.history.length &&
    typeof save.revealed === "boolean"
  );
}

export function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (isValidSave(save)) return save;
  } catch {
    // corrupt JSON: dropped below
  }
  clearSave();
  return null;
}

export function writeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // storage full or blocked: the session just won't survive a reload
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage blocked
  }
}

// Maps saved story ids to indexes in `stories`, dropping ids that no longer
// exist; `pos` lands on the last kept entry at or before the saved position.
export function idsToIndexes(ids, pos, stories) {
  const indexById = new Map(stories.map((s, i) => [s.id, i]));
  const history = [];
  let newPos = 0;
  ids.forEach((id, i) => {
    if (!indexById.has(id)) return;
    history.push(indexById.get(id));
    if (i <= pos) newPos = history.length - 1;
  });
  return history.length ? { history, pos: newPos } : null;
}
