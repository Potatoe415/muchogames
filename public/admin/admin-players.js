import { postAdmin } from "./admin-auth.js";

const PAGE_STEP = 30; // Must match PAGE_SIZE in api/admin/_players.js.

const players = { token: "", offset: 0, total: 0, onError: () => {} };

export function initPlayersPanel({ onError }) {
  players.onError = onError;
  document
    .getElementById("admin-players-more")
    .addEventListener("click", () =>
      loadPage(players.offset + PAGE_STEP, true)
    );
}

export function hidePlayersPanel() {
  document.getElementById("admin-players").hidden = true;
}

export async function loadPlayersPanel(token) {
  if (!token) return;
  players.token = token;
  await loadPage(0, false);
}

async function loadPage(offset, append) {
  try {
    const result = await postAdmin({
      action: "players-list",
      token: players.token,
      offset
    });
    players.offset = result.offset;
    players.total = result.total;
    render(result.players, append);
  } catch (error) {
    players.onError(error);
  }
}

function render(rows, append) {
  document.getElementById("admin-players").hidden = false;
  const list = document.getElementById("admin-players-list");
  if (!append) list.replaceChildren();
  rows.forEach((player) => list.appendChild(createRow(player)));

  document.getElementById("admin-players-count").textContent =
    `${players.total} signed-in player${players.total === 1 ? "" : "s"}`;
  document.getElementById("admin-players-more").hidden =
    list.children.length >= players.total;
}

function createRow(player) {
  const row = document.createElement("li");
  row.className = "admin-player";
  row.dataset.id = `admin-player-${player.id}`;

  const avatar = document.createElement("img");
  avatar.className = "admin-player-avatar";
  avatar.alt = "";
  if (player.avatarUrl.startsWith("data:image/")) avatar.src = player.avatarUrl;

  const details = document.createElement("div");
  details.className = "admin-player-details";
  const name = document.createElement("p");
  name.className = "admin-player-name";
  name.textContent = `${player.name || "(no name)"}${player.isAdmin ? " · admin" : ""}`;
  const meta = document.createElement("p");
  meta.className = "admin-player-meta";
  meta.textContent = `W ${player.wins} · L ${player.losses} · joined ${formatDate(player.createdAt)}`;
  details.append(name, meta);

  row.append(avatar, details, createActions(player, row));
  return row;
}

function createActions(player, row) {
  const actions = document.createElement("div");
  actions.className = "admin-player-actions";
  actions.append(
    actionButton(player, "reset-name", "Reset name", () =>
      resetField(player, "name", row)
    ),
    actionButton(player, "reset-avatar", "Reset avatar", () =>
      resetField(player, "avatar", row)
    )
  );
  if (!player.isAdmin) {
    actions.append(
      actionButton(player, "delete", "Delete", () => deletePlayer(player, row))
    );
  }
  return actions;
}

function actionButton(player, action, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "admin-button admin-button--ghost";
  button.dataset.id = `admin-player-${action}-${player.id}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

async function resetField(player, field, row) {
  try {
    await postAdmin({
      action: "player-reset",
      token: players.token,
      userId: player.id,
      field
    });
    if (field === "name") {
      row.querySelector(".admin-player-name").textContent = "(no name)";
    } else {
      row.querySelector(".admin-player-avatar").removeAttribute("src");
    }
  } catch (error) {
    players.onError(error);
  }
}

async function deletePlayer(player, row) {
  const label = player.name || player.id;
  if (
    !window.confirm(
      `Delete ${label}'s account and all their hub data? This cannot be undone.`
    )
  ) {
    return;
  }
  try {
    await postAdmin({
      action: "player-delete",
      token: players.token,
      userId: player.id,
      confirm: true
    });
    row.remove();
    players.total -= 1;
    document.getElementById("admin-players-count").textContent =
      `${players.total} signed-in player${players.total === 1 ? "" : "s"}`;
  } catch (error) {
    players.onError(error);
  }
}

function formatDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR", { dateStyle: "short" });
}
