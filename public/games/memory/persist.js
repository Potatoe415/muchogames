import { GRID_IDS, GRIDS, LEVELS, MODES, STORAGE_KEY } from "./config.js";
import { FACE_BY_ID } from "./faces.js";

const PHASES = new Set(["TURN", "BOT", "EVALUATING", "GAME_OVER"]);
const STATUSES = new Set(["IDLE", "FLIPPED", "MATCHED"]);

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable.
  }
}

export function writeSave(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pack(state)));
  } catch {
    // Storage unavailable.
  }
}

function pack(state) {
  return {
    v: 1,
    config: {
      mode: state.config.mode,
      difficulty: state.config.difficulty,
      grid: state.config.grid
    },
    cards: state.cards.map(({ instanceId, pairId, faceId, status }) => ({
      instanceId,
      pairId,
      faceId,
      status
    })),
    scores: state.scores,
    active: state.active,
    known: state.known,
    phase: state.phase
  };
}

function readRaw() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function readCard(card, seen) {
  if (!card || !/^c\d+$/.test(card.instanceId)) return null;
  if (seen.has(card.instanceId)) return null;
  if (!FACE_BY_ID[card.faceId] || card.pairId !== card.faceId) return null;
  if (!STATUSES.has(card.status)) return null;
  seen.add(card.instanceId);
  return {
    instanceId: card.instanceId,
    pairId: card.pairId,
    faceId: card.faceId,
    status: card.status
  };
}

function pairsOk(cards) {
  const counts = new Map();
  cards.forEach((card) => {
    counts.set(card.pairId, (counts.get(card.pairId) ?? 0) + 1);
  });
  if (counts.size !== cards.length / 2) return false;
  for (const count of counts.values()) {
    if (count !== 2) return false;
  }
  return true;
}

function readScores(scores) {
  if (!Array.isArray(scores) || scores.length !== 2) return null;
  if (!scores.every((n) => Number.isInteger(n) && n >= 0)) return null;
  return scores.slice();
}

function readKnown(list, cards) {
  if (!Array.isArray(list)) return null;
  const byId = new Map(cards.map((card) => [card.instanceId, card]));
  const known = [];
  for (const item of list) {
    const card = byId.get(item?.instanceId);
    if (!card || item.pairId !== card.pairId) return null;
    if (known.some((entry) => entry.instanceId === card.instanceId)) continue;
    known.push({ instanceId: card.instanceId, pairId: card.pairId });
  }
  return known;
}

function restingPhase(config, active) {
  if (config.mode === "bot" && active === 1) return "BOT";
  return "TURN";
}

function configOk(raw, spec) {
  if (raw?.v !== 1 || !spec) return false;
  if (!MODES.includes(raw.config.mode)) return false;
  if (!LEVELS.includes(raw.config.difficulty)) return false;
  if (!GRID_IDS.includes(raw.config.grid)) return false;
  if (!PHASES.has(raw.phase) || raw.phase === "GAME_OVER") return false;
  return Array.isArray(raw.cards) && raw.cards.length === spec.cols * spec.rows;
}

function settle(cards, scores) {
  const settled = cards.map((card) =>
    card.status === "MATCHED" ? card : { ...card, status: "IDLE" }
  );
  const found = settled.filter((card) => card.status === "MATCHED").length / 2;
  if (found !== scores[0] + scores[1] || found === settled.length / 2) {
    return null;
  }
  return settled;
}

function normalize(raw) {
  const spec = GRIDS[raw?.config?.grid];
  if (!configOk(raw, spec)) return null;
  const seen = new Set();
  const cards = raw.cards.map((card) => readCard(card, seen));
  if (cards.some((card) => !card) || !pairsOk(cards)) return null;
  const scores = readScores(raw.scores);
  const known = readKnown(raw.known, cards);
  if (!scores || !known || (raw.active !== 0 && raw.active !== 1)) return null;
  const settled = settle(cards, scores);
  if (!settled) return null;
  const active = raw.config.mode === "solo" ? 0 : raw.active;
  return {
    phase: restingPhase(raw.config, active),
    config: { ...raw.config, cols: spec.cols, rows: spec.rows },
    cards: settled,
    openIds: [],
    scores,
    active,
    known,
    winner: null
  };
}

export function loadSave() {
  const state = normalize(readRaw());
  if (!state) clearSave();
  return state;
}
