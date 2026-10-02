// Google sign-in for /admin. The server decides who is an admin
// (ADMIN_USER_IDS); this page only carries the session token it hands back.

// Public OAuth Client ID, same value as the hub's auth.js (which this
// unbundled page cannot import).
const GOOGLE_CLIENT_ID =
  "45336592595-v4odhca7f963n784u3f8g8aoj6odns5h.apps.googleusercontent.com";
const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const ADMIN_ENDPOINT = "/api/admin";
const TOKEN_STORAGE_KEY = "muchogames-admin-token";
// Written by the hub's auth.js on Google sign-in. Reusing it lets an admin who
// is already signed in on the hub skip a second Google prompt.
const HUB_ID_TOKEN_STORAGE_KEY = "bergamots-google-idtoken";

let gsiLoading = null;

export class AdminRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function postAdmin(payload) {
  const response = await fetch(ADMIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new AdminRequestError(
      await readErrorMessage(response),
      response.status
    );
  }

  return response.json();
}

export async function signInWithIdToken(idToken) {
  const { token } = await postAdmin({ action: "login", idToken });
  storeToken(token);
  return token;
}

export function renderGoogleSignIn(container, onIdToken) {
  loadGsi().then(() => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onIdToken(response.credential),
      auto_select: false
    });
    container.innerHTML = "";
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with"
    });
  });
}

function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoading) return gsiLoading;

  gsiLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return gsiLoading;
}

async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.error?.message || `HTTP error ${response.status}.`;
  } catch {
    return `HTTP error ${response.status}.`;
  }
}

export function readHubIdToken() {
  try {
    return localStorage.getItem(HUB_ID_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeToken(token) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode): the session just won't survive a reload.
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
