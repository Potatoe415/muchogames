import { translate } from "./i18n.js";
import { soloPoints } from "./points.js";

const NOTE_MS = 2000;

function gameLink() {
  const url = new URL("./", window.location.href);
  return `${url.host}${url.pathname}`;
}

function scoreText(page) {
  const state = page.state;
  const points = translate(page.lang, "endPoints", {
    n: soloPoints(state, state.elapsedMs)
  });
  return `${gameLink()} - Memory ${state.config.grid} - ${points}`;
}

function flash(page, button, key) {
  button.textContent = translate(page.lang, key);
  setTimeout(() => {
    button.textContent = translate(page.lang, "shareScore");
  }, NOTE_MS);
}

// The native sheet (WhatsApp, SMS…) on phones; elsewhere the text is copied.
export async function shareScore(page, button) {
  if (!page.state) return;
  const message = scoreText(page);
  try {
    if (navigator.share) {
      await navigator.share({ text: message });
      return;
    }
    await navigator.clipboard.writeText(message);
    flash(page, button, "scoreCopied");
  } catch (error) {
    if (error?.name !== "AbortError") flash(page, button, "errShare");
  }
}
