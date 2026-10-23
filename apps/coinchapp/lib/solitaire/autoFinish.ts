import { rankValue } from "./cards";
import { applyMove } from "./engine";
import type { GameState } from "./types";

/** Nothing left to decide: stock and waste are empty and every column card
 *  is face up. Each column is then one descending run, so the lowest card
 *  left is always on top of a column and always fits its foundation. */
export function canAutoFinish(state: GameState): boolean {
  if (state.phase !== "playing" || state.stock.length > 0 || state.waste.length > 0) return false;
  return state.tableau.every((column) => column.every((entry) => entry.faceUp));
}

/** Moves the lowest column top card onto its foundation. Returns null when
 *  `canAutoFinish` is false or nothing can move. */
export function autoFinishStep(state: GameState): GameState | null {
  if (!canAutoFinish(state)) return null;
  const tops = state.tableau
    .map((column, col) => ({ col, top: column.at(-1) }))
    .filter((entry) => entry.top)
    .sort((a, b) => rankValue(a.top!.card.rank) - rankValue(b.top!.card.rank));
  for (const { col, top } of tops) {
    const moved = applyMove(state, { kind: "tableau", col }, { kind: "foundation", suit: top!.card.suit });
    if (moved) return moved;
  }
  return null;
}
