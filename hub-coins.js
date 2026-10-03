// Daily coins badge (docs/PLATFORM_RULES.md): 10 per day, back at midnight
// Europe/Paris, spent per match by the games themselves through
// POST /api/match. The hub only spends one when it opens a
// `coinPolicy: "launch"` game, whose matches it cannot see. One server-side
// counter: the Google profile when signed in, else this browser's device id.
// Admins are unlimited.
import { readAdminFlag } from "./auth-admin.js";

// Must match DAILY_COINS in api/profile/_coins.js.
const DAILY_COINS = 10;
const REQUEST_TIMEOUT_MS = 4000;

const LABELS = {
  fr: "Pièces du jour",
  en: "Today's coins",
  es: "Monedas de hoy"
};

const coins = { remaining: DAILY_COINS, unlimited: false };

async function postMatch(body) {
  const response = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      deviceId: window.MuchogamesMatch?.deviceId() || "",
      idToken: window.MuchogamesProfileResults?.readLiveIdToken() || ""
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  return {
    ok: response.ok,
    data: await response.json().catch(() => null)
  };
}

function applyBalance(data) {
  coins.unlimited = data.unlimited === true;
  const remaining = Number(data.remaining);
  if (!coins.unlimited && Number.isFinite(remaining)) {
    coins.remaining = Math.max(0, remaining);
  }
}

export async function initCoins() {
  coins.unlimited = readAdminFlag() === "1";
  try {
    const { ok, data } = await postMatch({ action: "coins" });
    if (ok && data) applyBalance(data);
  } catch {
    // Offline — keep the last known balance.
  }
}

/** For `coinPolicy: "launch"` games only. Resolves true when the launch may
 *  go ahead; a server or network failure lets the player through. */
export async function spendLaunchCoin(gameId) {
  try {
    const { ok, data } = await postMatch({ action: "start", gameId });
    if (!ok || !data) return true;
    if (data.started === false) {
      coins.remaining = 0;
      return false;
    }
    applyBalance(data);
    return true;
  } catch {
    return true;
  }
}

export function renderCoinBadge(container, lang) {
  if (!container) return;
  const label = LABELS[lang] || LABELS.fr;
  const value = coins.unlimited ? "∞" : `${coins.remaining}/${DAILY_COINS}`;
  container.textContent = `🪙 ${value}`;
  container.title = label;
  container.setAttribute("aria-label", `${label} : ${value}`);
  container.classList.toggle(
    "is-empty",
    !coins.unlimited && coins.remaining === 0
  );
}
