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

/** One tap on the table. With a card picked up, a tap on a legal
 *  destination moves it there, a second tap on it puts it back down, and any
 *  other tap starts over from the tapped pile. Without one, the tapped
 *  card moves straight to its only legal destination, or is picked up when
 *  it has several (the player then taps the one they want). */
export function resolveTap(state: GameState, selection: PileRef | null, pile: PileRef): TapResult {
  if (selection) {
    const target = asTarget(pile);
    const moved = target ? applyMove(state, selection, target) : null;
    if (moved) return { state: moved, selection: null };
    if (samePileRef(selection, pile)) return { state, selection: null };
  }
  const targets = legalTargets(state, pile);
  if (targets.length === 1) {
    return { state: applyMove(state, pile, targets[0]) ?? state, selection: null };
  }
  return { state, selection: targets.length > 1 ? pile : null };
}
