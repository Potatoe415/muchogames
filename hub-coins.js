// Daily coins badge (docs/PLATFORM_RULES.md): 20 per day, back at midnight
// Europe/Paris, spent per match by the games themselves through
// POST /api/match. The hub only spends one when it opens a
// `coinPolicy: "launch"` game, whose matches it cannot see. One server-side
// counter: the Google profile when signed in, else this browser's device id.
// Admins are unlimited.
import { readAdminFlag } from "./auth-admin.js";
import { ensureLiveIdToken } from "./auth.js";

// Must match DAILY_COINS in api/profile/_coins.js.
const DAILY_COINS = 20;
const REQUEST_TIMEOUT_MS = 4000;

const TIP_MS = 3000;

const LABELS = {
  fr: "Pièces du jour",
  en: "Today's coins",
  es: "Monedas de hoy"
};

const TIPS = {
  fr: {
    left: (value) => `${value} pièces restantes`,
    unlimited: "Pièces illimitées"
  },
  en: { left: (value) => `${value} coins left`, unlimited: "Unlimited coins" },
  es: {
    left: (value) => `${value} monedas restantes`,
    unlimited: "Monedas ilimitadas"
  }
};

const coins = { remaining: DAILY_COINS, unlimited: false };

async function postMatch(body) {
  await ensureLiveIdToken();
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

// TEMP: seven fast taps on the hub version. Silent on failure.
export async function refillCoins() {
  try {
    const { ok, data } = await postMatch({ action: "refill" });
    if (ok && data) applyBalance(data);
  } catch {
    // Offline — leave the counter as it is.
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

let tipTimer = 0;

function setTipOpen(container, open) {
  clearTimeout(tipTimer);
  container.classList.toggle("is-open", open);
  container.setAttribute("aria-expanded", String(open));
  if (open) tipTimer = setTimeout(() => setTipOpen(container, false), TIP_MS);
}

// Built once: the coin, its bubble, and the tap / outside-tap / Escape wiring.
function mountCoin(container) {
  const coin = document.createElement("span");
  coin.className = "hub-coins__coin";
  coin.setAttribute("aria-hidden", "true");
  const tip = document.createElement("span");
  tip.className = "hub-coins__tip";
  tip.dataset.id = "hub-coins-tip";
  tip.setAttribute("role", "status");
  container.append(coin, tip);

  container.addEventListener("click", () =>
    setTipOpen(container, !container.classList.contains("is-open"))
  );
  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target)) setTipOpen(container, false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setTipOpen(container, false);
  });
}

/** One coin in the header, filled like a pie chart by what is left today;
 *  a tap shows the count. */
export function renderCoinBadge(container, lang) {
  if (!container) return;
  const label = LABELS[lang] || LABELS.fr;
  const tips = TIPS[lang] || TIPS.fr;
  const value = coins.unlimited ? "∞" : `${coins.remaining}/${DAILY_COINS}`;
  const fill = coins.unlimited ? 1 : Math.min(1, coins.remaining / DAILY_COINS);
  if (!container.querySelector(".hub-coins__tip")) mountCoin(container);
  container.querySelector(".hub-coins__tip").textContent = coins.unlimited
    ? tips.unlimited
    : tips.left(value);
  container.style.setProperty("--coins-fill", String(fill));
  container.setAttribute("aria-label", `${label} : ${value}`);
  container.classList.toggle(
    "is-empty",
    !coins.unlimited && coins.remaining === 0
  );
}
