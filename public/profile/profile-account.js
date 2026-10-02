// "My data" section of /profile: download everything the hub stores about
// the signed-in player, or delete the account (POST /api/profile `export` /
// `delete-account`). Shown only with a live Google sign-in.
const COPY = {
  fr: {
    title: "Mes données",
    export: "Exporter mes données",
    delete: "Supprimer mon compte",
    confirm:
      "Ton profil, tes victoires et tes statistiques par jeu seront effacés définitivement. Ce navigateur oubliera aussi ton nom, ton avatar, tes compteurs et tes favoris.",
    confirmYes: "Oui, supprimer définitivement",
    cancel: "Annuler",
    failed: "Ça n'a pas marché. Reconnecte-toi sur l'accueil puis réessaie."
  },
  en: {
    title: "My data",
    export: "Export my data",
    delete: "Delete my account",
    confirm:
      "Your profile, wins and per-game stats will be erased for good. This browser will also forget your name, avatar, counters and favorites.",
    confirmYes: "Yes, delete for good",
    cancel: "Cancel",
    failed: "That didn't work. Sign in again on the hub, then retry."
  },
  es: {
    title: "Mis datos",
    export: "Exportar mis datos",
    delete: "Eliminar mi cuenta",
    confirm:
      "Tu perfil, tus victorias y tus estadísticas por juego se borrarán para siempre. Este navegador también olvidará tu nombre, tu avatar, tus contadores y tus favoritos.",
    confirmYes: "Sí, eliminar para siempre",
    cancel: "Cancelar",
    failed:
      "No ha funcionado. Vuelve a iniciar sesión en el inicio y reinténtalo."
  }
};

// Everything this hub keeps about the player in this browser, besides the
// language choice. Same key strings as auth.js / player-profile.js /
// profile-results.js / hub-shelf.js, which this unbundled page cannot import.
const LOCAL_KEYS = [
  "bergamots-auth",
  "bergamots-google-idtoken",
  "bergamots-player-name",
  "bergamots-player-avatar",
  "bergamots-player-avatar-thumb",
  "bergamots-game-results",
  "bergamots-launch-counts",
  "bergamots-results-migrated",
  "muchogames-is-admin",
  "muchogames-recent-games",
  "muchogames-favorite-games"
];

const section = { idToken: "", lang: "fr" };

export function initAccountSection(idToken, lang) {
  section.idToken = idToken;
  const root = document.querySelector('[data-id="profile-account-section"]');
  if (!root || !idToken) return;
  root.hidden = false;
  document
    .querySelector('[data-id="profile-export-button"]')
    .addEventListener("click", exportData);
  document
    .querySelector('[data-id="profile-delete-button"]')
    .addEventListener("click", () => toggleConfirm(true));
  document
    .querySelector('[data-id="profile-delete-cancel-button"]')
    .addEventListener("click", () => toggleConfirm(false));
  document
    .querySelector('[data-id="profile-delete-confirm-button"]')
    .addEventListener("click", deleteAccount);
  renderAccountSection(lang);
}

export function renderAccountSection(lang) {
  section.lang = lang;
  const copy = COPY[lang] || COPY.fr;
  setText("profile-account-title", copy.title);
  setText("profile-export-button", copy.export);
  setText("profile-delete-button", copy.delete);
  setText("profile-delete-warning", copy.confirm);
  setText("profile-delete-confirm-button", copy.confirmYes);
  setText("profile-delete-cancel-button", copy.cancel);
}

function setText(dataId, text) {
  const node = document.querySelector(`[data-id="${dataId}"]`);
  if (node) node.textContent = text;
}

function toggleConfirm(open) {
  document.querySelector('[data-id="profile-delete-confirm"]').hidden = !open;
  document.querySelector('[data-id="profile-delete-button"]').hidden = open;
  showError("");
}

function showError(message) {
  const node = document.querySelector('[data-id="profile-account-error"]');
  node.textContent = message;
  node.hidden = !message;
}

async function postProfile(payload) {
  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, idToken: section.idToken })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function exportData() {
  showError("");
  try {
    const data = await postProfile({ action: "export" });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `muchogames-mes-donnees-${data.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    showError((COPY[section.lang] || COPY.fr).failed);
  }
}

async function deleteAccount() {
  const button = document.querySelector(
    '[data-id="profile-delete-confirm-button"]'
  );
  button.disabled = true;
  showError("");
  try {
    await postProfile({ action: "delete-account", confirm: true });
    LOCAL_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Storage unavailable — nothing left to clear.
      }
    });
    window.location.assign("/");
  } catch {
    button.disabled = false;
    showError((COPY[section.lang] || COPY.fr).failed);
  }
}
