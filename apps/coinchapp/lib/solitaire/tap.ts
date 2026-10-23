import { applyMove, legalTargets } from "./engine";
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

/** One tap on the table. A card never moves on its own: the first tap picks
 *  it up (only if it can go somewhere), a tap on a legal destination then
 *  moves it there, a second tap on it puts it back down, and any other tap
 *  starts over from the tapped pile. */
export function resolveTap(state: GameState, selection: PileRef | null, pile: PileRef): TapResult {
  if (selection) {
    const target = asTarget(pile);
    const moved = target ? applyMove(state, selection, target) : null;
    if (moved) return { state: moved, selection: null };
    if (samePileRef(selection, pile)) return { state, selection: null };
  }
  return { state, selection: legalTargets(state, pile).length > 0 ? pile : null };
}
