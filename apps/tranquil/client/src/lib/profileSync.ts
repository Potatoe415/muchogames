import { getMatchResultStats, pendingSharedDelta, type MatchResultStats } from './matchResultStats';

const SYNCED_KEY = 'tranquil-profile-synced';

function readSynced(): MatchResultStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYNCED_KEY) || '{}');
    const wins = Number(parsed?.wins);
    const losses = Number(parsed?.losses);
    return {
      wins: Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0,
      losses: Number.isFinite(losses) && losses > 0 ? Math.floor(losses) : 0,
    };
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

let tail: Promise<void> = Promise.resolve();

/** Pushes local wins/losses that are not on the shared hub profile yet. */
export function flushSharedMatchResults(code?: string | null): void {
  const job = tail.then(() => flushOnce(code ?? null));
  tail = job.catch(() => undefined);
}

async function flushOnce(code: string | null): Promise<void> {
  const delta = pendingSharedDelta(getMatchResultStats(), readSynced());
  if (!code && delta.wins === 0 && delta.losses === 0) return;
  const linked = await postDelta(code, delta);
  if (code) stripProfileCode();
  if (!linked) return;
  const current = readSynced();
  writeSynced({ wins: current.wins + delta.wins, losses: current.losses + delta.losses });
}

async function postDelta(code: string | null, delta: MatchResultStats): Promise<boolean> {
  const res = await fetch('/api/profile-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, wins: delta.wins, losses: delta.losses }),
  });
  if (!res.ok) return false;
  const body = (await res.json().catch(() => null)) as { linked?: boolean } | null;
  return Boolean(body?.linked);
}

function stripProfileCode(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('profileCode')) return;
  url.searchParams.delete('profileCode');
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function captureProfileCode(): void {
  const code = new URLSearchParams(window.location.search).get('profileCode');
  flushSharedMatchResults(code);
}
