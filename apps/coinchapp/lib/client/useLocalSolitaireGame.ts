"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
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

export interface SolitaireActions {
  onDraw: () => void;
  onTap: (pile: PileRef) => void;
}

/** Fully offline solo Klondike. Every move is applied locally on the same
 *  frame, so there is nothing to simulate optimistically. A saved game is
 *  resumed only when it uses the draw count the player just picked. */
export function useLocalSolitaireGame(seed: number, drawCount: DrawCount) {
  const [state, setState] = useState<GameState>(() => createInitialState(seededRng(seed), drawCount));
  const [selection, setSelection] = useState<PileRef | null>(null);
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

  const actions: SolitaireActions = {
    onDraw: () => commit(draw(stateRef.current), null),
    onTap: (pile) => {
      const result = resolveTap(stateRef.current, selectionRef.current, pile);
      commit(result.state, result.selection);
    },
  };

  const targets: Target[] = selection ? legalTargets(state, selection) : [];
  return { state, selection, targets, gameId: `local-solitaire-${seed}`, actions };
}
