import { applyMove, legalTargets, movableCards } from "./engine";
import type { GameState, PileRef, Target } from "./types";

export interface TapResult {
  state: GameState;
  /** The picked-up pile waiting for a destination tap, if any. */
  selection: PileRef | null;
}

function asTarget(pile: PileRef): Target | null {
  if (pile.kind === "foundation") return { kind: "foundation", suit: pile.suit };
  if (pile.kind === "tableau") return { kind: "tableau", col: pile.col };
  return null;
}

function samePileRef(a: PileRef, b: PileRef): boolean {
  if (a.kind === "tableau" && b.kind === "tableau") return a.col === b.col && a.index === b.index;
  if (a.kind === "foundation" && b.kind === "foundation") return a.suit === b.suit;
  return a.kind === b.kind;
}

/** A tap on an Ace sends it to its own foundation, even when it could also
 *  sit on a 2. An Ace already on its foundation is left alone. */
function aceToFoundation(state: GameState, pile: PileRef): GameState | null {
  if (pile.kind === "foundation") return null;
  const [card, extra] = movableCards(state, pile);
  if (!card || extra || card.rank !== "A") return null;
  return applyMove(state, pile, { kind: "foundation", suit: card.suit });
}

/** One tap on the table. The first tap picks a card up (only if it can go
 *  somewhere), a tap on a legal destination then moves it there, a second tap
 *  on it puts it back down, and any other tap starts over from the tapped
 *  pile. An Ace is the exception: it goes straight to its foundation. */
export function resolveTap(state: GameState, selection: PileRef | null, pile: PileRef): TapResult {
  if (selection) {
    const target = asTarget(pile);
    const moved = target ? applyMove(state, selection, target) : null;
    if (moved) return { state: moved, selection: null };
    if (samePileRef(selection, pile)) return { state, selection: null };
  }
  const ace = aceToFoundation(state, pile);
  if (ace) return { state: ace, selection: null };
  return { state, selection: legalTargets(state, pile).length > 0 ? pile : null };
}
