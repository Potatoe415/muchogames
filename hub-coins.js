// Daily play coins: 10 per day, one spent per game launched from the hub,
// back to 10 at midnight Europe/Paris (decision 0046). Signed-in players are
// counted server-side (POST /api/profile `coins` / `spend-coin`); anonymous
// players — and signed-in ones whose 1h Google token has expired — fall back
// to this browser's counter. Admins are unlimited.
import { readAdminFlag } from "./auth-admin.js";

// Must match DAILY_COINS in api/profile/_coins.js.
const DAILY_COINS = 10;
const LOCAL_KEY = "muchogames-coins";

const COPY = {
  fr: {
    label: "Pièces du jour",
    out: "Vous n'avez plus de pièces pour aujourd'hui. Revenez demain !",
    ok: "OK"
  },
  en: {
    label: "Today's coins",
    out: "You're out of coins for today. Come back tomorrow!",
    ok: "OK"
  },
  es: {
    label: "Monedas de hoy",
    out: "No te quedan monedas por hoy. ¡Vuelve mañana!",
    ok: "OK"
  }
};

const coins = { remaining: DAILY_COINS, unlimited: false };

function parisToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(
    new Date()
  );
}

function readLocalSpent() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    const spent = Number(stored.spent);
    return stored.day === parisToday() && Number.isInteger(spent) && spent > 0
      ? spent
      : 0;
  } catch {
    return 0;
  }
}

function writeLocalSpent(spent) {
  try {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ day: parisToday(), spent })
    );
  } catch {
    // Storage unavailable — the counter just won't survive a reload.
  }
}

function liveIdToken() {
  return window.MuchogamesProfileResults?.readLiveIdToken() || "";
}

async function postProfile(action, idToken) {
  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, idToken })
  });
  return {
    status: response.status,
    data: await response.json().catch(() => null)
  };
}

// Keeps the browser counter aligned with the server, so an expired token
// later continues from the same count instead of granting a fresh 10.
function applyServerBalance(data) {
  coins.unlimited = data.unlimited === true;
  if (coins.unlimited) return;
  coins.remaining = Math.max(0, Number(data.remaining) || 0);
  writeLocalSpent(DAILY_COINS - coins.remaining);
}

export async function initCoins() {
  coins.unlimited = readAdminFlag() === "1";
  coins.remaining = Math.max(0, DAILY_COINS - readLocalSpent());
  const idToken = liveIdToken();
  if (!idToken || coins.unlimited) return;
  try {
    const { status, data } = await postProfile("coins", idToken);
    if (status === 200 && data) applyServerBalance(data);
  } catch {
    // Offline — keep the browser counter.
  }
}

function spendLocal() {
  const spent = readLocalSpent();
  if (spent >= DAILY_COINS) {
    coins.remaining = 0;
    return false;
  }
  writeLocalSpent(spent + 1);
  coins.remaining = DAILY_COINS - spent - 1;
  return true;
}

/** Resolves true when the launch may go ahead. A server or network failure
 *  lets the player through rather than blocking play. */
export async function spendCoin() {
  if (coins.unlimited) return true;
  const idToken = liveIdToken();
  if (!idToken) return spendLocal();
  try {
    const { status, data } = await postProfile("spend-coin", idToken);
    if (status === 401) return spendLocal();
    if (status !== 200 || !data) return true;
    if (data.unlimited) {
      coins.unlimited = true;
      return true;
    }
    applyServerBalance(data);
    return data.spent === true;
  } catch {
    return true;
  }
}

export function renderCoinBadge(container, lang) {
  if (!container) return;
  const copy = COPY[lang] || COPY.fr;
  const value = coins.unlimited ? "∞" : `${coins.remaining}/${DAILY_COINS}`;
  container.textContent = `🪙 ${value}`;
  container.title = copy.label;
  container.setAttribute("aria-label", `${copy.label} : ${value}`);
  container.classList.toggle(
    "is-empty",
    !coins.unlimited && coins.remaining === 0
  );
}

export function showOutOfCoins(lang) {
  const copy = COPY[lang] || COPY.fr;
  let dialog = document.querySelector('[data-id="hub-out-of-coins"]');
  if (!dialog) {
    dialog = document.createElement("div");
    dialog.className = "hub-coins-dialog";
    dialog.dataset.id = "hub-out-of-coins";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.innerHTML = `
      <div class="hub-coins-dialog__backdrop" data-coins-close></div>
      <div class="hub-coins-dialog__sheet">
        <p class="hub-coins-dialog__icon" aria-hidden="true">🪙</p>
        <p class="hub-coins-dialog__text" data-id="hub-out-of-coins-message"></p>
        <button type="button" class="hub-coins-dialog__ok" data-coins-close
          data-id="hub-out-of-coins-ok"></button>
      </div>`;
    dialog.querySelectorAll("[data-coins-close]").forEach((el) => {
      el.addEventListener("click", () => {
        dialog.hidden = true;
      });
    });
    document.body.appendChild(dialog);
  }
  dialog.querySelector(".hub-coins-dialog__text").textContent = copy.out;
  dialog.querySelector(".hub-coins-dialog__ok").textContent = copy.ok;
  dialog.hidden = false;
  dialog.querySelector(".hub-coins-dialog__ok").focus();
}
