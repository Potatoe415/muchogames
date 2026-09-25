"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  attemptSlap,
  createInitialState,
  redact,
  resolveStaleSlapWindow,
  shouldBotFlip,
  simulateBotReactionMs,
  submitFlip,
  SLAP_GRACE_MS,
  type DeckSize,
  type GameState,
} from "@/lib/bataillecorse";
import type { BataillecorseActions, BataillecorseGameView } from "@/components/BataillecorseTable";
import { DEFAULT_BATAILLECORSE_DECK_SIZE } from "@/lib/supabase/types";
import { useI18n } from "./i18n";
import { seededRng } from "./cardGameDriver";
import { LOCAL_BATAILLECORSE_STORAGE_KEY, loadPersistedGame, savePersistedGame } from "./localGamePersistence";

const BOT_SEAT = 1;
const BOT_NAME = "Adam";
/** Pacing before the bot's own plain flip - independent from its slap reflex
 *  (see `simulateBotReactionMs`), just enough to not feel instant/jarring. */
const BOT_FLIP_PACING_MS = 500;
/** Small buffer past `SLAP_GRACE_MS` so the local grace-timeout resolution
 *  never races the server-equivalent timing exactly on the edge. */
const GRACE_BUFFER_MS = 80;

function startState(seed: number, deckSize: DeckSize): GameState {
  return createInitialState(seededRng(seed), deckSize);
}

/** Fully offline 1v1 la Bataille Corse: you are seat 0, the bot is seat 1.
 *  Unlike every other local game (see `useLocalCardGame`), moves here are not
 *  strictly turn-by-turn - a slap window is a real-time race between the
 *  human tapping and the bot's own simulated reaction delay - so this hook
 *  is bespoke rather than reusing the generic turn-based bot loop. */
export function useLocalBataillecorseGame(
  seed: number,
  botThinkMs: number,
  deckSize: DeckSize = DEFAULT_BATAILLECORSE_DECK_SIZE,
): { gv: BataillecorseGameView; actions: BataillecorseActions } {
  const { t } = useI18n();
  const [state, setState] = useState<GameState>(() => startState(seed, deckSize));
  const stateRef = useRef(state);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
    savePersistedGame(LOCAL_BATAILLECORSE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    const saved = loadPersistedGame<GameState>(LOCAL_BATAILLECORSE_STORAGE_KEY);
    // Mount-only hydration from localStorage, not a reactive state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) commit(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The bot's plain flip, whenever it's actually its turn to act. Deliberately
  // keyed on the whole `state` (not just phase/turn/slapWindow), because the
  // bot's turn can persist across several flips in a row while it pays down a
  // tribute (attemptsLeft decrementing, `turn` unchanged each time) - each of
  // those still needs its own fresh timer.
  useEffect(() => {
    if (!shouldBotFlip(redact(state, BOT_SEAT), BOT_SEAT)) return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (!shouldBotFlip(redact(current, BOT_SEAT), BOT_SEAT)) return;
      commit(submitFlip(current, BOT_SEAT));
    }, BOT_FLIP_PACING_MS);
    return () => clearTimeout(timer);
  }, [state, commit]);

  // The bot's simulated reflex, plus the grace-timeout resolution shared with
  // online/ad-hoc (see docs/DECISIONS.md), whenever a fresh slap window opens.
  useEffect(() => {
    const window = state.slapWindow;
    if (!window) return;
    const botReactionMs = simulateBotReactionMs(botThinkMs);
    const botTimer = setTimeout(() => {
      const current = stateRef.current;
      if (current.slapWindow?.id !== window.id) return;
      commit(attemptSlap(current, BOT_SEAT, botReactionMs, window.id));
    }, botReactionMs);
    const graceTimer = setTimeout(() => {
      const current = stateRef.current;
      if (current.slapWindow?.id !== window.id) return;
      commit(resolveStaleSlapWindow(current, window.openedAtMs + SLAP_GRACE_MS + GRACE_BUFFER_MS));
    }, SLAP_GRACE_MS + GRACE_BUFFER_MS);
    return () => {
      clearTimeout(botTimer);
      clearTimeout(graceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the window's id, not the object, so a claim arriving for the same window never reschedules the bot's timer.
  }, [state.slapWindow?.id, botThinkMs, commit]);

  const actions: BataillecorseActions = {
    onFlip: () => {
      const current = stateRef.current;
      if (!shouldBotFlip(redact(current, 0), 0)) return;
      commit(submitFlip(current, 0));
    },
    onSlap: (reactionMs, observedWindowId) => {
      commit(attemptSlap(stateRef.current, 0, reactionMs, observedWindowId));
    },
  };

  const gv: BataillecorseGameView = {
    // Unique per match - see `useLocalGame.ts`'s `gameId` comment.
    gameId: `local-${seed}`,
    roomCode: "LOCAL",
    gameType: "bataillecorse",
    status: state.phase === "finished" ? "finished" : "playing",
    settings: { botThinkMs, bataillecorseDeckSize: deckSize },
    version: 0,
    players: [
      { seat: 0, displayName: t("defaultYouName"), isBot: false, team: "A", connected: true },
      { seat: 1, displayName: BOT_NAME, isBot: true, team: "B", connected: true },
    ],
    mySeat: 0,
    view: redact(state, 0),
    hostUserId: null,
    hostSeat: 0,
    isHost: true,
    // Local play never runs the server-side idle timer (no Server Actions
    // involved at all): these are inert placeholders.
    turnStartedAt: null,
    myMissedTurnsInRow: 0,
  };

  return { gv, actions };
}
