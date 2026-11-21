// Player identity fields on the profile page: "Nom" and the mascot avatar.
// Both live in localStorage (via /shared/js/player-profile.js), and in the
// shared profile when signed in. Language
// follows `bergamots-lang` (same key as the hub); changing it here writes
// that key so login and the hub keep the chosen language.

import { initAccountSection, renderAccountSection } from "./profile-account.js";
import { initGameBreakdown, renderGameBreakdown } from "./profile-games.js";
import { initMascotPicker } from "./profile-mascot.js";
import { initMatchStats } from "./profile-stats.js";
import { initProfileTabs } from "./profile-tabs.js";

const NOTICE_TIMEOUT_MS = 1800;
const LANG_STORAGE_KEY = "bergamots-lang";
// Same key as auth.js (root, bundled — can't be imported from here, so the
// string is duplicated on purpose, same pattern as NAME_STORAGE_KEY in
// player-profile.js). See docs/tasks/unified-profile-accounts.md.
const ID_TOKEN_STORAGE_KEY = "bergamots-google-idtoken";
// Server-synced profile ({ name, avatarUrl, wins, losses }) once a live
// Google sign-in exists; null otherwise (falls back to local-only display).
let syncedProfile = null;
const LANGS = ["fr", "en", "es"];
const LANGUAGE_FLAGS = [
  { code: "fr", flag: "🇫🇷" },
  { code: "en", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" }
];

const MESSAGES = {
  fr: {
    documentTitle: "Profil — Muchogames",
    title: "Profil",
    tabInfo: "Infos",
    tabStats: "Statistiques",
    avatarAlt: "Mascotte du joueur",
    changeAvatar: "Changer de mascotte",
    pickMascot: "Choisis ta mascotte",
    nameLabel: "Nom",
    namePlaceholder: "Ton nom",
    save: "Enregistrer",
    saved: "Enregistré ✓",
    backAria: "Retour à l'accueil",
    settingsAria: "Paramètres",
    options: "Options",
    language: "Langue",
    close: "Fermer",
    matchesZero: "Aucune partie lancée",
    matchesOne: "1 partie lancée",
    matchesMany: "{count} parties lancées",
    favoritesTitle: "Jeux préférés",
    favoritesEmpty: "Tes jeux les plus joués apparaîtront ici.",
    winsLabel: "Victoires",
    lossesLabel: "Défaites"
  },
  en: {
    documentTitle: "Profile — Muchogames",
    title: "Profile",
    tabInfo: "Info",
    tabStats: "Statistics",
    avatarAlt: "Player mascot",
    changeAvatar: "Change mascot",
    pickMascot: "Pick your mascot",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    save: "Save",
    saved: "Saved ✓",
    backAria: "Back to hub",
    settingsAria: "Settings",
    options: "Options",
    language: "Language",
    close: "Close",
    matchesZero: "No matches started",
    matchesOne: "1 match started",
    matchesMany: "{count} matches started",
    favoritesTitle: "Favorite games",
    favoritesEmpty: "Your most played games will show up here.",
    winsLabel: "Wins",
    lossesLabel: "Losses"
  },
  es: {
    documentTitle: "Perfil — Muchogames",
    title: "Perfil",
    tabInfo: "Info",
    tabStats: "Estadísticas",
    avatarAlt: "Mascota del jugador",
    changeAvatar: "Cambiar de mascota",
    pickMascot: "Elige tu mascota",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre",
    save: "Guardar",
    saved: "Guardado ✓",
    backAria: "Volver al inicio",
    settingsAria: "Ajustes",
    options: "Opciones",
    language: "Idioma",
    close: "Cerrar",
    matchesZero: "Ninguna partida empezada",
    matchesOne: "1 partida empezada",
    matchesMany: "{count} partidas empezadas",
    favoritesTitle: "Juegos favoritos",
    favoritesEmpty: "Tus juegos más jugados aparecerán aquí.",
    winsLabel: "Victorias",
    lossesLabel: "Derrotas"
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  initOptionsPanel();
  initLangSwitcher();
  applyProfileCopy();
  initProfileTabs();
  await window.MuchogamesProfileResults?.migrateLocalResultsOnce?.();
  await loadSyncedProfile();
  initNameForm();
  renderAvatarPreview();
  initMascotPicker(onMascotPicked);
  initMatchStats(getCopy(), gameResultsOverride());
  initGameBreakdown(getStoredIdToken(), readStoredLang());
  initAccountSection(getStoredIdToken(), readStoredLang());
});

function gameResultsOverride() {
  return syncedProfile
    ? { wins: syncedProfile.wins, losses: syncedProfile.losses }
    : null;
}

function getStoredIdToken() {
  try {
    const token = localStorage.getItem(ID_TOKEN_STORAGE_KEY) || "";
    return token && !isJwtExpired(token) ? token : "";
  } catch {
    return "";
  }
}

function isJwtExpired(jwt) {
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return !payload.exp || Date.now() / 1000 >= payload.exp;
  } catch {
    return true;
  }
}

// Best-effort: a missing/expired token or a failed call just leaves
// syncedProfile null, and every render falls back to local-only, exactly
// like being signed out.
async function loadSyncedProfile() {
  const idToken = getStoredIdToken();
  if (!idToken) return;
  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", idToken })
    });
    if (!response.ok) return;
    const data = await response.json();
    syncedProfile = data?.profile || null;
    adoptSyncedMascot();
  } catch {
    // Offline/blocked — not fatal.
  }
}

// The shared profile's mascot wins; a profile without one (new, or a legacy
// uploaded photo) receives this browser's mascot.
function adoptSyncedMascot() {
  if (!syncedProfile) return;
  const mascot = window.PlayerProfile.mascotFromAvatarUrl(
    syncedProfile.avatarUrl
  );
  if (mascot) {
    window.PlayerProfile.setMascot(mascot);
  } else {
    onMascotPicked(window.PlayerProfile.getMascot());
  }
}

// Fire-and-forget mirror of a local save into the shared profile. The local
// PlayerProfile write already happened by the time this is called, so a
// failure here never loses the player's edit — it just stays local-only.
function syncProfileField(patch) {
  const idToken = getStoredIdToken();
  if (!idToken) return;
  fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsert", idToken, ...patch })
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data?.profile) syncedProfile = data.profile;
    })
    .catch(() => {
      // Offline/blocked — not fatal.
    });
}

function getCopy() {
  return MESSAGES[readStoredLang()] || MESSAGES.fr;
}

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return LANGS.includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

function persistLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage unavailable — language just won't persist.
  }
}

function initOptionsPanel() {
  const trigger = document.getElementById("profile-options-button");
  const panel = document.getElementById("profile-options-panel");
  window.GameHeader?.initOptionsPanel(trigger, panel);
}

function initLangSwitcher() {
  const wrap = document.getElementById("profile-lang-selector");
  if (!wrap) return;

  LANGUAGE_FLAGS.forEach(({ code, flag }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lang-btn";
    button.dataset.lang = code;
    button.dataset.id = `profile-lang-${code}`;
    button.textContent = flag;
    button.setAttribute("aria-label", code.toUpperCase());
    button.addEventListener("click", () => selectProfileLang(code));
    wrap.appendChild(button);
  });
}

function selectProfileLang(lang) {
  persistLang(lang);
  applyProfileCopy();
  initMatchStats(getCopy(), gameResultsOverride());
  renderGameBreakdown(lang);
  renderAccountSection(lang);
}

function applyProfileCopy() {
  const copy = getCopy();
  const lang = readStoredLang();
  document.documentElement.lang = lang;
  document.title = copy.documentTitle;
  setText("profile-title", copy.title);
  setText("profile-tab-info", copy.tabInfo);
  setText("profile-tab-stats", copy.tabStats);
  setText("profile-name-label", copy.nameLabel);
  setText("profile-name-save-button", copy.save);
  setText("profile-name-saved-notice", copy.saved);
  setText("profile-mascot-change-button", copy.changeAvatar);
  setText("profile-mascot-picker-title", copy.pickMascot);
  setText("profile-mascot-picker-close", copy.close);
  setText("profile-favorites-title", copy.favoritesTitle);
  setText("profile-options-title", copy.options);
  setText("profile-lang-section-title", copy.language);

  setPlaceholder("profile-name-input", copy.namePlaceholder);
  setAria("profile-back-button", copy.backAria);
  setAria("profile-options-button", copy.settingsAria);
  setAria("profile-options-close", copy.close);
  setAria("profile-lang-selector", copy.language);
  setAria("profile-avatar-preview", copy.avatarAlt, "alt");
  setAria("profile-avatar-button", copy.changeAvatar);
  syncLangButtons(lang);
}

function syncLangButtons(lang) {
  document
    .querySelectorAll("#profile-lang-selector .lang-btn")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
}

function setText(dataId, text) {
  const node = document.querySelector(`[data-id="${dataId}"]`);
  if (node) node.textContent = text;
}

function setPlaceholder(dataId, text) {
  const node = document.querySelector(`[data-id="${dataId}"]`);
  if (node) node.placeholder = text;
}

function setAria(dataId, text, attr = "aria-label") {
  const node = document.querySelector(`[data-id="${dataId}"]`);
  if (node) {
    node.setAttribute(attr, text);
    if (attr === "aria-label") node.title = text;
  }
}

function initNameForm() {
  const form = document.getElementById("profile-name-form");
  const input = document.getElementById("profile-name-input");
  const notice = document.getElementById("profile-name-saved-notice");
  if (!form || !input) return;

  input.value = syncedProfile?.name || window.PlayerProfile.getName();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();
    window.PlayerProfile.setName(name);
    syncProfileField({ name });
    showNotice(notice);
  });
}

function onMascotPicked(id) {
  window.PlayerProfile.setMascot(id);
  const avatarUrl = window.PlayerProfile.mascotSrc(id);
  if (syncedProfile) syncedProfile.avatarUrl = avatarUrl;
  syncProfileField({ avatarUrl });
  renderAvatarPreview();
}

function renderAvatarPreview() {
  const preview = document.getElementById("profile-avatar-preview");
  if (preview) preview.src = window.PlayerProfile.getAvatar();
}

let noticeTimeoutId;

function showNotice(notice) {
  if (!notice) return;
  notice.hidden = false;
  clearTimeout(noticeTimeoutId);
  noticeTimeoutId = setTimeout(() => {
    notice.hidden = true;
  }, NOTICE_TIMEOUT_MS);
}
