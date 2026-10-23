import type { Rng } from "@/lib/cards";
import { buildDeck, shuffle } from "./cards";
import type { DrawCount, GameState, TableauCard } from "./types";

export const TABLEAU_COLUMNS = 7;

/** Klondike deal: column `i` gets `i + 1` cards, only its top one face up;
 *  the 24 cards left form the stock. */
export function createInitialState(rng: Rng, drawCount: DrawCount): GameState {
  const deck = shuffle(buildDeck(), rng);
  const tableau: TableauCard[][] = [];
  let next = 0;
  for (let col = 0; col < TABLEAU_COLUMNS; col++) {
    const column: TableauCard[] = [];
    for (let row = 0; row <= col; row++) {
      column.push({ card: deck[next++], faceUp: row === col });
    }
    tableau.push(column);
  }
  return {
    phase: "playing",
    drawCount,
    stock: deck.slice(next),
    waste: [],
    foundations: { H: [], D: [], C: [], S: [] },
    tableau,
    moves: 0,
  };
}
