import type { Card, FalseSlapEvent, GameState, PileWinEvent, Seat, SlapClaim, SlapWindow, Tribute } from "./types";
import { otherSeat } from "./tribute";

/** Nothing about the center pile or either stock's *count* is hidden - both
 *  players physically see the same shared pile and remaining pile heights.
 *  Each stock's remaining *order* stays hidden from the opponent. The acting
 *  seat is told its own upcoming cards (`myNextCards`, play order) so a
 *  tribute chain can paint every tap on the same frame; those cards are
 *  never rendered on the stock itself. */
export interface PlayerView {
  phase: GameState["phase"];
  mySeat: Seat;
  turn: Seat;
  myStockCount: number;
  opponentStockCount: number;
  /** This seat's next card to flip (stock top). Null when the stock is empty.
   *  Same card as `myNextCards[0]`. Never included in the opponent's view. */
  myTopCard: Card | null;
  /** Own stock, play order (index 0 = next flip). One card on a normal turn.
   *  While this seat owes a tribute, the next `attemptsLeft` cards (capped
   *  by the stock) so each tap in that chain can show its real face before
   *  the server round trip. Never the opponent's cards. */
  myNextCards: Card[];
  pile: Card[];
  tribute: Tribute | null;
  slapWindow: SlapWindow | null;
  slapClaims: SlapClaim[];
  lastClosedSlapWindowId: number | null;
  winner: Seat | null;
  lastPileWin: PileWinEvent | null;
  lastFalseSlap: FalseSlapEvent | null;
}

/** How many of this seat's own upcoming cards the view may include. A normal
 *  turn flips once. Paying a tribute can flip once per attempt still owed,
 *  and the client needs each of those faces up front to paint them on tap. */
function previewCount(state: GameState, seat: Seat, stockLength: number): number {
  const owed = state.tribute?.seat === seat ? state.tribute.attemptsLeft : 1;
  return Math.min(Math.max(owed, 0), stockLength);
}

/** Play order: index 0 is the stock top (next flip). */
function ownNextCards(state: GameState, seat: Seat): Card[] {
  const stock = state.stocks[seat];
  const n = previewCount(state, seat, stock.length);
  return stock.slice(stock.length - n).reverse();
}

export function redact(state: GameState, seat: Seat): PlayerView {
  const opponent = otherSeat(seat);
  const myNextCards = ownNextCards(state, seat);
  return {
    phase: state.phase,
    mySeat: seat,
    turn: state.turn,
    myStockCount: state.stocks[seat].length,
    opponentStockCount: state.stocks[opponent].length,
    myTopCard: myNextCards[0] ?? null,
    myNextCards,
    pile: state.pile,
    tribute: state.tribute,
    slapWindow: state.slapWindow,
    slapClaims: state.slapClaims,
    lastClosedSlapWindowId: state.lastClosedSlapWindowId,
    winner: state.winner,
    lastPileWin: state.lastPileWin,
    lastFalseSlap: state.lastFalseSlap,
  };
}
