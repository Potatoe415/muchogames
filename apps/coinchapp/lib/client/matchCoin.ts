"use client";

import { useEffect, useRef, useState } from "react";
import { toCoinchappGame } from "@/lib/profileGames";
import { startMatchCoin } from "@/lib/server/actions-match";

/** What the coin gate needs to know about the match on screen. */
export interface MatchInfo {
  id: string;
  game: string;
  status: string;
  /** False for an online spectator: only seated players pay. */
  seated: boolean;
}

const DEVICE_KEY = "muchogames-device-id";
const CHARGED_KEY = "coinchapp-charged-matches";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function matchFromView(gv: {
  gameId: string;
  gameType: string;
  status: string;
  mySeat: number | null;
}): MatchInfo {
  return { id: gv.gameId, game: gv.gameType, status: gv.status, seated: gv.mySeat !== null };
}

/** Hub launches carry `?mgDevice=` (the hub's anonymous coin counter id). */
export function captureDeviceId(): void {
  const fromHub = new URLSearchParams(window.location.search).get("mgDevice");
  if (!fromHub || !UUID_RE.test(fromHub)) return;
  try {
    localStorage.setItem(DEVICE_KEY, fromHub.toLowerCase());
  } catch {
    // Storage unavailable — a fresh id is minted per spend instead.
  }
}

function readDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

// Local games get a new random id on every page load while their state is
// restored from storage, so they are tracked per game: one local match of
// each game at a time. Online/ad-hoc ids are unique per match, except an
// online rematch, which reuses the room — hence the reset on "finished".
function chargeKey(id: string, game: string): string {
  return id.startsWith("local-") ? `local:${game}` : id;
}

function readCharged(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CHARGED_KEY) || "{}");
  } catch {
    return {};
  }
}

function setCharged(key: string, charged: boolean): void {
  const all = readCharged();
  if (charged) all[key] = true;
  else delete all[key];
  try {
    localStorage.setItem(CHARGED_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable — a reload may charge this match again.
  }
}

/** Spends one coin per match, once (root docs/PLATFORM_RULES.md). Returns
 *  true when the player is out of coins and must leave the table. */
export function useMatchCoin(match: MatchInfo | null): boolean {
  const [outOfCoins, setOutOfCoins] = useState(false);
  const pending = useRef<string | null>(null);
  const game = match?.game ?? "";
  const status = match?.status ?? "";
  const seated = match?.seated ?? false;
  const key = match ? chargeKey(match.id, game) : "";

  useEffect(() => {
    if (!key || !seated || !toCoinchappGame(game)) return;
    if (status === "finished") {
      setCharged(key, false);
      return;
    }
    if (status !== "playing" || readCharged()[key] || pending.current === key) return;
    pending.current = key;
    startMatchCoin(game, readDeviceId())
      .then(({ started }) => {
        if (started) setCharged(key, true);
        else setOutOfCoins(true);
      })
      .catch(() => setCharged(key, true))
      .finally(() => {
        pending.current = null;
      });
  }, [key, game, status, seated]);

  return outOfCoins;
}
