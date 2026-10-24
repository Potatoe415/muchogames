// localStorage that never throws (private mode, quota, disabled storage).
export function readStorage(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the value only lasts for this visit.
  }
}
