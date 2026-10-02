/* "Report a problem" dialog shared by the hub, /profile, and every game whose
   options panel is wired through game-header.js. Plain global script
   (window.MuchogamesFeedback) so bundled and unbundled pages can both use it.
   Posts to /api/feedback; nothing identifying the player is sent. */
(function () {
  const ENDPOINT = "/api/feedback";
  const STYLESHEET_URL = "/shared/css/feedback.css";
  const LANG_STORAGE_KEY = "bergamots-lang";
  const MAX_MESSAGE_LENGTH = 2000;
  const CLOSE_AFTER_SUCCESS_MS = 1600;

  const COPY = {
    fr: {
      title: "Signaler un problème",
      bug: "Un bug",
      idea: "Une idée",
      placeholder: "Que s'est-il passé ? Sur quel écran ?",
      cancel: "Annuler",
      send: "Envoyer",
      sending: "Envoi…",
      thanks: "Merci, c'est bien reçu !",
      tooMany: "Trop d'envois d'un coup. Réessaie dans quelques minutes.",
      failed: "Envoi impossible. Réessaie plus tard."
    },
    en: {
      title: "Report a problem",
      bug: "A bug",
      idea: "An idea",
      placeholder: "What happened? On which screen?",
      cancel: "Cancel",
      send: "Send",
      sending: "Sending…",
      thanks: "Thanks, we got it!",
      tooMany: "Too many reports at once. Try again in a few minutes.",
      failed: "Could not send. Try again later."
    },
    es: {
      title: "Informar de un problema",
      bug: "Un error",
      idea: "Una idea",
      placeholder: "¿Qué ha pasado? ¿En qué pantalla?",
      cancel: "Cancelar",
      send: "Enviar",
      sending: "Enviando…",
      thanks: "¡Gracias, recibido!",
      tooMany: "Demasiados envíos seguidos. Inténtalo en unos minutos.",
      failed: "No se pudo enviar. Inténtalo más tarde."
    }
  };

  const MARKUP = `
    <div class="mg-feedback-backdrop" data-feedback-close></div>
    <form class="mg-feedback-sheet" role="dialog" aria-modal="true"
      aria-labelledby="mg-feedback-title" data-id="feedback-form" novalidate>
      <h2 class="mg-feedback-title" id="mg-feedback-title" data-id="feedback-title"></h2>
      <div class="mg-feedback-kinds" data-id="feedback-kind-group">
        <label class="mg-feedback-kind">
          <input type="radio" name="kind" value="bug" checked data-id="feedback-kind-bug" />
          <span data-copy="bug"></span>
        </label>
        <label class="mg-feedback-kind">
          <input type="radio" name="kind" value="idea" data-id="feedback-kind-idea" />
          <span data-copy="idea"></span>
        </label>
      </div>
      <textarea class="mg-feedback-message" name="message" rows="5"
        maxlength="${MAX_MESSAGE_LENGTH}" data-id="feedback-message-input"></textarea>
      <p class="mg-feedback-status" data-id="feedback-status" hidden></p>
      <div class="mg-feedback-actions">
        <button type="button" class="mg-feedback-cancel" data-feedback-close
          data-copy="cancel" data-id="feedback-cancel-button"></button>
        <button type="submit" class="mg-feedback-send" data-copy="send"
          data-id="feedback-submit-button"></button>
      </div>
    </form>`;

  let root = null;
  let context = {};

  function copy() {
    try {
      return COPY[localStorage.getItem(LANG_STORAGE_KEY)] || COPY.fr;
    } catch {
      return COPY.fr;
    }
  }

  function ensureStylesheet() {
    if (document.querySelector(`link[href="${STYLESHEET_URL}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLESHEET_URL;
    document.head.appendChild(link);
  }

  function build() {
    ensureStylesheet();
    root = document.createElement("div");
    root.className = "mg-feedback";
    root.dataset.id = "feedback-dialog";
    root.hidden = true;
    root.innerHTML = MARKUP;
    root.querySelectorAll("[data-feedback-close]").forEach((el) => {
      el.addEventListener("click", close);
    });
    root.querySelector("form").addEventListener("submit", submit);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.hidden) close();
    });
    document.body.appendChild(root);
  }

  function applyCopy(strings) {
    root.querySelector(".mg-feedback-title").textContent = strings.title;
    root.querySelectorAll("[data-copy]").forEach((el) => {
      el.textContent = strings[el.dataset.copy];
    });
    root.querySelector("textarea").placeholder = strings.placeholder;
  }

  function showStatus(message, isError) {
    const status = root.querySelector(".mg-feedback-status");
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
    status.hidden = !message;
  }

  // `/games/<id>/…` for custom games, `/wordplayer.html?game=<id>` for
  // wordpack games.
  function inferGameId() {
    const match = window.location.pathname.match(/\/games\/([^/]+)\//);
    if (match) return match[1];
    return new URLSearchParams(window.location.search).get("game") || "";
  }

  function open(options) {
    if (!root) build();
    context = options || {};
    applyCopy(copy());
    root.querySelector("form").reset();
    showStatus("");
    setSending(false);
    root.hidden = false;
    root.querySelector("textarea").focus();
  }

  function close() {
    if (root) root.hidden = true;
  }

  function setSending(isSending) {
    const button = root.querySelector(".mg-feedback-send");
    button.disabled = isSending;
    button.textContent = isSending ? copy().sending : copy().send;
  }

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = form.elements.message.value.trim();
    if (!message) {
      form.elements.message.focus();
      return;
    }

    setSending(true);
    showStatus("");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.elements.kind.value,
          message: message,
          gameId: context.gameId || inferGameId(),
          page: window.location.pathname
        })
      });
      if (!response.ok) {
        showStatus(
          response.status === 429 ? copy().tooMany : copy().failed,
          true
        );
        setSending(false);
        return;
      }
      showStatus(copy().thanks);
      setTimeout(close, CLOSE_AFTER_SUCCESS_MS);
    } catch {
      showStatus(copy().failed, true);
      setSending(false);
    }
  }

  window.MuchogamesFeedback = { open: open, close: close };
})();
