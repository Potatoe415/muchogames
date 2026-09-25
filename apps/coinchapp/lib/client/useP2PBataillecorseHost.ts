"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type Seat,
} from "@/lib/bataillecorse";
import type { BataillecorseActions } from "@/components/BataillecorseTable";
import type { GameView } from "@/lib/server/view";
import { seededRng } from "./cardGameDriver";
import type { P2PConnection } from "./p2p/connection";
import { buildBataillecorseSeatView, parseClientMessage, type ClientMessage, type RosterEntry } from "./p2p/protocol";
import { DEFAULT_BATAILLECORSE_DECK_SIZE, DEFAULT_BOT_THINK_MS, type GameSettings } from "@/lib/supabase/types";

/** Small buffer past `SLAP_GRACE_MS`, same reasoning as the local hook. */
const GRACE_BUFFER_MS = 80;
const BOT_FLIP_PACING_MS = 500;

export interface P2PBataillecorseHostConfig {
  mySeat: Seat;
  roster: RosterEntry[];
  /** Live connection for the other (non-host) seat, if it is human. */
  connections: Map<Seat, P2PConnection>;
  seed: number;
  botThinkMs?: number;
  deckSize?: DeckSize;
}

/**
 * Authoritative host for a la Bataille Corse ad-hoc table: same "host runs
 * bots + broadcasts views" shape as `useP2PPresidentHost`, but built on the
 * bespoke real-time flip/slap engine (see `useLocalBataillecorseGame` for the
 * annotated single-player version) rather than the generic turn-based bot loop.
 */
export function useP2PBataillecorseHost(config: P2PBataillecorseHostConfig): { gv: GameView; actions: BataillecorseActions } {
  const { mySeat, seed } = config;
  // Unique per match (see `buildSeatView`'s doc) - `useRecordMatchResult`'s
  // once-per-match dedup guard keys on this.
  const matchId = `adhoc-${seed}`;
  const botThinkMs = config.botThinkMs ?? DEFAULT_BOT_THINK_MS;
  const deckSize = config.deckSize ?? DEFAULT_BATAILLECORSE_DECK_SIZE;
  const settings: GameSettings = useMemo(() => ({ botThinkMs, bataillecorseDeckSize: deckSize }), [botThinkMs, deckSize]);
  const [state, setState] = useState<GameState>(() => createInitialState(seededRng(seed), deckSize));
  const stateRef = useRef(state);
  const [roster, setRoster] = useState<RosterEntry[]>(() => config.roster.map((entry) => ({ ...entry })));
  const rosterRef = useRef<RosterEntry[]>(roster);
  const connsRef = useRef(config.connections);

  const isBotSeat = useCallback((seat: Seat) => rosterRef.current[seat]?.isBot ?? true, []);

  const commitRoster = useCallback((next: RosterEntry[]) => {
    rosterRef.current = next;
    setRoster(next);
  }, []);

  const broadcast = useCallback(
    (next: GameState) => {
      for (const [seat, conn] of connsRef.current) {
        if (rosterRef.current[seat]?.isBot) continue;
        const view = buildBataillecorseSeatView(next, seat as Seat, rosterRef.current, settings, mySeat, matchId);
        conn.send(JSON.stringify({ t: "view", view }));
      }
    },
    [mySeat, settings, matchId],
  );

  const commit = useCallback(
    (next: GameState) => {
      stateRef.current = next;
      setState(next);
      broadcast(next);
    },
    [broadcast],
  );

  // The bot seat's plain flip - see `useLocalBataillecorseGame` for why this
  // is keyed on the whole `state`, not just phase/turn/slapWindow.
  useEffect(() => {
    const botSeat = ([0, 1] as Seat[]).find((s) => isBotSeat(s) && shouldBotFlip(redact(state, s), s));
    if (botSeat === undefined) return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (!isBotSeat(botSeat) || !shouldBotFlip(redact(current, botSeat), botSeat)) return;
      commit(submitFlip(current, botSeat));
    }, BOT_FLIP_PACING_MS);
    return () => clearTimeout(timer);
  }, [state, isBotSeat, commit]);

  // The bot seat's simulated reflex, plus the shared grace-timeout resolution,
  // whenever a fresh slap window opens.
  useEffect(() => {
    const window = state.slapWindow;
    if (!window) return;
    const botSeats = ([0, 1] as Seat[]).filter((s) => isBotSeat(s));
    const botTimers = botSeats.map((seat) => {
      const reactionMs = simulateBotReactionMs(botThinkMs);
      return setTimeout(() => {
        const current = stateRef.current;
        if (current.slapWindow?.id !== window.id) return;
        commit(attemptSlap(current, seat, reactionMs, window.id));
      }, reactionMs);
    });
    const graceTimer = setTimeout(() => {
      const current = stateRef.current;
      if (current.slapWindow?.id !== window.id) return;
      commit(resolveStaleSlapWindow(current, window.openedAtMs + SLAP_GRACE_MS + GRACE_BUFFER_MS));
    }, SLAP_GRACE_MS + GRACE_BUFFER_MS);
    return () => {
      botTimers.forEach(clearTimeout);
      clearTimeout(graceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the window's id, not the object, so a claim arriving for the same window never reschedules these timers.
  }, [state.slapWindow?.id, botThinkMs, isBotSeat, commit]);

  const applyRemote = useCallback(
    (msg: ClientMessage, seat: Seat) => {
      const current = stateRef.current;
      try {
        if (msg.t === "flip") commit(submitFlip(current, seat));
        else if (msg.t === "slap") commit(attemptSlap(current, seat, msg.reactionMs, msg.observedWindowId));
      } catch {
        // Illegal/stale move (e.g. a slap arriving just after the window closed
        // on this host) - ignore, the peer's next view refresh corrects it.
      }
    },
    [commit],
  );

  const demoteSeatToBot = useCallback(
    (seat: Seat) => {
      commitRoster(rosterRef.current.map((e) => (e.seat === seat ? { ...e, isBot: true } : e)));
    },
    [commitRoster],
  );

  const applyHello = useCallback(
    (seat: Seat, name: string) => {
      commitRoster(rosterRef.current.map((e) => (e.seat === seat ? { ...e, displayName: name } : e)));
      broadcast(stateRef.current);
    },
    [commitRoster, broadcast],
  );

  useEffect(() => {
    for (const [seat, conn] of connsRef.current) {
      conn.onMessage((raw) => {
        const msg = parseClientMessage(raw);
        if (!msg) return;
        if (msg.t === "hello") applyHello(seat as Seat, msg.name);
        else applyRemote(msg, seat as Seat);
      });
      conn.onClose(() => demoteSeatToBot(seat as Seat));
      const view = buildBataillecorseSeatView(stateRef.current, seat as Seat, rosterRef.current, settings, mySeat, matchId);
      conn.send(JSON.stringify({ t: "view", view }));
    }
  }, [applyRemote, applyHello, demoteSeatToBot, mySeat, settings, matchId]);

  const actions: BataillecorseActions = {
    onFlip: () => {
      const current = stateRef.current;
      if (!shouldBotFlip(redact(current, mySeat), mySeat)) return;
      commit(submitFlip(current, mySeat));
    },
    onSlap: (reactionMs, observedWindowId) => {
      commit(attemptSlap(stateRef.current, mySeat, reactionMs, observedWindowId));
    },
  };

  const gv = buildBataillecorseSeatView(state, mySeat, roster, settings, mySeat, matchId);
  return { gv, actions };
}
