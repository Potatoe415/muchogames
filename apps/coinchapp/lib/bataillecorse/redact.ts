import type { Card, FalseSlapEvent, GameState, PileWinEvent, Seat, SlapClaim, SlapWindow, Tribute } from "./types";
import { otherSeat } from "./tribute";

/** Nothing about the center pile or either stock's *count* is hidden - both
 *  players physically see the same shared pile and remaining pile heights.
 *  Each stock's remaining *order* stays hidden from the opponent. The acting
 *  seat is told only its own top card (`myTopCard`) so a flip can paint on
 *  the same frame; that card is never rendered on the stock itself. */
export interface PlayerView {
  phase: GameState["phase"];
  mySeat: Seat;
  turn: Seat;
  myStockCount: number;
  opponentStockCount: number;
  /** This seat's next card to flip (stock top). Null when the stock is empty.
   *  Never included in the opponent's view. */
  myTopCard: Card | null;
  pile: Card[];
  tribute: Tribute | null;
  slapWindow: SlapWindow | null;
  slapClaims: SlapClaim[];
  lastClosedSlapWindowId: number | null;
  winner: Seat | null;
  lastPileWin: PileWinEvent | null;
  lastFalseSlap: FalseSlapEvent | null;
}

function stockTop(stock: Card[]): Card | null {
  return stock.length === 0 ? null : stock[stock.length - 1];
}

export function redact(state: GameState, seat: Seat): PlayerView {
  const opponent = otherSeat(seat);
  return {
    phase: state.phase,
    mySeat: seat,
    turn: state.turn,
    myStockCount: state.stocks[seat].length,
    opponentStockCount: state.stocks[opponent].length,
    myTopCard: stockTop(state.stocks[seat]),
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
