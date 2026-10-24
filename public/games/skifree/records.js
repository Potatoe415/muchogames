// Personal bests kept in localStorage: distance before the yeti (m), the
// two slaloms (seconds, penalties included, lower wins) and freestyle
// (style points).
import { GATE_PENALTY } from "./config.js";
import { formatTime } from "./hud.js";
import { readStorage, writeStorage } from "./storage.js";

const KEYS = {
  dist: "skifree-best-distance",
  slalom: "skifree-best-slalom",
  tree: "skifree-best-tree",
  freestyle: "skifree-best-freestyle"
};
const LOWER_WINS = new Set(["slalom", "tree"]);

export function loadRecords() {
  const records = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    const value = Number(readStorage(key, ""));
    records[name] =
      readStorage(key, "") !== "" && Number.isFinite(value) ? value : null;
  });
  return records;
}

// Stores value when it beats the record; returns true on a new record.
export function submitRecord(records, name, value) {
  const best = records[name];
  const better = LOWER_WINS.has(name) ? value < best : value > best;
  if (best !== null && !better) return false;
  records[name] = value;
  writeStorage(KEYS[name], String(value));
  return true;
}

function formatRecord(name, value, t) {
  if (value === null) return t("none");
  if (name === "dist") return `${value} m`;
  if (name === "freestyle") return t("points", { value });
  return formatTime(value);
}

export function recordLines(records, t) {
  const labels = {
    dist: "recordDist",
    slalom: "recordSlalom",
    tree: "recordTree",
    freestyle: "recordFreestyle"
  };
  return Object.entries(labels).map(([name, label]) =>
    t(label, { value: formatRecord(name, records[name], t) })
  );
}

// Toast text for a finished or cancelled course, updating its record.
export function courseMessage(result, records, t) {
  const name = t(`course_${result.mode}`);
  if (result.cancelled) return [t("resultCancelled", { name })];
  const value = result.mode === "freestyle" ? result.points : result.time;
  const lines =
    result.mode === "freestyle"
      ? [t("resultStyle", { name, points: value })]
      : [t("resultTime", { name, time: formatTime(value) })];
  if (result.missed) {
    lines.push(
      t("resultMissed", {
        missed: result.missed,
        penalty: result.missed * GATE_PENALTY
      })
    );
  }
  const best = submitRecord(records, result.mode, value);
  lines.push(
    best
      ? t("resultBest")
      : t("resultRecord", {
          best: formatRecord(result.mode, records[result.mode], t)
        })
  );
  return lines;
}
