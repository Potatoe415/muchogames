"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

/**
 * Pending value that paints on the same frame as the tap, even when the next
 * call is a React 19 Server Action.
 *
 * React 19 defers `useState` in an event handler that also invokes a Server
 * Action until that action returns — the tapped card would sit still for the
 * whole round trip. `flushSync` commits the guess before the action is even
 * queued; the action itself runs on `setTimeout(0)` so the browser paints
 * that frame first and React does not treat this click as "a transition that
 * owns a Server Action". A confirmed copy is kept until `isCaughtUp` so the
 * guess does not snap back between the action returning and `getView` landing.
 */
export function useInstantPending<T>(isCaughtUp: (pending: T) => boolean): {
  pending: T | null;
  busy: boolean;
  run: (value: T, action: () => Promise<void> | void) => void;
  runLocked: (action: () => Promise<void> | void) => void;
} {
  const lock = useFlightLock();
  const held = useHeldPending(isCaughtUp);

  function run(value: T, action: () => Promise<void> | void) {
    if (!lock.tryLock(held.hasValue())) return;
    flushSync(() => held.reveal(value));
    queueAction(action, held.revert, lock.unlock);
  }

  function runLocked(action: () => Promise<void> | void) {
    if (!lock.tryLock(held.hasValue())) return;
    queueAction(action, held.revert, lock.unlock);
  }

  return { pending: held.pending, busy: lock.inFlight || held.pending !== null, run, runLocked };
}

function useFlightLock() {
  const inFlightRef = useRef(false);
  const [inFlight, setInFlight] = useState(false);

  function tryLock(held: boolean): boolean {
    if (inFlightRef.current || held) return false;
    inFlightRef.current = true;
    setInFlight(true);
    return true;
  }

  function unlock() {
    inFlightRef.current = false;
    setInFlight(false);
  }

  return { inFlight, tryLock, unlock };
}

function useHeldPending<T>(isCaughtUp: (pending: T) => boolean) {
  const [pending, setPending] = useState<T | null>(null);

  if (pending !== null && isCaughtUp(pending)) {
    setPending(null);
  }

  return {
    pending,
    hasValue: () => pending !== null,
    reveal: (value: T) => setPending(value),
    revert: () => setPending(null),
  };
}

function queueAction(
  action: () => Promise<void> | void,
  revert: () => void,
  unlock: () => void,
): void {
    // Macrotask, not a microtask: the browser must paint the flushSync DOM
    // update before React 19's Server Action runs, otherwise this click is
    // still "an event that invoked a Server Action" and the paint is held.
    setTimeout(() => {
      void settleAction(action, revert, unlock);
    }, 0);
}

async function settleAction(
  action: () => Promise<void> | void,
  revert: () => void,
  unlock: () => void,
): Promise<void> {
  try {
    await action();
  } catch {
    revert();
  } finally {
    unlock();
  }
}
