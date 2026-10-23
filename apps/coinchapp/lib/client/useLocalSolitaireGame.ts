"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMove,
  autoFinishStep,
  canAutoFinish,
  createInitialState,
  draw,
  legalTargets,
  resolveTap,
  type DrawCount,
  type GameState,
  type PileRef,
  type Target,
} from "@/lib/solitaire";
import { seededRng } from "./cardGameDriver";
import { LOCAL_SOLITAIRE_STORAGE_KEY, loadPersistedGame, savePersistedGame } from "./localGamePersistence";

/** Pause between two cards climbing to the foundations on "Terminer". */
const AUTO_FINISH_STEP_MS = 90;

export interface SolitaireActions {
  onDraw: () => void;
  onTap: (pile: PileRef) => void;
  /** End of a drag and drop; ignored when the move is illegal. */
  onDrop: (from: PileRef, to: Target) => void;
  /** Only offered while `canAutoFinish` is true. */
  onAutoFinish: () => void;
}

/** Fully offline solo Klondike. Every move is applied locally on the same
 *  frame, so there is nothing to simulate optimistically. A saved game is
 *  resumed only when it uses the draw count the player just picked. */
export function useLocalSolitaireGame(seed: number, drawCount: DrawCount) {
  const [state, setState] = useState<GameState>(() => createInitialState(seededRng(seed), drawCount));
  const [selection, setSelection] = useState<PileRef | null>(null);
  // Fixed at mount: a re-rendered page hands in a fresh random `seed`, which
  // must not turn the same won game into a second recorded match.
  const [gameId] = useState(() => `local-solitaire-${seed}`);
  const stateRef = useRef(state);
  const selectionRef = useRef(selection);

  const commit = useCallback((next: GameState, nextSelection: PileRef | null) => {
    stateRef.current = next;
    selectionRef.current = nextSelection;
    setState(next);
    setSelection(nextSelection);
    savePersistedGame(LOCAL_SOLITAIRE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    const saved = loadPersistedGame<GameState>(LOCAL_SOLITAIRE_STORAGE_KEY);
    // Mount-only hydration from localStorage, not a reactive state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.drawCount === drawCount) commit(saved, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [autoFinishing, setAutoFinishing] = useState(false);
  useEffect(() => {
    if (!autoFinishing) return;
    const timer = window.setTimeout(() => {
      const next = autoFinishStep(stateRef.current);
      if (next) commit(next, null);
      if (!next || next.phase !== "playing") setAutoFinishing(false);
    }, AUTO_FINISH_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [autoFinishing, state, commit]);

  const actions: SolitaireActions = {
    onDraw: () => !autoFinishing && commit(draw(stateRef.current), null),
    onTap: (pile) => {
      if (autoFinishing) return;
      const result = resolveTap(stateRef.current, selectionRef.current, pile);
      commit(result.state, result.selection);
    },
    onDrop: (from, to) => {
      const moved = autoFinishing ? null : applyMove(stateRef.current, from, to);
      if (moved) commit(moved, null);
    },
    onAutoFinish: () => canAutoFinish(stateRef.current) && setAutoFinishing(true),
  };

  const targets: Target[] = selection ? legalTargets(state, selection) : [];
  const autoFinishAvailable = !autoFinishing && canAutoFinish(state);
  return { state, selection, targets, gameId, autoFinishAvailable, actions };
}
