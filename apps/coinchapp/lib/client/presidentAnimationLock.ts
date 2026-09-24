"use client";

import { useEffect, useState } from "react";
import type { Combo, PlayerView, Seat } from "@/lib/president";
import { PLAY_ENTER_MS, COLLECT_ANIMATION_MS } from "./usePresidentPileDisplay";
import { PILE_HOLD_MS } from "./usePresidentPileHold";

/** Matches `.belote-flash` (`app/globals.css`). Skip banner. */
export const SKIP_ANIMATION_MS = 2200;

/** Matches `.president-crown-pop` (`app/globals.css`). First-to-finish crown. */
export const PRESIDENT_CROWNED_ANIMATION_MS = 2400;

/** Fields every mode already shares on `GameState` and `PlayerView`. */
export interface PresidentAnimSource {
  phase: string;
  pile: { combo: Combo | null };
  lastBurn: { seat: Seat; combo: Combo } | null;
  lastSkip: { seat: Seat; skippedSeat: Seat; combo: Combo } | null;
  finishedOrder: readonly Seat[];
}

interface AnimSnap {
  phase: string;
  pileKey: string;
  cards: number;
  burnKey: string;
  skipKey: string;
  finished: number;
}

function comboKey(combo: Combo | null): string {
  return combo ? combo.cards.map((card) => `${card.rank}${card.suit}`).join(",") : "";
}

export function animSnap(source: PresidentAnimSource): AnimSnap {
  const burn = source.lastBurn;
  const skip = source.lastSkip;
  return {
    phase: source.phase,
    pileKey: comboKey(source.pile.combo),
    cards: source.pile.combo?.cards.length ?? 0,
    burnKey: burn ? `${burn.seat}:${comboKey(burn.combo)}` : "",
    skipKey: skip ? `${skip.seat}:${skip.skippedSeat}:${comboKey(skip.combo)}` : "",
    finished: source.finishedOrder.length,
  };
}

/** How long the next play must wait so every animation this move started
 *  can finish. Parallel cues take the longer one. A burn plays the closing
 *  combo in, then collects it, so those two add. */
export function presidentAnimationLockMs(prev: AnimSnap, next: AnimSnap): number {
  if (prev.phase !== "playing" || next.phase !== "playing") return 0;
  const burnNew = next.burnKey !== "" && next.burnKey !== prev.burnKey;
  const skipNew = next.skipKey !== "" && next.skipKey !== prev.skipKey;
  const passClear = prev.pileKey !== "" && next.pileKey === "" && !burnNew;
  const played = next.pileKey !== "" && next.pileKey !== prev.pileKey;
  const justFinished = next.finished > prev.finished;
  const justCrowned = prev.finished === 0 && justFinished;
  let ms = 0;
  if (burnNew) ms = PLAY_ENTER_MS + COLLECT_ANIMATION_MS;
  else if (passClear) ms = COLLECT_ANIMATION_MS;
  else if (played) ms = PLAY_ENTER_MS;
  if (skipNew) ms = Math.max(ms, SKIP_ANIMATION_MS);
  if (justCrowned) ms = Math.max(ms, PRESIDENT_CROWNED_ANIMATION_MS);
  // Same scope as `isBigPlay`: a quad lead, or the combo that emptied a hand.
  if (played && (next.cards === 4 || justFinished)) ms = Math.max(ms, PILE_HOLD_MS);
  return ms;
}

/** Bots already spend `thinkingMs` before their next move. Wait only the
 *  part of the animation that think-time does not already cover, so the
 *  move still cannot land before the animation ends. */
export function presidentBotPaceMs(prev: PresidentAnimSource, next: PresidentAnimSource, thinkingMs: number): number {
  return Math.max(0, presidentAnimationLockMs(animSnap(prev), animSnap(next)) - thinkingMs);
}

/** True while a just-arrived view is still animating. Mounting onto an
 *  existing view does not lock (no previous snap to diff). */
export function usePresidentAnimationLock(view: PlayerView): boolean {
  const [state, setState] = useState(() => ({ snap: animSnap(view), locked: false, ms: 0, token: 0 }));
  const snap = animSnap(view);
  if (
    snap.phase !== state.snap.phase ||
    snap.pileKey !== state.snap.pileKey ||
    snap.burnKey !== state.snap.burnKey ||
    snap.skipKey !== state.snap.skipKey ||
    snap.finished !== state.snap.finished
  ) {
    const ms = presidentAnimationLockMs(state.snap, snap);
    setState({ snap, locked: ms > 0, ms, token: state.token + 1 });
  }

  useEffect(() => {
    if (!state.locked) return;
    const token = state.token;
    const id = window.setTimeout(() => setState((current) => (current.token === token ? { ...current, locked: false } : current)), state.ms);
    return () => window.clearTimeout(id);
  }, [state.locked, state.token, state.ms]);

  return state.locked;
}
