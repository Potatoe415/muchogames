import { GRIDS } from "./config.js";

function findCard(cards, instanceId) {
  return cards.find((card) => card.instanceId === instanceId);
}

function remember(known, card) {
  if (known.some((item) => item.instanceId === card.instanceId)) return known;
  return [...known, { instanceId: card.instanceId, pairId: card.pairId }];
}

function allMatched(cards) {
  return cards.every((card) => card.status === "MATCHED");
}

function phaseFor(config, active, cards) {
  if (allMatched(cards)) return "GAME_OVER";
  if (config.mode === "bot" && active === 1) return "BOT";
  return "TURN";
}

function winnerFor(config, scores) {
  if (config.mode === "solo") return 0;
  if (scores[0] === scores[1]) return "tie";
  return scores[0] > scores[1] ? 0 : 1;
}

export function withWinner(state) {
  if (state.phase !== "GAME_OVER") return state;
  return { ...state, winner: winnerFor(state.config, state.scores) };
}

export function createState(config, cards) {
  const spec = GRIDS[config.grid];
  return {
    phase: "TURN",
    config: { ...config, cols: spec.cols, rows: spec.rows },
    cards,
    openIds: [],
    scores: [0, 0],
    misses: 0,
    elapsedMs: 0,
    active: 0,
    known: [],
    winner: null
  };
}

function canFlip(state, action, card) {
  const bot = action.bot === true;
  if (bot ? state.phase !== "BOT" : state.phase !== "TURN") return false;
  if (state.config.mode === "online" && action.seat !== state.active) {
    return false;
  }
  if (!card || card.status !== "IDLE") return false;
  if (state.openIds.includes(action.instanceId)) return false;
  return state.openIds.length < 2;
}

function matchPair(state, first, second) {
  const cards = state.cards.map((card) =>
    card.instanceId === first.instanceId ||
    card.instanceId === second.instanceId
      ? { ...card, status: "MATCHED" }
      : card
  );
  const scores = state.scores.slice();
  scores[state.active] += 1;
  const phase = phaseFor(state.config, state.active, cards);
  return withWinner({ ...state, cards, scores, openIds: [], phase });
}

function openSecond(state) {
  const [first, second] = state.openIds.map((id) => findCard(state.cards, id));
  if (first.pairId === second.pairId) return matchPair(state, first, second);
  const solo = state.config.mode === "solo";
  const misses = solo ? state.misses + 1 : state.misses;
  return { ...state, misses, phase: "EVALUATING" };
}

function flip(state, action) {
  const card = findCard(state.cards, action.instanceId);
  if (!canFlip(state, action, card)) return state;
  const cards = state.cards.map((item) =>
    item.instanceId === card.instanceId ? { ...item, status: "FLIPPED" } : item
  );
  const next = {
    ...state,
    cards,
    openIds: [...state.openIds, card.instanceId],
    known: remember(state.known, card)
  };
  return next.openIds.length < 2 ? next : openSecond(next);
}

function close(state) {
  if (state.phase !== "EVALUATING") return state;
  const cards = state.cards.map((card) =>
    card.status === "FLIPPED" ? { ...card, status: "IDLE" } : card
  );
  const active = state.config.mode === "solo" ? state.active : 1 - state.active;
  return {
    ...state,
    cards,
    openIds: [],
    active,
    phase: phaseFor(state.config, active, cards)
  };
}

export function reduce(state, action) {
  if (action.type === "FLIP") return flip(state, action);
  if (action.type === "CLOSE") return close(state);
  return state;
}
