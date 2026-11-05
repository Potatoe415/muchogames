/* TV mode layout: a couch layout for a TV browser (Sony Bravia / Google TV,
   Android TV, Fire TV, Tizen, webOS...) played with the remote. Classic
   script loaded in <head> right after /shared/js/tv-remote.js, which turns
   html.tv on (?tv=1 / ?tv=0, remembered as "millionaire-tv", or a TV user
   agent), moves the focus with the arrows, presses Back and asks for
   fullscreen + wake lock (MuchogamesTv.play() in app.js).
   This file only lays the page on a 1920x1080 canvas zoomed to the real
   viewport, so a 4K TV reporting 960x540 or 1920x1080 CSS pixels looks the
   same, and wires the options panel's TV mode toggle. */
(function () {
  var STORAGE_KEY = "millionaire-tv";
  var DESIGN_WIDTH = 1920;
  var DESIGN_HEIGHT = 1080;
  var LABELS = {
    fr: { on: "Mode TV : activé", off: "Mode TV : désactivé" },
    en: { on: "TV mode: On", off: "TV mode: Off" },
    es: { on: "Modo TV: activado", off: "Modo TV: desactivado" }
  };
  var root = document.documentElement;

  function store(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage unavailable: the choice only lasts for this visit.
    }
  }

  function isOn() {
    return root.classList.contains("tv");
  }

  function fit() {
    var scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    root.style.setProperty("--tv-zoom", String(scale));
    root.style.setProperty("--tv-w", window.innerWidth / scale + "px");
    root.style.setProperty("--tv-h", window.innerHeight / scale + "px");
  }

  function syncToggle() {
    var button = document.getElementById("tvModeButton");
    if (!button) return;
    var copy = LABELS[(root.lang || "fr").slice(0, 2)] || LABELS.fr;
    button.textContent = isOn() ? copy.on : copy.off;
    button.setAttribute("aria-pressed", String(isOn()));
  }

  function focusScreen() {
    window.MuchogamesTv?.focusScreen();
  }

  // A new question replaces the answer buttons: the focus goes back to the
  // question card (data-tv-focus), so a stray OK cannot lock an answer.
  function watchAnswers() {
    var grid = document.getElementById("answersGrid");
    if (!grid) return;
    new MutationObserver(() => {
      var current = document.activeElement;
      if (isOn() && (!current || current === document.body || !current.isConnected)) focusScreen();
    }).observe(grid, { childList: true });
  }

  function init() {
    syncToggle();
    watchAnswers();
    new MutationObserver(syncToggle).observe(root, { attributes: true, attributeFilter: ["lang"] });
    document.getElementById("tvModeButton")?.addEventListener("click", () => {
      store(isOn() ? "0" : "1");
      root.classList.toggle("tv", !isOn());
      syncToggle();
      fit();
    });
  }

  fit();
  window.addEventListener("resize", fit);
  document.addEventListener("DOMContentLoaded", init);
})();
