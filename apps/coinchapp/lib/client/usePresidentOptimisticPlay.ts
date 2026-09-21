"use client";

import type { Card, Combo, PlayerView } from "@/lib/president";
import { useInstantPending } from "./useInstantPending";

export interface UsePresidentOptimisticPlayResult {
  /** Hand with the just-submitted combo's cards already removed, so they
   *  disappear the instant a play is confirmed instead of waiting for the
   *  server round trip. */
  optimisticHand: Card[];
  /** The pile, with the just-played combo already sitting on top if the
   *  server hasn't echoed it back into `view.pile` yet. */
  optimisticPile: PlayerView["pile"];
  /** True while a play/pass is in flight - guards against double submits. */
  busy: boolean;
  /** Submit a combo: reflects it in `optimisticHand`/`optimisticPile`
   *  immediately, then awaits the real submit. */
  play: (combo: Combo, onPlay: (combo: Combo) => Promise<void> | void) => void;
  /** Run any other exclusive action (e.g. "Passer") under the same busy
   *  guard - no optimistic hand/pile change, since passing never touches them. */
  runExclusive: (action: () => Promise<void> | void) => void;
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function comboLeftHand(view: PlayerView, combo: Combo): boolean {
  return combo.cards.every((played) => !view.myHand.some((held) => cardKey(held) === cardKey(played)));
}

/**
 * Président's equivalent of `useOptimisticPlay`: same "feels instant online"
 * contract, but shaped for combos (1-4 same-rank cards confirmed together via
 * "Jouer", or auto-played as a single card when that's the only legal shape)
 * instead of one bare card tapped straight out of hand - see
 * `PresidentTable.tsx`.
 */
export function usePresidentOptimisticPlay(view: PlayerView): UsePresidentOptimisticPlayResult {
  const { pending, busy, run, runLocked } = useInstantPending<Combo>((combo) => comboLeftHand(view, combo));

  function play(combo: Combo, onPlay: (combo: Combo) => Promise<void> | void) {
    run(combo, () => onPlay(combo));
  }

  const pendingIds = pending ? new Set(pending.cards.map(cardKey)) : null;
  const optimisticHand = pendingIds ? view.myHand.filter((c) => !pendingIds.has(cardKey(c))) : view.myHand;
  const optimisticPile = pending ? { ...view.pile, combo: pending } : view.pile;

  return { optimisticHand, optimisticPile, busy, play, runExclusive: runLocked };
}
