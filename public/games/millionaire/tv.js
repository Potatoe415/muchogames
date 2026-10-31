/* TV mode: a couch layout for a TV browser (Sony Bravia / Google TV, Android
   TV, Fire TV, Tizen, webOS...) played with the remote. Classic script loaded
   in <head> so the layout class and scale are set before the first paint.
   The page is laid out on a 1920x1080 canvas and zoomed to the real viewport,
   so a 4K TV reporting 960x540 or 1920x1080 CSS pixels looks the same.
   Remote navigation itself lives in tv-nav.js. */
(function () {
  var STORAGE_KEY = "millionaire-tv";
  var DESIGN_WIDTH = 1920;
  var DESIGN_HEIGHT = 1080;
  var TV_AGENT =
    /BRAVIA|SmartTV|SMART-TV|GoogleTV|Android ?TV|\bAFT[A-Z]|CrKey|Tizen|Web0S|webOS|NetCast|HbbTV|Viera|AQUOS|PhilipsTV|Large Screen/i;
  var LABELS = {
    fr: { on: "Mode TV : activé", off: "Mode TV : désactivé" },
    en: { on: "TV mode: On", off: "TV mode: Off" },
    es: { on: "Modo TV: activado", off: "Modo TV: desactivado" }
  };
  var PLAY_BUTTONS = "#startGameButton, #resumeGameButton, #playAgainButton";
  var root = document.documentElement;
  var musicHome = null;
  var wakeLock = null;
  var wantAwake = false;

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function store(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage unavailable: the choice only lasts for this visit.
    }
  }

  // ?tv=1 / ?tv=0 wins and is remembered, then the stored choice, then the user agent.
  function initialChoice() {
    var param = new URLSearchParams(window.location.search).get("tv");
    if (param === "1" || param === "0") store(param);
    var choice = param === "1" || param === "0" ? param : readStored();
    if (choice === "1" || choice === "0") return choice === "1";
    return TV_AGENT.test(navigator.userAgent);
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

  // The music toggle floats bottom-right on phones; on TV it joins the top bar,
  // away from the answers.
  function placeMusicButton(on) {
    var music = document.getElementById("musicToggleButton");
    var actions = document.querySelector(".topbar-actions");
    if (!music || !actions) return;
    if (!musicHome) {
      musicHome = document.createComment("music-button");
      music.before(musicHome);
    }
    if (on) actions.prepend(music);
    else musicHome.after(music);
  }

  function syncToggle() {
    var button = document.getElementById("tvModeButton");
    if (!button) return;
    var copy = LABELS[(root.lang || "fr").slice(0, 2)] || LABELS.fr;
    button.textContent = isOn() ? copy.on : copy.off;
    button.setAttribute("aria-pressed", String(isOn()));
  }

  function setMode(on) {
    root.classList.toggle("tv", on);
    placeMusicButton(on);
    syncToggle();
  }

  function isShown(el) {
    if (!el || el.disabled || el.hidden) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function focusFirst(selectors) {
    var el = selectors.map((selector) => document.querySelector(selector)).find(isShown);
    if (el) el.focus({ preventScroll: true });
  }

  function isActive(selector) {
    return Boolean(document.querySelector(selector + ".active"));
  }

  // Where the focus lands when a screen opens or nothing is focused. On a new
  // question it rests on the question itself, so a stray OK cannot lock an answer.
  function focusScreen() {
    if (!isOn()) return;
    if (isActive("#startScreen")) focusFirst(["#resumeGameButton", "#startGameButton"]);
    else if (isActive("#gameScreen")) focusFirst(["#questionCard"]);
    else if (isActive("#resultScreen")) focusFirst(["#playAgainButton"]);
  }

  function focusIsLost() {
    var current = document.activeElement;
    return !current || current === document.body || !isShown(current);
  }

  function onModalChange(backdrop) {
    if (backdrop.classList.contains("hidden")) {
      if (focusIsLost()) focusScreen();
      return;
    }
    focusFirst([".modal:not(.hidden) [data-close-modal]", "#retryLoadButton"]);
  }

  function onOptionsChange(panel) {
    if (panel.hidden) focusFirst(["#optionsShortcut"]);
    else focusFirst(["#languageSelect"]);
  }

  function watch(target, options, callback) {
    if (target) new MutationObserver(callback).observe(target, options);
  }

  function watchFocus() {
    document.querySelectorAll(".screen").forEach((screen) => {
      watch(screen, { attributes: true, attributeFilter: ["class"], attributeOldValue: true }, (records) => {
        var opened = records.some((record) => !/\bactive\b/.test(record.oldValue || ""));
        if (isOn() && opened && screen.classList.contains("active")) focusScreen();
      });
    });
    watch(document.getElementById("answersGrid"), { childList: true }, () => {
      if (isOn() && focusIsLost()) focusScreen();
    });
    var backdrop = document.getElementById("modalBackdrop");
    watch(backdrop, { attributes: true, attributeFilter: ["class"] }, () => {
      if (isOn()) onModalChange(backdrop);
    });
    var panel = document.getElementById("optionsPanel");
    watch(panel, { attributes: true, attributeFilter: ["hidden"] }, () => {
      if (isOn()) onOptionsChange(panel);
    });
    watch(root, { attributes: true, attributeFilter: ["lang"] }, syncToggle);
  }

  // A quiz leaves the remote idle for long stretches: keep the TV awake.
  function keepAwake() {
    wantAwake = true;
    if (!navigator.wakeLock || wakeLock) return;
    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        wakeLock = lock;
        lock.addEventListener("release", () => {
          wakeLock = null;
        });
      })
      .catch(() => {});
  }

  function onPlayClick(event) {
    if (!isOn() || !event.target.closest?.(PLAY_BUTTONS)) return;
    if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(() => {});
    keepAwake();
  }

  function init() {
    setMode(isOn());
    watchFocus();
    document.getElementById("tvModeButton")?.addEventListener("click", () => {
      store(isOn() ? "0" : "1");
      setMode(!isOn());
      fit();
    });
    document.addEventListener("click", onPlayClick);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && isOn() && wantAwake) keepAwake();
    });
    setTimeout(focusScreen, 0);
  }

  root.classList.toggle("tv", initialChoice());
  fit();
  window.addEventListener("resize", fit);
  document.addEventListener("DOMContentLoaded", init);
  window.MillionaireTv = { isOn: isOn, focusScreen: focusScreen };
})();
