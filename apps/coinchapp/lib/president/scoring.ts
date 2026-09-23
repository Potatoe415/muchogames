import type { GameState, RoundResult, Seat, SeatScores, Title, Titles } from "./types";

const TITLES_BY_FINISH_RANK: Title[] = ["president", "vicePresident", "viceTrouDuCul", "trouDuCul"];

function titlesFromFinishOrder(finishedOrder: Seat[]): Titles {
  const titles: Title[] = [];
  finishedOrder.forEach((seat, index) => {
    titles[seat] = TITLES_BY_FINISH_RANK[index];
  });
  return titles as Titles;
}

/** House rule: any seat that finished this round by playing a losing 2
 *  (`GameState.losingFinishSeats`, set by `applyPlay`/`losesOnFinish`) drops
 *  behind every seat that did not, however early it actually emptied its
 *  hand - own relative order kept within each of the two groups. A no-op
 *  when nobody finished on a losing 2. */
function demoteLosingTwoFinishers(finishedOrder: Seat[], losingFinishSeats: Seat[]): Seat[] {
  if (losingFinishSeats.length === 0) return finishedOrder;
  const losers = new Set(losingFinishSeats);
  return [...finishedOrder.filter((s) => !losers.has(s)), ...finishedOrder.filter((s) => losers.has(s))];
}

export function computeRoundResult(state: GameState): RoundResult {
  const finishedOrder = demoteLosingTwoFinishers(state.finishedOrder, state.losingFinishSeats);
  return {
    roundIndex: state.roundIndex,
    finishedOrder,
    titles: titlesFromFinishOrder(finishedOrder),
  };
}

/** Lowest cumulative total wins (ties share the win), like Bouilla's scoring. */
function decideWinners(totals: SeatScores): Seat[] {
  const min = Math.min(...totals);
  return totals.flatMap((score, seat) => (score === min ? [seat as Seat] : []));
}

/** Each seat's finishing rank this round (1=President..4=Trou du Cul) is added
 *  to its cumulative total; assigns the titles the next round's exchange will
 *  use, and on the last round decides the match winner(s). */
export function finalizeRound(state: GameState): GameState {
  const result = computeRoundResult(state);
  const totalScores = state.totalScores.map(
    (score, seat) => score + result.finishedOrder.indexOf(seat as Seat) + 1,
  ) as SeatScores;
  const isLastRound = state.roundIndex + 1 >= state.roundsToPlay;
  return {
    ...state,
    totalScores,
    titles: result.titles,
    roundHistory: [...state.roundHistory, result],
    lastRoundResult: result,
    phase: isLastRound ? "finished" : "scoring",
    winners: isLastRound ? decideWinners(totalScores) : undefined,
  };
}
