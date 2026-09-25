import { canPass, legalCombos } from "./play";
import type { Card, Combo, GameState, PendingExchange, Phase, Pile, RoundResult, Seat, SeatScores, Titles } from "./types";

/** What a single seat is allowed to see. Never includes other players' hands.
 *  `pendingExchange` carries no secret information (owed counts/awaiting seats
 *  are public), so it is passed through unfiltered. */
export interface PlayerView {
  mySeat: Seat;
  phase: Phase;
  roundIndex: number;
  turn: Seat;
  myHand: Card[];
  handCounts: number[];
  /** Legal combos for me right now (empty unless it is my turn to play). */
  legalCombos: Combo[];
  canPass: boolean;
  pile: Pile;
  /** Not secret (a burn is always a face-up combo): passed through so the
   *  client can show a "the pile got burned" animation - see `GameState.lastBurn`. */
  lastBurn: GameState["lastBurn"];
  /** Not secret (a skip is always a face-up combo + a public seat): passed
   *  through so the client can show a "turn skipped" animation - see
   *  `GameState.lastSkip`. */
  lastSkip: GameState["lastSkip"];
  revolution: boolean;
  finishedOrder: Seat[];
  /** Seats that emptied their hand on a losing 2 (single, pair, or triple).
   *  Public — the combo was face-up — so the table can mark them with a peach. */
  losingFinishSeats: Seat[];
  titles: Titles | null;
  pendingExchange: PendingExchange | null;
  /** Not secret (already-moved, face-up cards - same rationale as `lastBurn`):
   *  passed through so the Trou du Cul/Vice-Trou du Cul can see what left
   *  their hand during the forced half of the exchange. */
  forcedTransfers: GameState["forcedTransfers"];
  totalScores: SeatScores;
  roundHistory: RoundResult[];
  lastRoundResult: RoundResult | null;
  roundsToPlay: number;
  winners: Seat[] | null;
}

export function redact(state: GameState, seat: Seat): PlayerView {
  return {
    mySeat: seat,
    phase: state.phase,
    roundIndex: state.roundIndex,
    turn: state.turn,
    myHand: state.hands[seat] ?? [],
    handCounts: state.hands.map((h) => h.length),
    legalCombos: legalCombos(state, seat),
    canPass: canPass(state, seat),
    pile: state.pile,
    lastBurn: state.lastBurn,
    lastSkip: state.lastSkip,
    revolution: state.revolution,
    finishedOrder: state.finishedOrder,
    losingFinishSeats: state.losingFinishSeats,
    titles: state.titles,
    pendingExchange: state.pendingExchange,
    forcedTransfers: state.forcedTransfers,
    totalScores: state.totalScores,
    roundHistory: state.roundHistory,
    lastRoundResult: state.lastRoundResult,
    roundsToPlay: state.roundsToPlay,
    winners: state.winners ?? null,
  };
}
