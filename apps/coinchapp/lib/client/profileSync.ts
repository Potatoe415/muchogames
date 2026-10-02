"use client";

import { syncSharedMatchResults } from "@/lib/server/actions-profile";
import {
  getMatchResultsByGame,
  getMatchResultStats,
  planSharedSync,
  sanitizeByGame,
  sanitizeStats,
  type MatchResultStats,
  type ResultsByGame,
  type SharedSyncBatch,
} from "./matchResultStats";

const SYNCED_KEY = "coinchapp-profile-synced";
const SYNCED_BY_GAME_KEY = "coinchapp-profile-synced-by-game";

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — the next flush retries the same delta.
  }
}

function readSynced(): MatchResultStats {
  return sanitizeStats(readJson(SYNCED_KEY));
}

function readSyncedByGame(): ResultsByGame {
  return sanitizeByGame(readJson(SYNCED_BY_GAME_KEY));
}

function markSynced(batch: SharedSyncBatch): void {
  const total = readSynced();
  writeJson(SYNCED_KEY, {
    wins: total.wins + batch.wins,
    losses: total.losses + batch.losses,
  });
  if (!batch.game) return;
  const byGame = readSyncedByGame();
  const current = byGame[batch.game] ?? { wins: 0, losses: 0 };
  byGame[batch.game] = {
    wins: current.wins + batch.wins,
    losses: current.losses + batch.losses,
  };
  writeJson(SYNCED_BY_GAME_KEY, byGame);
}

let tail: Promise<void> = Promise.resolve();

/** Pushes local wins/losses that are not on the shared profile yet, one
 *  batch per game. Pass the hub `profileCode` once, on the landing page. */
export function flushSharedMatchResults(code?: string | null): void {
  const job = tail.then(() => flushOnce(code ?? null));
  tail = job.catch(() => undefined);
}

async function flushOnce(code: string | null): Promise<void> {
  const batches = planSharedSync(
    getMatchResultStats(),
    readSynced(),
    getMatchResultsByGame(),
    readSyncedByGame(),
  );
  if (!code && batches.length === 0) return;
  // A code with nothing to send still has to be claimed to link the browser.
  const queue = batches.length > 0 ? batches : [{ game: null, wins: 0, losses: 0 }];
  let pendingCode = code;
  for (const batch of queue) {
    const result = await syncSharedMatchResults(
      pendingCode,
      batch.wins,
      batch.losses,
      batch.game,
    );
    if (pendingCode) {
      stripProfileCode();
      pendingCode = null;
    }
    if (!result.linked) return;
    markSynced(batch);
  }
}

function stripProfileCode(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("profileCode")) return;
  url.searchParams.delete("profileCode");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function captureProfileCode(): void {
  const code = new URLSearchParams(window.location.search).get("profileCode");
  flushSharedMatchResults(code);
}
