import { AdminRequestError, postAdmin } from "./admin-auth.js";

// Must match the settings shape in api/_lib/hubSettings.js.
const FLAGS = ["hidden", "pinned", "new"];
const LANGS = ["fr", "en", "es"];
const UNAVAILABLE_MESSAGE =
  "Catalog settings unavailable. Run supabase/migrations/0006_hub_settings.sql.";

const editor = { token: "", games: [], onError: () => {} };

export function initCatalogEditor({ onError }) {
  editor.onError = onError;
  document
    .getElementById("admin-catalog-save")
    .addEventListener("click", saveCatalog);
}

export function hideCatalogEditor() {
  document.getElementById("admin-catalog").hidden = true;
}

export async function loadCatalogEditor(token, games) {
  if (!token) return;
  editor.token = token;
  editor.games = games;
  document.getElementById("admin-catalog").hidden = false;

  try {
    const { settings, updatedAt } = await postAdmin({
      action: "hub-settings-get",
      token
    });
    render(settings, updatedAt);
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  if (error instanceof AdminRequestError && error.status >= 500) {
    document.getElementById("admin-catalog-body").hidden = true;
    showStatus(UNAVAILABLE_MESSAGE);
    return;
  }
  editor.onError(error);
}

function render(settings, updatedAt) {
  document.getElementById("admin-catalog-body").hidden = false;
  const announcement = settings.announcement || {};
  document.getElementById("admin-announcement-active").checked =
    announcement.active === true;
  LANGS.forEach((lang) => {
    document.getElementById(`admin-announcement-${lang}`).value =
      announcement[lang] || "";
  });

  const rows = document.getElementById("admin-catalog-rows");
  rows.replaceChildren(
    ...editor.games.map((game) => createRow(game, settings))
  );
  showStatus(updatedAt ? `Last saved ${formatDate(updatedAt)}` : "");
}

function createRow(game, settings) {
  const row = document.createElement("tr");
  row.dataset.id = `admin-catalog-row-${game.id}`;
  row.dataset.gameId = game.id;

  const name = document.createElement("td");
  name.textContent = game.title;
  row.appendChild(name);

  FLAGS.forEach((flag) => {
    const cell = document.createElement("td");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.dataset.flag = flag;
    box.dataset.id = `admin-catalog-${flag}-${game.id}`;
    box.checked = (settings[flag] || []).includes(game.id);
    box.setAttribute("aria-label", `${flag}: ${game.title}`);
    cell.appendChild(box);
    row.appendChild(cell);
  });
  return row;
}

// Pinned games keep the hub-config.json order, like the old hard-coded list.
function collectSettings() {
  const rows = [...document.querySelectorAll("#admin-catalog-rows tr")];
  const settings = { announcement: { active: false } };
  FLAGS.forEach((flag) => {
    settings[flag] = rows
      .filter((row) => row.querySelector(`[data-flag="${flag}"]`).checked)
      .map((row) => row.dataset.gameId);
  });
  settings.announcement.active = document.getElementById(
    "admin-announcement-active"
  ).checked;
  LANGS.forEach((lang) => {
    settings.announcement[lang] = document
      .getElementById(`admin-announcement-${lang}`)
      .value.trim();
  });
  return settings;
}

async function saveCatalog() {
  const button = document.getElementById("admin-catalog-save");
  button.disabled = true;
  showStatus("Saving…");
  try {
    const { settings, updatedAt } = await postAdmin({
      action: "hub-settings-update",
      token: editor.token,
      settings: collectSettings()
    });
    render(settings, updatedAt);
    showStatus(
      `Saved ${formatDate(updatedAt)} — live on the hub within a minute.`
    );
  } catch (error) {
    handleError(error);
  } finally {
    button.disabled = false;
  }
}

function showStatus(message) {
  document.getElementById("admin-catalog-status").textContent = message;
}

function formatDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
