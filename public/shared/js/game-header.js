/* Shared behavior for the options panel opened by the header's gear button.
   Plain global script (no ES module) so both module and classic game
   scripts can call it. */
(function () {
  var FEEDBACK_SCRIPT_URL = "/shared/js/feedback.js";
  var FEEDBACK_LABELS = {
    fr: "Signaler un problème",
    en: "Report a problem",
    es: "Informar de un problema"
  };

  function readLang() {
    try {
      var lang = localStorage.getItem("bergamots-lang");
      return FEEDBACK_LABELS[lang] ? lang : "fr";
    } catch {
      return "fr";
    }
  }

  function openFeedback() {
    if (window.MuchogamesFeedback) {
      window.MuchogamesFeedback.open();
      return;
    }
    var script = document.createElement("script");
    script.src = FEEDBACK_SCRIPT_URL;
    script.onload = function () {
      window.MuchogamesFeedback.open();
    };
    document.head.appendChild(script);
  }

  // Appended to the panel's body so every game gets the entry without its own
  // markup. Panels without an .options-panel-body are left alone.
  function addFeedbackEntry(panelEl, closePanel) {
    var body = panelEl.matches(".options-panel-body")
      ? panelEl
      : panelEl.querySelector(".options-panel-body");
    if (!body) return null;

    var section = document.createElement("div");
    section.className = "options-panel-section";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "options-feedback-button";
    button.dataset.id = "options-feedback-button";
    button.addEventListener("click", function () {
      closePanel();
      openFeedback();
    });
    section.appendChild(button);
    body.appendChild(section);
    return button;
  }

  function initOptionsPanel(triggerEl, panelEl) {
    if (!triggerEl || !panelEl) return null;

    var feedbackButton = addFeedbackEntry(panelEl, close);

    function open() {
      // Games switch language without reloading, so relabel on every open.
      if (feedbackButton)
        feedbackButton.textContent = FEEDBACK_LABELS[readLang()];
      panelEl.hidden = false;
      triggerEl.setAttribute("aria-expanded", "true");
    }

    function close() {
      panelEl.hidden = true;
      triggerEl.setAttribute("aria-expanded", "false");
    }

    function toggle() {
      if (panelEl.hidden) open();
      else close();
    }

    triggerEl.addEventListener("click", toggle);
    panelEl.querySelectorAll("[data-options-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panelEl.hidden) close();
    });

    return { open: open, close: close, toggle: toggle };
  }

  window.GameHeader = { initOptionsPanel: initOptionsPanel };
})();
