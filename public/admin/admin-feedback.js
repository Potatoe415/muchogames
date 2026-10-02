import { postAdmin } from "./admin-auth.js";

// Must match STATUSES in api/admin/_feedback.js.
const STATUS_LABELS = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved"
};
const MOVE_LABELS = {
  new: "Back to new",
  in_progress: "Start",
  resolved: "Resolve"
};
const KIND_LABELS = { bug: "Bug", idea: "Idea" };

const inbox = {
  token: "",
  status: "new",
  titleFor: (gameId) => gameId,
  onError: () => {}
};

export function initFeedbackInbox({ titleFor, onError }) {
  inbox.titleFor = titleFor;
  inbox.onError = onError;
  document
    .getElementById("admin-feedback-status-switch")
    .addEventListener("click", (event) => {
      const option = event.target.closest("[data-status]");
      if (!option) return;
      inbox.status = option.dataset.status;
      loadFeedbackInbox(inbox.token);
    });
}

export function hideFeedbackInbox() {
  document.getElementById("admin-feedback").hidden = true;
}

export async function loadFeedbackInbox(token) {
  if (!token) return;
  inbox.token = token;

  try {
    const result = await postAdmin({
      action: "feedback-list",
      token,
      status: inbox.status
    });
    inbox.status = result.status;
    renderInbox(result);
  } catch (error) {
    inbox.onError(error);
  }
}

function renderInbox({ status, counts, items }) {
  document.getElementById("admin-feedback").hidden = false;

  document
    .querySelectorAll("#admin-feedback-status-switch [data-status]")
    .forEach((option) => {
      const isActive = option.dataset.status === status;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
      const key = option.dataset.status;
      option.textContent = `${STATUS_LABELS[key]} (${counts[key] || 0})`;
    });

  const list = document.getElementById("admin-feedback-list");
  list.innerHTML = "";
  document.getElementById("admin-feedback-empty").hidden = items.length > 0;

  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.appendChild(createItem(item)));
  list.appendChild(fragment);
}

function createItem(item) {
  const row = document.createElement("li");
  row.className = "admin-feedback-item";
  row.dataset.id = `admin-feedback-item-${item.id}`;

  const meta = document.createElement("p");
  meta.className = "admin-feedback-meta";
  const kind = document.createElement("span");
  kind.className = `admin-feedback-kind admin-feedback-kind--${item.kind}`;
  kind.textContent = KIND_LABELS[item.kind] || item.kind;
  const where = item.gameId
    ? inbox.titleFor(item.gameId)
    : pageLabel(item.page);
  meta.append(kind, ` ${where} · ${formatDate(item.createdAt)}`);

  const message = document.createElement("p");
  message.className = "admin-feedback-message";
  message.textContent = item.message;

  row.append(meta, message, createActions(item));
  return row;
}

function createActions(item) {
  const actions = document.createElement("div");
  actions.className = "admin-feedback-actions";

  Object.keys(MOVE_LABELS)
    .filter((status) => status !== item.status)
    .forEach((status) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "admin-button admin-button--ghost";
      button.dataset.id = `admin-feedback-move-${status}-${item.id}`;
      button.textContent = MOVE_LABELS[status];
      button.addEventListener("click", () => moveItem(item.id, status));
      actions.appendChild(button);
    });

  return actions;
}

async function moveItem(id, status) {
  try {
    await postAdmin({
      action: "feedback-update",
      token: inbox.token,
      id,
      status
    });
    await loadFeedbackInbox(inbox.token);
  } catch (error) {
    inbox.onError(error);
  }
}

function pageLabel(page) {
  if (page === "/" || page === "/index.html") return "Hub";
  return page || "—";
}

function formatDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
