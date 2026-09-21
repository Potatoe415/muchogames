"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  attemptSlap,
  createInitialState,
  redact,
  resolveStaleSlapWindow,
  shouldBotFlip,
  submitFlip,
  SLAP_GRACE_MS,
  type DeckSize,
  type GameState,
  type PlayerView,
  type Seat,
} from "@/lib/bataillecorse";
import { seededRng } from "./cardGameDriver";
import { LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY, loadPersistedGame, savePersistedGame } from "./localGamePersistence";

/** Small buffer past `SLAP_GRACE_MS` so the local grace-timeout resolution
 *  never races a genuinely-just-landed claim right on the edge - same value
 *  as `useLocalBataillecorseGame`'s vs-bot hook. */
const GRACE_BUFFER_MS = 80;

function startState(seed: number, deckSize: DeckSize): GameState {
  return createInitialState(seededRng(seed), deckSize);
}

export interface BataillecorseDuelActions {
  onFlip: (seat: Seat) => void;
  onSlap: (seat: Seat, reactionMs: number, observedWindowId: number | null) => void;
}

/** Fully offline, face-to-face 1v1 la Bataille Corse: both seats are real
 *  humans sharing one device (see docs/DECISIONS.md), unlike
 *  `useLocalBataillecorseGame`'s single-human-vs-bot hook. Neither seat is
 *  simulated - `submitFlip`/`attemptSlap` only ever run from a genuine tap
 *  on that seat's own half of the screen (see `BataillecorseDuelTable`). */
export function useLocalBataillecorseDuelGame(
  seed: number,
  deckSize: DeckSize,
): { viewA: PlayerView; viewB: PlayerView; actions: BataillecorseDuelActions } {
  const [state, setState] = useState<GameState>(() => startState(seed, deckSize));
  const stateRef = useRef(state);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
    savePersistedGame(LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    const saved = loadPersistedGame<GameState>(LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY);
    // Mount-only hydration from localStorage, not a reactive state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) commit(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The grace-timeout resolution shared with every other mode (see
  // docs/DECISIONS.md): with no bot to simulate a reflex, this is the only
  // thing that ever closes a window neither human reacts to in time.
  useEffect(() => {
    const window = state.slapWindow;
    if (!window) return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (current.slapWindow?.id !== window.id) return;
      commit(resolveStaleSlapWindow(current, window.openedAtMs + SLAP_GRACE_MS + GRACE_BUFFER_MS));
    }, SLAP_GRACE_MS + GRACE_BUFFER_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the window's id, not the object, same as `useLocalBataillecorseGame`'s equivalent timer.
  }, [state.slapWindow?.id, commit]);

  const actions: BataillecorseDuelActions = {
    onFlip: (seat) => {
      // `shouldBotFlip` is really just "is it this seat's turn to flip right
      // now" - reused as-is (same as `useLocalBataillecorseGame`'s own seat
      // 0) instead of duplicating that check for a human seat.
      const current = stateRef.current;
      if (!shouldBotFlip(redact(current, seat), seat)) return;
      commit(submitFlip(current, seat));
    },
    onSlap: (seat, reactionMs, observedWindowId) => {
      commit(attemptSlap(stateRef.current, seat, reactionMs, observedWindowId));
    },
  };

  return { viewA: redact(state, 0), viewB: redact(state, 1), actions };
}
