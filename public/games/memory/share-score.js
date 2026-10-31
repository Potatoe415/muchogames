import { translate } from "./i18n.js";
import { soloPoints } from "./points.js";
import { soloDetail } from "./screen.js";

const NOTE_MS = 2000;

function gameUrl() {
  return new URL("./", window.location.href).toString();
}

function scoreText(page) {
  const state = page.state;
  const text = (key, vars) => translate(page.lang, key, vars);
  return [
    gameUrl(),
    text("shareLevel", {
      grid: state.config.grid.replace("x", "×"),
      cards: state.cards.length,
      theme: text(`theme-${state.config.theme}`)
    }),
    `${text("endPoints", { n: soloPoints(state, state.elapsedMs) })} · ${soloDetail(page, state)}`,
    text("shareChallenge")
  ].join("\n");
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
