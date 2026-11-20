"use client";

import { useEffect, useState } from "react";
import { applyPlay, chooseCard, type Card, type GameState, type Trick } from "@/lib/coinche";

const BOT_DELAY_MS = 800;
/** Same pause as the real tables' trick collect (`COLLECT_DELAY_MS`, `useLocalGame.ts`). */
const COLLECT_DELAY_MS = 1500;

/** Plays a scripted tutorial deal: you are seat 0, the engine's simple bot plays
 *  seats 1-3. A finished trick is held on the felt while it animates away. */
export function useTutorialDeal(initial: GameState) {
  const [state, setState] = useState(initial);
  const [held, setHeld] = useState<Trick | null>(null);

  const step = (seatState: GameState, card: Card) => {
    const next = applyPlay(seatState, seatState.turn, card);
    if (next.tricks.length > seatState.tricks.length) setHeld(next.tricks[next.tricks.length - 1]);
    setState(next);
  };

  useEffect(() => {
    if (held) {
      const timer = setTimeout(() => setHeld(null), COLLECT_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (state.phase !== "playing" || state.turn === 0) return;
    const timer = setTimeout(() => step(state, chooseCard(state)), BOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, held]);

  const myTurn = state.phase === "playing" && state.turn === 0 && !held;
  return { state, held, myTurn, play: (card: Card) => myTurn && step(state, card) };
}
