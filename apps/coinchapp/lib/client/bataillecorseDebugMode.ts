"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bataillecorse-debug-mode";

/** Whether la Bataille Corse's debug overlay (see `BataillecorseDebugOverlay.tsx`)
 *  is on - a developer-only toggle checked once, on the game's splash screen
 *  (`app/bataillecorse/page.tsx`), and read here from every table that game
 *  can render into (solo/duel/online/ad-hoc). Persisted to `localStorage` (not
 *  a query param) so it survives the navigation from the splash screen to the
 *  actual `/local`, `/online`, or `/adhoc` game screen. */
export function isBataillecorseDebugModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setBataillecorseDebugModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(STORAGE_KEY, "1");
  else window.localStorage.removeItem(STORAGE_KEY);
}

/** Read once on mount - each table this game can render into is its own
 *  page/route (a fresh mount), so there is no need for a `storage` event
 *  listener to react to a change made in another tab. */
export function useBataillecorseDebugMode(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // Post-hydration browser read: deferred to after mount to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(isBataillecorseDebugModeEnabled());
  }, []);
  return enabled;
}
