import type { Rng } from "@/lib/cards";
import { DEFAULT_DECK_SIZE } from "./cards";
import { deal } from "./deal";
import { detectSlapPattern } from "./pattern";
import { otherSeat, resolveTributeEffect } from "./tribute";
import { SLAP_GRACE_MS, type Card, type DeckSize, type GameState, type PileWinEvent, type Seat, type SlapWindow } from "./types";

export { SLAP_GRACE_MS, otherSeat };

export function createInitialState(rng: Rng = Math.random, deckSize: DeckSize = DEFAULT_DECK_SIZE): GameState {
  const [a, b] = deal(rng, deckSize);
  return {
    phase: "playing",
    turn: 0,
    stocks: [a, b],
    pile: [],
    tribute: null,
    slapWindow: null,
    slapClaims: [],
    lastClosedSlapWindowId: null,
    nextSlapWindowId: 0,
    nextEventId: 0,
    winner: null,
    lastPileWin: null,
    lastFalseSlap: null,
    pendingTributeWinner: null,
  };
}

/** Either seat running out of cards ends the match immediately - there is
 *  nobody else to keep playing with (see docs/PRODUCT.md). */
function checkElimination(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  if (state.stocks[0].length === 0) return { ...state, phase: "finished", winner: 1 };
  if (state.stocks[1].length === 0) return { ...state, phase: "finished", winner: 0 };
  return state;
}

function openSlapWindowIfAny(state: GameState, nowMs: number): GameState {
  const pattern = detectSlapPattern(state.pile);
  if (!pattern) return state;
  const window: SlapWindow = { id: state.nextSlapWindowId, pattern, openedAtMs: nowMs };
  return { ...state, slapWindow: window, slapClaims: [], nextSlapWindowId: state.nextSlapWindowId + 1 };
}

/** Awards the whole center pile to `winner`, tucked under their stock (they
 *  reach it again once their current stock runs out). Always clears the
 *  tribute/slap window - winning the pile supersedes whatever was pending.
 *  `reactionMsBySeat` (slap wins only) records each seat's own claimed
 *  reaction time so both players' UI can show the opponent's reflex too. */
function awardPile(
  state: GameState,
  winner: Seat,
  reason: PileWinEvent["reason"],
  reactionMsBySeat?: PileWinEvent["reactionMsBySeat"],
): GameState {
  const cardCount = state.pile.length;
  const stocks: [Card[], Card[]] = [[...state.stocks[0]], [...state.stocks[1]]];
  stocks[winner] = [...state.pile, ...stocks[winner]];
  return {
    ...state,
    stocks,
    pile: [],
    tribute: null,
    slapWindow: null,
    slapClaims: [],
    lastPileWin: { id: state.nextEventId, seat: winner, cardCount, cards: state.pile, reason, reactionMsBySeat },
    nextEventId: state.nextEventId + 1,
    pendingTributeWinner: null,
  };
}

/** False slap: the whole center pile goes to the other seat (see
 *  docs/DECISIONS.md). An empty pile has nothing to award - the foul is
 *  still flagged so the UI can flash the WRONG mark. */
function applyFalseSlapPenalty(state: GameState, seat: Seat): GameState {
  const marked = { ...state, lastFalseSlap: { id: state.nextEventId, seat }, nextEventId: state.nextEventId + 1 };
  if (marked.pile.length === 0) return marked;
  const winner = otherSeat(seat);
  const awarded = awardPile(marked, winner, "falseSlap");
  return checkElimination({ ...awarded, turn: winner });
}

/** `seat` flips the top card of their own stock: a plain lead, or paying the
 *  tribute they currently owe (same seat, enforced by `state.turn === seat`).
 *  Blocked while a slap window is open - it must resolve first (via a claim,
 *  see `attemptSlap`, or the grace timeout, see `resolveStaleSlapWindow`). */
export function submitFlip(state: GameState, seat: Seat, nowMs: number = Date.now()): GameState {
  if (state.phase !== "playing") throw new Error("game_finished");
  if (state.slapWindow !== null) throw new Error("slap_window_open");
  if (state.turn !== seat) throw new Error("not_your_turn");
  const stock = state.stocks[seat];
  if (stock.length === 0) throw new Error("no_cards_left");

  const card = stock[stock.length - 1];
  const stocks: [Card[], Card[]] = [[...state.stocks[0]], [...state.stocks[1]]];
  stocks[seat] = stock.slice(0, -1);
  const pile = [...state.pile, card];

  const outcome = resolveTributeEffect(card, seat, state.tribute);
  let next: GameState = { ...state, stocks, pile, tribute: outcome.tribute, turn: outcome.turn };
  if (outcome.challengeFailedWinner === null) return checkElimination(openSlapWindowIfAny(next, nowMs));

  // This same flip both exhausted the tribute's last attempt AND may have
  // completed a double/sandwich on top of the pile (e.g. the failing card
  // happens to match the one right before it - see the user-reported "9,9"
  // case in docs/decisions). Give that pattern its real slap window first;
  // only fall back to the automatic tribute award if nobody claims it (see
  // `resolveStaleSlapWindow`).
  next = openSlapWindowIfAny(next, nowMs);
  next = next.slapWindow
    ? { ...next, pendingTributeWinner: outcome.challengeFailedWinner }
    : awardPile(next, outcome.challengeFailedWinner, "tribute");
  return checkElimination(next);
}

/** Either seat's attempt to grab the pile. `reactionMs` is measured entirely
 *  on that seat's own client (see `SlapClaim`) - the server/host only ever
 *  compares these values, never arrival order. `observedWindowId` is whichever
 *  window that client last saw open, so a legitimately-late claim for an
 *  already-resolved window is ignored instead of penalized. */
export function attemptSlap(
  state: GameState,
  seat: Seat,
  reactionMs: number,
  observedWindowId: number | null = null,
): GameState {
  if (state.phase !== "playing") throw new Error("game_finished");

  if (state.slapWindow !== null) {
    if (state.slapClaims.some((c) => c.seat === seat)) return state;
    const slapClaims = [...state.slapClaims, { seat, reactionMs }];
    if (slapClaims.length < 2) return { ...state, slapClaims };
    const winner = slapClaims[0].reactionMs <= slapClaims[1].reactionMs ? slapClaims[0].seat : slapClaims[1].seat;
    const closedId = state.slapWindow.id;
    const reactionMsBySeat = { [slapClaims[0].seat]: slapClaims[0].reactionMs, [slapClaims[1].seat]: slapClaims[1].reactionMs };
    const next = awardPile({ ...state, slapClaims }, winner, "slap", reactionMsBySeat);
    return checkElimination({ ...next, turn: winner, lastClosedSlapWindowId: closedId });
  }

  if (observedWindowId !== null && observedWindowId === state.lastClosedSlapWindowId) return state; // too late, not a foul
  return applyFalseSlapPenalty(state, seat);
}

/** Auto-resolves a window nobody (or only one seat) reacted to within
 *  `SLAP_GRACE_MS`: 1 claim wins uncontested, 0 claims just closes it - and
 *  the game continues with whatever turn/tribute the triggering flip already
 *  set, *unless* that flip also failed a tribute (`pendingTributeWinner`,
 *  see `submitFlip`), in which case the original automatic tribute award
 *  finally goes through now that the pattern's own window went unclaimed.
 *  Run opportunistically, like every other game's idle-turn/round-gate
 *  timers (see docs/TECH.md). */
export function resolveStaleSlapWindow(state: GameState, nowMs: number = Date.now()): GameState {
  const window = state.slapWindow;
  if (!window) return state;
  if (nowMs - window.openedAtMs < SLAP_GRACE_MS) return state;
  if (state.slapClaims.length === 1) {
    const winner = state.slapClaims[0].seat;
    const reactionMsBySeat = { [winner]: state.slapClaims[0].reactionMs };
    const next = awardPile(state, winner, "slap", reactionMsBySeat);
    return checkElimination({ ...next, turn: winner, lastClosedSlapWindowId: window.id });
  }
  // `?? null`: a match's persisted `GameState` may predate this field
  // entirely (loaded from storage as `undefined`, not `null`) - treat that
  // exactly like "no pending tribute award" instead of coercing it into seat
  // `undefined`.
  const pendingTributeWinner = state.pendingTributeWinner ?? null;
  if (pendingTributeWinner !== null) {
    const winner = pendingTributeWinner;
    const next = awardPile(state, winner, "tribute");
    return checkElimination({ ...next, turn: winner, lastClosedSlapWindowId: window.id });
  }
  return { ...state, slapWindow: null, slapClaims: [], lastClosedSlapWindowId: window.id };
}
