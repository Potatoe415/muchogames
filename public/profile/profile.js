// Player identity fields on the profile page: "Nom" and Avatar. Both are
// client-only (localStorage, via /shared/js/player-profile.js). Language
// follows `bergamots-lang` (same key as the hub); changing it here writes
// that key so login and the hub keep the chosen language.

import { initLaunchStats } from "./profile-stats.js";
import {
  initAvatarCrop,
  loadImageFromFile,
  openAvatarCrop
} from "./profile-crop.js";

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
    avatarAlt: "Avatar du joueur",
    changeAvatar: "Changer l'avatar",
    removeAvatar: "Retirer",
    nameLabel: "Nom",
    namePlaceholder: "Ton nom",
    save: "Enregistrer",
    saved: "Enregistré ✓",
    backAria: "Retour à l'accueil",
    settingsAria: "Paramètres",
    options: "Options",
    language: "Langue",
    close: "Fermer",
    cropTitle: "Recadrer",
    cropCancel: "Annuler",
    cropApply: "Valider",
    cropZoom: "Zoom",
    imageOnly: "Choisis un fichier image.",
    imageLoadError: "Impossible de charger cette image.",
    launchesZero: "Aucun jeu lancé",
    launchesOne: "1 jeu lancé",
    launchesMany: "{count} jeux lancés",
    favoritesTitle: "Jeux préférés",
    favoritesEmpty: "Tes jeux les plus lancés apparaîtront ici.",
    winsLabel: "Victoires",
    lossesLabel: "Défaites"
  },
  en: {
    documentTitle: "Profile — Muchogames",
    title: "Profile",
    avatarAlt: "Player avatar",
    changeAvatar: "Change avatar",
    removeAvatar: "Remove",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    save: "Save",
    saved: "Saved ✓",
    backAria: "Back to hub",
    settingsAria: "Settings",
    options: "Options",
    language: "Language",
    close: "Close",
    cropTitle: "Crop",
    cropCancel: "Cancel",
    cropApply: "Apply",
    cropZoom: "Zoom",
    imageOnly: "Choose an image file.",
    imageLoadError: "Could not load that image.",
    launchesZero: "No games launched",
    launchesOne: "1 game launched",
    launchesMany: "{count} games launched",
    favoritesTitle: "Favorite games",
    favoritesEmpty: "Your most launched games will show up here.",
    winsLabel: "Wins",
    lossesLabel: "Losses"
  },
  es: {
    documentTitle: "Perfil — Muchogames",
    title: "Perfil",
    avatarAlt: "Avatar del jugador",
    changeAvatar: "Cambiar avatar",
    removeAvatar: "Quitar",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre",
    save: "Guardar",
    saved: "Guardado ✓",
    backAria: "Volver al inicio",
    settingsAria: "Ajustes",
    options: "Opciones",
    language: "Idioma",
    close: "Cerrar",
    cropTitle: "Recortar",
    cropCancel: "Cancelar",
    cropApply: "Validar",
    cropZoom: "Zoom",
    imageOnly: "Elige un archivo de imagen.",
    imageLoadError: "No se pudo cargar esa imagen.",
    launchesZero: "Ningún juego iniciado",
    launchesOne: "1 juego iniciado",
    launchesMany: "{count} juegos iniciados",
    favoritesTitle: "Juegos favoritos",
    favoritesEmpty: "Tus juegos más lanzados aparecerán aquí.",
    winsLabel: "Victorias",
    lossesLabel: "Derrotas"
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  initOptionsPanel();
  initLangSwitcher();
  applyProfileCopy();
  await loadSyncedProfile();
  initNameForm();
  initAvatarUpload();
  initAvatarCrop();
  initLaunchStats(getCopy(), gameResultsOverride());
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
    const response = await fetch("/api/profile/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) return;
    const data = await response.json();
    syncedProfile = data?.profile || null;
  } catch {
    // Offline/blocked — not fatal.
  }
}

// Fire-and-forget mirror of a local save into the shared profile. The local
// PlayerProfile write already happened by the time this is called, so a
// failure here never loses the player's edit — it just stays local-only.
function syncProfileField(patch) {
  const idToken = getStoredIdToken();
  if (!idToken) return;
  fetch("/api/profile/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...patch })
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
  initLaunchStats(getCopy(), gameResultsOverride());
}

function applyProfileCopy() {
  const copy = getCopy();
  const lang = readStoredLang();
  document.documentElement.lang = lang;
  document.title = copy.documentTitle;
  setText("profile-title", copy.title);
  setText("profile-name-label", copy.nameLabel);
  setText("profile-name-save-button", copy.save);
  setText("profile-name-saved-notice", copy.saved);
  setText("profile-avatar-remove-button", copy.removeAvatar);
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

function initAvatarUpload() {
  const fileInput = document.getElementById("profile-avatar-input");
  const removeButton = document.getElementById("profile-avatar-remove-button");
  const errorNotice = document.getElementById("profile-avatar-error");
  if (!fileInput || !removeButton) return;

  renderAvatarPreview();
  fileInput.addEventListener("change", () =>
    onAvatarFilePicked(fileInput, errorNotice)
  );
  removeButton.addEventListener("click", () => {
    window.PlayerProfile.setAvatar("");
    syncProfileField({ avatarDataUrl: "" });
    renderAvatarPreview();
  });
}

async function onAvatarFilePicked(fileInput, errorNotice) {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = "";
  if (!file) return;
  hideError(errorNotice);

  if (!file.type.startsWith("image/")) {
    showError(errorNotice, getCopy().imageOnly);
    return;
  }

  try {
    const image = await loadImageFromFile(file);
    const cropped = await openAvatarCrop(image, getCopy());
    if (!cropped) return;
    window.PlayerProfile.setAvatar(cropped.avatar, cropped.thumb);
    syncProfileField({ avatarDataUrl: cropped.avatar });
    renderAvatarPreview();
  } catch {
    showError(errorNotice, getCopy().imageLoadError);
  }
}

function renderAvatarPreview() {
  const preview = document.getElementById("profile-avatar-preview");
  const placeholder = document.getElementById("profile-avatar-placeholder");
  const removeButton = document.getElementById("profile-avatar-remove-button");
  const avatar = syncedProfile?.avatarUrl || window.PlayerProfile.getAvatar();
  const hasAvatar = Boolean(avatar);
  preview.src = avatar;
  preview.hidden = !hasAvatar;
  placeholder.hidden = hasAvatar;
  removeButton.hidden = !hasAvatar;
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

function showError(notice, message) {
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = false;
}

function hideError(notice) {
  if (!notice) return;
  notice.hidden = true;
}
