// Display-only hint so the hub can show an "Admin" link in the account
// popover. /api/admin re-checks the allowlist on every request, so a forged
// flag only reveals a link to a page that will refuse the visitor.
const ADMIN_FLAG_STORAGE_KEY = "muchogames-is-admin";
const ADMIN_URL = "/admin";

/** "1", "0", or null when no profile response has been seen yet. */
export function readAdminFlag() {
  try {
    return localStorage.getItem(ADMIN_FLAG_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistAdminFlag(isAdmin) {
  try {
    localStorage.setItem(ADMIN_FLAG_STORAGE_KEY, isAdmin ? "1" : "0");
  } catch {
    // Storage unavailable — the link just won't show.
  }
}

export function clearAdminFlag() {
  try {
    localStorage.removeItem(ADMIN_FLAG_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

export function createAdminLink(label) {
  const link = document.createElement("a");
  link.className = "auth-profile-link";
  link.href = ADMIN_URL;
  link.dataset.id = "auth-admin-link";
  link.textContent = label;
  return link;
}
