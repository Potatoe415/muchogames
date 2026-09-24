"use client";

import { useEffect, useState } from "react";
import type { Combo, PlayerView } from "@/lib/president";

export type Pile = PlayerView["pile"];

/** Minimum time a "big" pile combo (see `isBigPlay`) must stay on screen
 *  before any later play is allowed to replace it - so every player (online:
 *  every real seat, not just whoever's turn is next) actually gets to see
 *  it, even if a bot - or a fast opponent - already moved on server-side. */
export const PILE_HOLD_MS = 2000;

function comboKey(combo: Combo | null): string {
  return combo ? combo.cards.map((c) => `${c.rank}${c.suit}`).join(",") : "";
}

/** A combo worth pausing on longer than an ordinary play: a straight quad
 *  lead (`cards.length === 4`, toggles revolution - see `lib/president/play.ts`)
 *  or the exact combo that emptied its seat's hand (`justFinished`, diffed
 *  from `finishedOrder`'s length by the caller). Does not cover a quad
 *  completed by matching up to 4 across several smaller plays - that already
 *  gets its own burn/collect animation (`usePresidentPileDisplay`); left
 *  alone here rather than duplicating that mechanism. */
export function isBigPlay(combo: Combo, justFinished: boolean): boolean {
  return combo.cards.length === 4 || justFinished;
}

interface QueuedPile {
  pile: Pile;
  big: boolean;
}

export interface PileHoldState {
  display: Pile;
  seenKey: string;
  seenBurnKey: string;
  seenFinishedOrderLength: number;
  holding: boolean;
  /** Bumped every time a fresh `PILE_HOLD_MS` window should start, including
   *  right after a previous one ends with another big play queued behind
   *  it - `holding` alone can't drive the hold effect's timer in that
   *  back-to-back case, since it would stay `true` across the transition
   *  (no detectable change for the effect's dependency array) - see
   *  `usePresidentPileHold`. */
  holdToken: number;
  queued: QueuedPile | null;
}

export function initPileHoldState(pile: Pile, finishedOrderLength: number, lastBurnKey = ""): PileHoldState {
  return {
    display: pile,
    seenKey: comboKey(pile.combo),
    seenBurnKey: lastBurnKey,
    seenFinishedOrderLength: finishedOrderLength,
    holding: false,
    holdToken: 0,
    queued: null,
  };
}

function revealPile(state: PileHoldState, pile: Pile, finishedOrderLength: number, lastBurnKey: string): PileHoldState {
  const liveKey = comboKey(pile.combo);
  const justFinished = finishedOrderLength > state.seenFinishedOrderLength;
  const big = pile.combo !== null && isBigPlay(pile.combo, justFinished);
  return {
    ...state,
    display: pile,
    seenKey: liveKey,
    seenBurnKey: lastBurnKey,
    seenFinishedOrderLength: finishedOrderLength,
    queued: null,
    holding: big,
    holdToken: big ? state.holdToken + 1 : state.holdToken,
  };
}

/** Pure transition for a newly-arrived live `pile`: reveals it right away if
 *  no hold is currently active, otherwise queues it (see `endPileHold`).
 *  A new `lastBurnKey` aborts any hold so the burn/collect animation can
 *  run on the live (already-cleared) pile. Returns the same `state`
 *  reference back untouched if neither the pile nor the burn is new. */
export function advancePileHold(
  state: PileHoldState,
  pile: Pile,
  finishedOrderLength: number,
  lastBurnKey = state.seenBurnKey,
): PileHoldState {
  const burnIsNew = Boolean(lastBurnKey && lastBurnKey !== state.seenBurnKey);
  if (burnIsNew) return { ...revealPile(state, pile, finishedOrderLength, lastBurnKey), holding: false, holdToken: state.holdToken };
  const liveKey = comboKey(pile.combo);
  if (liveKey === state.seenKey) {
    return lastBurnKey === state.seenBurnKey ? state : { ...state, seenBurnKey: lastBurnKey };
  }
  if (!state.holding) return revealPile(state, pile, finishedOrderLength, lastBurnKey);
  return {
    ...state,
    seenKey: liveKey,
    seenBurnKey: lastBurnKey,
    seenFinishedOrderLength: finishedOrderLength,
    queued: { pile, big: pile.combo !== null && isBigPlay(pile.combo, finishedOrderLength > state.seenFinishedOrderLength) },
  };
}

/** Pure transition once the hold window actually ends: reveals whatever
 *  combo was queued (if any), restarting the hold (a fresh `holdToken`) if
 *  that queued combo is itself big - so a second big play queued behind the
 *  first still gets its own full window. */
export function endPileHold(state: PileHoldState): PileHoldState {
  if (!state.queued) return { ...state, holding: false };
  const { pile, big } = state.queued;
  return { ...state, display: pile, queued: null, holding: big, holdToken: big ? state.holdToken + 1 : state.holdToken };
}

/** Holds the server-confirmed pile on screen for at least `PILE_HOLD_MS` once
 *  a "big" play lands (a quad, or a hand-emptying combo), instead of letting
 *  whatever comes next (a bot's move, or another quick player) replace it
 *  right away.
 *
 *  `pile`/`finishedOrderLength`/`lastBurnKey` must always be the real,
 *  non-optimistic view - the caller (`PresidentTable.tsx`) skips this hold
 *  entirely for the local player's own still-unconfirmed play, which must
 *  keep rendering instantly per the optimistic-play contract (see
 *  `usePresidentOptimisticPlay`). A new `lastBurnKey` aborts any in-flight
 *  hold so `usePresidentPileDisplay` can run the burn/collect animation. */
export function usePresidentPileHold(pile: Pile, finishedOrderLength: number, lastBurnKey = ""): Pile {
  const [state, setState] = useState<PileHoldState>(() => initPileHoldState(pile, finishedOrderLength, lastBurnKey));

  const next = advancePileHold(state, pile, finishedOrderLength, lastBurnKey);
  if (next !== state) setState(next);

  useEffect(() => {
    if (!state.holding) return;
    const id = window.setTimeout(() => setState((s) => endPileHold(s)), PILE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [state.holding, state.holdToken]);

  return state.display;
}
