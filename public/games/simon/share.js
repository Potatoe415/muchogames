// End-card Share button: the native sheet (WhatsApp, SMS…) on phones;
// elsewhere the text and link are copied, with a short "Copied!" note.
const NOTE_MS = 2000;

// Native sheet on touch-first devices only: desktop Chrome / Edge also have
// navigator.share, but there copying is what the player expects.
const nativeShare = () =>
  typeof navigator.share === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

const canCopy = () => typeof navigator.clipboard?.writeText === "function";

export const canShare = () => nativeShare() || canCopy();

// The game page without its query (?tv=1 is per device, not to be shared).
function gameLink() {
  const url = new URL("./index.html", window.location.href);
  return `${url.origin}${url.pathname}`;
}

// `t` / `tn` are the page's translators; `summary` = { score, difficulty }.
export function shareMessage(t, tn, summary) {
  const { score, difficulty } = summary;
  return {
    text: tn("shareText", score, { score, level: t(difficulty) }),
    url: gameLink()
  };
}

function flash(button, label, restore) {
  clearTimeout(button.shareTimer);
  button.textContent = label;
  button.shareTimer = setTimeout(() => {
    button.textContent = restore();
  }, NOTE_MS);
}

export async function shareScore({ button, message, t }) {
  const restore = () => t("share");
  try {
    if (nativeShare()) {
      await navigator.share(message);
      return;
    }
    await navigator.clipboard.writeText(`${message.text}\n${message.url}`);
    flash(button, t("shareCopied"), restore);
  } catch (error) {
    if (error?.name !== "AbortError") flash(button, t("shareError"), restore);
  }
}
