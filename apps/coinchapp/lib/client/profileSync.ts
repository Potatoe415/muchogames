"use client";

import { syncSharedMatchResults } from "@/lib/server/actions-profile";
import {
  getMatchResultStats,
  pendingSharedDelta,
  type MatchResultStats,
} from "./matchResultStats";

const SYNCED_KEY = "coinchapp-profile-synced";

function readSynced(): MatchResultStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYNCED_KEY) || "{}");
    return sanitize(parsed?.wins, parsed?.losses);
  } catch {
    return { wins: 0, losses: 0 };
  }
}

function writeSynced(stats: MatchResultStats): void {
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable — the next flush retries the same delta.
  }
}

function sanitize(wins: unknown, losses: unknown): MatchResultStats {
  const w = Number(wins);
  const l = Number(losses);
  return {
    wins: Number.isFinite(w) && w > 0 ? Math.floor(w) : 0,
    losses: Number.isFinite(l) && l > 0 ? Math.floor(l) : 0,
  };
}

let tail: Promise<void> = Promise.resolve();

/** Pushes local wins/losses that are not on the shared profile yet.
 *  Pass the hub `profileCode` once, on the landing page. */
export function flushSharedMatchResults(code?: string | null): void {
  const job = tail.then(() => flushOnce(code ?? null));
  tail = job.catch(() => undefined);
}

async function flushOnce(code: string | null): Promise<void> {
  const delta = pendingSharedDelta(getMatchResultStats(), readSynced());
  if (!code && delta.wins === 0 && delta.losses === 0) return;
  const result = await syncSharedMatchResults(code, delta.wins, delta.losses);
  if (code) stripProfileCode();
  if (!result.linked) return;
  const current = readSynced();
  writeSynced({
    wins: current.wins + delta.wins,
    losses: current.losses + delta.losses,
  });
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
