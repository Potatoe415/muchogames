// DOM builders for the start screen (level list) and the result dialogs.
import { LEVELS } from "./levels.js";
import { totalScore } from "./progress.js";

export function fillList(list, lines) {
  list.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    })
  );
}

function levelButton(level, number, progress, t) {
  const open = progress.unlocked.has(number);
  const best = progress.best[number];
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cc-level";
  button.dataset.id = `chips-level-${number}`;
  button.dataset.level = String(number);
  button.disabled = !open;
  const name = document.createElement("span");
  name.className = "cc-level-name";
  name.textContent = `${number}. ${level.title}`;
  const state = document.createElement("span");
  state.className = "cc-level-state";
  if (!open) state.textContent = t("locked");
  else if (best) state.textContent = t("best", best);
  else state.textContent = t("notPlayed");
  button.append(name, state);
  return button;
}

export function renderLevelList(list, progress, t) {
  list.replaceChildren(
    ...LEVELS.map((level, i) => {
      const item = document.createElement("li");
      item.append(levelButton(level, i + 1, progress, t));
      return item;
    })
  );
}

export function totalLine(progress, t) {
  return t("totalScore", { value: totalScore(progress) });
}

function recordLine(result, t) {
  const { previousTime, timeLeft, limited } = result;
  if (!limited) return null;
  if (previousTime === null) return t("timeRecordNew");
  if (timeLeft > previousTime) {
    return t("timeRecordBeat", { value: timeLeft - previousTime });
  }
  return null;
}

export function winLines(result, progress, t) {
  return [
    t("timeBonus", { value: result.timeBonus }),
    t("levelBonus", { value: result.levelBonus }),
    t("levelScore", { value: result.levelScore }),
    totalLine(progress, t),
    recordLine(result, t),
    result.last ? t("allDone") : null
  ].filter(Boolean);
}
