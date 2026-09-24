"use client";

import { useEffect, useState } from "react";
import type { Combo, PlayerView, Seat } from "@/lib/president";

export type Pile = PlayerView["pile"];
export type BurnEvent = PlayerView["lastBurn"];

/** Matches `.played-card-enter` in `app/globals.css`. A closing burn combo
 *  that never sat on `pile.combo` (engine clears it in the same tick) still
 *  gets this window so it can slide in before the collect sweep starts. */
export const PLAY_ENTER_MS = 420;

/** Matches `.trick-collect-card` in `app/globals.css`. */
export const COLLECT_ANIMATION_MS = 1500;

export type PileDisplayPhase = "show" | "collect";

export interface PileDisplayState {
  stack: Combo[];
  comboKey: string;
  burnKey: string;
  phase: PileDisplayPhase;
  collectSeat: Seat | null;
  enterSeat: Seat | null;
  pendingCollectSeat: Seat | null;
  enterToken: number;
  collectToken: number;
  queued: Pile | null;
}

function comboKey(combo: Combo | null): string {
  return combo ? combo.cards.map((c) => `${c.rank}${c.suit}`).join(",") : "";
}

export function burnKey(burn: BurnEvent): string {
  return burn ? `${burn.seat}:${comboKey(burn.combo)}` : "";
}

function topCombo(stack: Combo[]): Combo | null {
  return stack.length > 0 ? stack[stack.length - 1]! : null;
}

function appendCombo(stack: Combo[], combo: Combo): Combo[] {
  const top = topCombo(stack);
  if (top && comboKey(top) === comboKey(combo)) return stack;
  return [...stack, combo].slice(-3);
}

export function initPileDisplayState(pile: Pile, lastBurn: BurnEvent): PileDisplayState {
  return {
    stack: pile.combo ? [pile.combo] : [],
    comboKey: comboKey(pile.combo),
    burnKey: burnKey(lastBurn),
    phase: "show",
    collectSeat: null,
    enterSeat: pile.leader,
    pendingCollectSeat: null,
    enterToken: 0,
    collectToken: 0,
    queued: null,
  };
}

function applyNewBurn(state: PileDisplayState, lastBurn: NonNullable<BurnEvent>, liveKey: string): PileDisplayState {
  return {
    ...state,
    stack: appendCombo(state.stack, lastBurn.combo),
    comboKey: liveKey,
    burnKey: burnKey(lastBurn),
    phase: "show",
    collectSeat: null,
    enterSeat: lastBurn.seat,
    pendingCollectSeat: lastBurn.seat,
    enterToken: state.enterToken + 1,
    queued: null,
  };
}

function applyNewCombo(state: PileDisplayState, pile: Pile, liveKey: string): PileDisplayState {
  return {
    ...state,
    stack: appendCombo(state.stack, pile.combo!),
    comboKey: liveKey,
    phase: "show",
    collectSeat: null,
    enterSeat: pile.leader,
    pendingCollectSeat: null,
    queued: null,
  };
}

function applyPassCollect(state: PileDisplayState, liveKey: string, nextBurnKey: string): PileDisplayState {
  return {
    ...state,
    comboKey: liveKey,
    burnKey: nextBurnKey,
    phase: "collect",
    collectSeat: state.enterSeat,
    pendingCollectSeat: null,
    collectToken: state.collectToken + 1,
    queued: null,
  };
}

function queueDuringAnim(state: PileDisplayState, pile: Pile): PileDisplayState {
  if (!pile.combo) return state;
  const incoming = comboKey(pile.combo);
  if (incoming === comboKey(topCombo(state.stack))) return state;
  if (state.queued && comboKey(state.queued.combo) === incoming) return state;
  return { ...state, queued: pile };
}

function isAnimating(state: PileDisplayState): boolean {
  return state.phase === "collect" || state.pendingCollectSeat !== null;
}

/** Pure transition for a newly-arrived live `pile`/`lastBurn`. A new burn
 *  always wins: the closing combo is forced onto the stack (play-enter) and
 *  a collect toward that seat is armed. An empty pile without a new burn is
 *  a pass-clear: collect toward whoever last led. Later plays that arrive
 *  while either animation is running are queued, not painted. */
export function advancePileDisplay(state: PileDisplayState, pile: Pile, lastBurn: BurnEvent): PileDisplayState {
  const liveKey = comboKey(pile.combo);
  const nextBurnKey = burnKey(lastBurn);
  const burnIsNew = Boolean(nextBurnKey && nextBurnKey !== state.burnKey);
  if (burnIsNew) return applyNewBurn(state, lastBurn!, liveKey);
  if (isAnimating(state)) return queueDuringAnim(state, pile);
  if (pile.combo !== null) {
    if (liveKey === state.comboKey) return state;
    return applyNewCombo(state, pile, liveKey);
  }
  if (state.stack.length === 0) {
    return liveKey === state.comboKey && nextBurnKey === state.burnKey
      ? state
      : { ...state, comboKey: liveKey, burnKey: nextBurnKey };
  }
  return applyPassCollect(state, liveKey, nextBurnKey);
}

export function beginPendingCollect(state: PileDisplayState): PileDisplayState {
  if (state.pendingCollectSeat === null) return state;
  return {
    ...state,
    phase: "collect",
    collectSeat: state.pendingCollectSeat,
    pendingCollectSeat: null,
    collectToken: state.collectToken + 1,
  };
}

export function endCollect(state: PileDisplayState): PileDisplayState {
  const cleared: PileDisplayState = {
    ...state,
    stack: [],
    comboKey: "",
    phase: "show",
    collectSeat: null,
    enterSeat: null,
    pendingCollectSeat: null,
    queued: null,
  };
  if (!state.queued?.combo) return cleared;
  return applyNewCombo(cleared, state.queued, comboKey(state.queued.combo));
}

/** Drives Président's pile play-enter and collect-fly animations. `pile` is
 *  the (possibly optimistic / hold-delayed) pile being rendered; `lastBurn`
 *  always comes from the real server view. */
export function usePresidentPileDisplay(pile: Pile, lastBurn: BurnEvent): {
  stack: Combo[];
  collecting: boolean;
  collectSeat: Seat | null;
  enterSeat: Seat | null;
} {
  const [state, setState] = useState<PileDisplayState>(() => initPileDisplayState(pile, lastBurn));

  const next = advancePileDisplay(state, pile, lastBurn);
  if (next !== state) setState(next);

  useEffect(() => {
    if (state.pendingCollectSeat === null) return;
    const id = window.setTimeout(() => setState((s) => beginPendingCollect(s)), PLAY_ENTER_MS);
    return () => window.clearTimeout(id);
  }, [state.pendingCollectSeat, state.enterToken]);

  useEffect(() => {
    if (state.phase !== "collect") return;
    const id = window.setTimeout(() => setState((s) => endCollect(s)), COLLECT_ANIMATION_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, state.collectToken]);

  return {
    stack: state.stack,
    collecting: state.phase === "collect",
    collectSeat: state.collectSeat,
    enterSeat: state.enterSeat,
  };
}
