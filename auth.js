// Google Sign-In status widget for the hub only (see docs/DECISIONS.md).
// No backend, no session: the credential Google returns is never verified or
// sent anywhere. Its JWT payload is decoded client-side only to read the
// signed-in email (kept in `localStorage` so it can be shown in the popover
// and survive a reload) and, once, the display name — used to pre-fill the
// profile's "Nom" field the first time only, never overwriting a name the
// player already typed themselves on /profile.

// Not a secret: this is the public OAuth Client ID, meant to be visible in
// browser code and restricted by its Authorized JavaScript origins (Google
// Cloud project "muchogames"). The paired client_secret from that project is
// never used here (no backend token exchange) and must never be committed.
const GOOGLE_CLIENT_ID =
  "45336592595-v4odhca7f963n784u3f8g8aoj6odns5h.apps.googleusercontent.com";

const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const AUTH_STORAGE_KEY = "bergamots-auth";
// Raw Google ID token (short-lived, ~1h) — never decoded/trusted by this
// file for anything beyond display; only api/profile/* verifies it server
// side. See docs/tasks/unified-profile-accounts.md.
const ID_TOKEN_STORAGE_KEY = "bergamots-google-idtoken";
// Same key as public/profile/profile.js — there is no shared module between
// this root-level bundled file and that unbundled page, so the string is
// duplicated on purpose (see docs/TECH.md).
const NAME_STORAGE_KEY = "bergamots-player-name";
const AVATAR_STORAGE_KEY = "bergamots-player-avatar";
const AVATAR_THUMB_STORAGE_KEY = "bergamots-player-avatar-thumb";
const LANG_STORAGE_KEY = "bergamots-lang";
const MAX_AVATAR_THUMB_CHARS = 6000;
const LANGS = ["fr", "en", "es"];
const WIDGET_ID = "auth-widget";
const GOOGLE_BUTTON_CONTAINER_ID = "auth-google-button";
const PROFILE_URL = "/profile";

const AUTH_COPY = {
  fr: {
    account: "Compte",
    profile: "Profil",
    logout: "Se déconnecter"
  },
  en: {
    account: "Account",
    profile: "Profile",
    logout: "Sign out"
  },
  es: {
    account: "Cuenta",
    profile: "Perfil",
    logout: "Cerrar sesión"
  }
};

const ACCOUNT_ICON_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.6-5-8-5Z"/>
</svg>`;

const authState = {
  email: readStoredEmail()
};

export function initAuthWidget() {
  renderAuthWidget();
  ensureAvatarThumb();
  loadGoogleScript(() => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    if (!authState.email) {
      renderGoogleButton();
    }
  });
}

function readStoredEmail() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    // Guards against the earlier boolean-flag format ("in"): only treat the
    // stored value as an email if it actually looks like one.
    return stored && stored.includes("@") ? stored : "";
  } catch {
    return "";
  }
}

function persistEmail(email) {
  try {
    if (email) {
      localStorage.setItem(AUTH_STORAGE_KEY, email);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode, etc.) — status just won't persist.
  }
}

// Read directly (duplicated key string, same pattern as NAME_STORAGE_KEY
// above) by /profile/profile.js and, later, same-origin games — none of
// them can import this bundled file. See docs/tasks/unified-profile-accounts.md.
function persistIdToken(idToken) {
  try {
    if (idToken) {
      localStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
    } else {
      localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable — shared-profile sync just won't happen.
  }
}

// Fire-and-forget name sync so /profile has something to show even before
// the player visits it themselves. Never blocks the sign-in UI, never
// throws: a failed sync just means the shared profile stays empty/local.
function syncProfileName(idToken) {
  try {
    fetch("/api/profile/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, name: getStoredPlayerName() })
    }).catch(() => {});
  } catch {
    // fetch unavailable/blocked — not fatal.
  }
}

function decodeJwtPayload(jwt) {
  try {
    const payloadSegment = jwt.split(".")[1];
    const json = atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Read by hub.js to forward the player's name as a `?name=` URL param when
// launching external games (see docs/TECH.md "Player identity").
export function getStoredPlayerName() {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredPlayerAvatarThumb() {
  try {
    const stored = localStorage.getItem(AVATAR_THUMB_STORAGE_KEY) || "";
    if (
      !stored.startsWith("data:image/jpeg") ||
      stored.length > MAX_AVATAR_THUMB_CHARS
    ) {
      return "";
    }
    return stored;
  } catch {
    return "";
  }
}

export function ensureAvatarThumb() {
  if (getStoredPlayerAvatarThumb() || !readStoredAvatar()) return;
  const image = new Image();
  image.onload = () => persistThumb(drawAvatarThumb(image));
  image.src = readStoredAvatar();
}

function drawAvatarThumb(image) {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 48, 48);
  context.drawImage(image, 0, 0, 48, 48);
  return canvas.toDataURL("image/jpeg", 0.5);
}

function persistThumb(dataUrl) {
  try {
    if (dataUrl && dataUrl.length <= MAX_AVATAR_THUMB_CHARS) {
      localStorage.setItem(AVATAR_THUMB_STORAGE_KEY, dataUrl);
    }
  } catch {
    // Storage unavailable — launches just won't carry an avatar.
  }
}

function readStoredAvatar() {
  try {
    const stored = localStorage.getItem(AVATAR_STORAGE_KEY) || "";
    return stored.startsWith("data:image/") ? stored : "";
  } catch {
    return "";
  }
}

function createTriggerAvatar(dataUrl) {
  const img = document.createElement("img");
  img.className = "auth-trigger-avatar";
  img.dataset.id = "auth-trigger-avatar";
  img.src = dataUrl;
  img.alt = "";
  img.addEventListener("error", () => {
    img.closest(".auth-widget")?.classList.remove("has-avatar");
    img.replaceWith(createSvgFragment());
  });
  return img;
}

function createSvgFragment() {
  const holder = document.createElement("span");
  holder.innerHTML = ACCOUNT_ICON_SVG;
  return holder.firstElementChild;
}

export function refreshAuthWidget() {
  renderAuthWidget();
  if (!authState.email) {
    renderGoogleButton();
  }
}

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return LANGS.includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

function authCopy() {
  return AUTH_COPY[readStoredLang()] || AUTH_COPY.fr;
}

// Only fills the profile "Nom" field the first time (i.e. while it is still
// empty), so it never overwrites a name the player already typed themselves.
function fillNameIfEmpty(googleName) {
  if (!googleName) return;
  try {
    if (!localStorage.getItem(NAME_STORAGE_KEY)) {
      localStorage.setItem(NAME_STORAGE_KEY, googleName);
    }
  } catch {
    // Storage unavailable — no pre-fill, not fatal.
  }
}

function loadGoogleScript(onLoaded) {
  const script = document.createElement("script");
  script.src = GSI_SCRIPT_URL;
  script.async = true;
  script.defer = true;
  script.onload = onLoaded;
  document.head.appendChild(script);
}

function handleCredentialResponse(response) {
  const payload = decodeJwtPayload(response.credential) || {};
  authState.email = payload.email || "";
  persistEmail(authState.email);
  persistIdToken(response.credential);
  fillNameIfEmpty(payload.name);
  syncProfileName(response.credential);
  // Do not write bergamots-lang here. Google locale must not override the
  // language the player already chose on the hub or the profile settings.
  closePopover();
  renderAuthWidget();
}

function logout() {
  authState.email = "";
  persistEmail("");
  persistIdToken("");
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  closePopover();
  renderAuthWidget();
  renderGoogleButton();
}

function closePopover() {
  document.getElementById(WIDGET_ID)?.classList.remove("is-open");
}

function renderAuthWidget() {
  const wrap = document.getElementById(WIDGET_ID);
  if (!wrap) return;

  wrap.innerHTML = "";
  wrap.classList.toggle("is-logged-in", !!authState.email);

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "auth-trigger";
  trigger.dataset.id = "auth-trigger";
  trigger.setAttribute("aria-label", authCopy().account);
  const avatar = readStoredAvatar();
  wrap.classList.toggle("has-avatar", Boolean(avatar));
  if (avatar) {
    trigger.appendChild(createTriggerAvatar(avatar));
  } else {
    trigger.innerHTML = ACCOUNT_ICON_SVG;
  }
  trigger.addEventListener("click", () => wrap.classList.toggle("is-open"));
  wrap.appendChild(trigger);

  wrap.appendChild(createPopoverNode());
}

function createPopoverNode() {
  const popover = document.createElement("div");
  popover.className = "auth-popover";

  if (authState.email) {
    popover.appendChild(createLoggedInContent());
  } else {
    const googleButtonContainer = document.createElement("div");
    googleButtonContainer.id = GOOGLE_BUTTON_CONTAINER_ID;
    popover.appendChild(googleButtonContainer);
  }

  return popover;
}

function createLoggedInContent() {
  const fragment = document.createDocumentFragment();

  const email = document.createElement("p");
  email.className = "auth-email";
  email.textContent = authState.email;
  fragment.appendChild(email);

  const strings = authCopy();
  const profileLink = document.createElement("a");
  profileLink.className = "auth-profile-link";
  profileLink.href = PROFILE_URL;
  profileLink.dataset.id = "auth-profile-link";
  profileLink.textContent = strings.profile;
  fragment.appendChild(profileLink);

  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.className = "auth-logout";
  logoutButton.dataset.id = "auth-logout-button";
  logoutButton.textContent = strings.logout;
  logoutButton.addEventListener("click", logout);
  fragment.appendChild(logoutButton);

  return fragment;
}

function renderGoogleButton() {
  const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
  if (!container || !window.google?.accounts?.id) return;

  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "medium",
    text: "signin_with",
    locale: readStoredLang()
  });
}
