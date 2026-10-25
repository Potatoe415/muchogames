import { GRID_IDS, GRIDS, NAME_MAX } from "./config.js";
import { BACKS, THEME_IDS } from "./faces.js";
import { readCards, readScores } from "./persist.js";
import { withWinner } from "./reducer.js";

export function packWire(state, names) {
  return {
    v: 1,
    grid: state.config.grid,
    theme: state.config.theme,
    back: state.config.back,
    cards: state.cards.map(({ instanceId, pairId, faceId, status }) => ({
      instanceId,
      pairId,
      faceId,
      status
    })),
    scores: state.scores,
    active: state.active,
    names: names.map((name) => String(name || "").slice(0, NAME_MAX))
  };
}

function readName(value) {
  return typeof value === "string" ? value.trim().slice(0, NAME_MAX) : "";
}

function shapeOf(cards) {
  const open = cards.filter((card) => card.status === "FLIPPED");
  if (open.length > 2) return null;
  if (cards.every((card) => card.status === "MATCHED")) {
    return { phase: "GAME_OVER", open };
  }
  if (open.length < 2) return { phase: "TURN", open };
  if (open[0].pairId === open[1].pairId) return null;
  return { phase: "EVALUATING", open };
}

function configOk(raw) {
  if (raw?.v !== 1 || !GRID_IDS.includes(raw.grid)) return false;
  if (!THEME_IDS.includes(raw.theme) || !BACKS.includes(raw.back)) return false;
  const { cols, rows } = GRIDS[raw.grid];
  return Array.isArray(raw.cards) && raw.cards.length === cols * rows;
}

// The opponent's board is untrusted: same card checks as a local save, and the
// phase is derived from the cards instead of being read from the payload.
export function readWire(raw) {
  if (!configOk(raw)) return null;
  const cards = readCards(raw.cards, raw.theme);
  const scores = readScores(raw.scores);
  if (!cards || !scores || (raw.active !== 0 && raw.active !== 1)) return null;
  const found = cards.filter((card) => card.status === "MATCHED").length / 2;
  const shape = shapeOf(cards);
  if (!shape || found !== scores[0] + scores[1]) return null;
  const { grid, theme, back } = raw;
  const state = withWinner({
    phase: shape.phase,
    config: {
      mode: "online",
      difficulty: "medium",
      grid,
      theme,
      back,
      ...GRIDS[grid]
    },
    cards,
    openIds: shape.open.map((card) => card.instanceId),
    scores,
    active: raw.active,
    known: [],
    winner: null
  });
  const names = Array.isArray(raw.names) ? raw.names : [];
  return { state, names: [readName(names[0]), readName(names[1])] };
}

export function sameBoard(left, right) {
  if (
    left.active !== right.active ||
    left.cards.length !== right.cards.length
  ) {
    return false;
  }
  if (left.scores.some((score, index) => score !== right.scores[index])) {
    return false;
  }
  return left.cards.every(
    (card, index) =>
      card.instanceId === right.cards[index].instanceId &&
      card.status === right.cards[index].status
  );
}
