/* Remote control for TV browsers (docs/PLATFORM_RULES.md section 6 "TV").
   Classic script -> window.MuchogamesTv. Adapted from Millionaire's
   tv-nav.js / tv.js, without its zoomed layout.
   On from ?tv=1 (remembered per game, ?tv=0 turns it off) or a TV user
   agent; sets html.tv. While on: the arrows move the focus to the nearest
   shown control, OK is the native Enter click, Back closes the topmost
   dialog or presses the screen's [data-tv-back].
   Page markup:
   - [data-tv-overlay]  a game dialog: while shown, the focus stays inside.
   - [data-tv-screen]   a screen: when it appears, the focus moves into it.
   - [data-tv-back]     what Back presses (the last shown one wins).
   - [data-tv-focus]    where the focus lands when a screen/dialog opens.
   - [data-tv-keys="left right down"]  directions the focused element
     handles itself (a board moving its own cursor). */
(function () {
  var TV_AGENT =
    /BRAVIA|SmartTV|SMART-TV|GoogleTV|Android ?TV|\bAFT[A-Z]|CrKey|Tizen|Web0S|webOS|NetCast|HbbTV|Viera|AQUOS|PhilipsTV|Large Screen/i;
  var DIRECTIONS = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Up: "up",
    Down: "down",
    Left: "left",
    Right: "right"
  };
  // Older TV browsers only fill keyCode.
  var DIRECTION_CODES = { 37: "left", 38: "up", 39: "right", 40: "down" };
  var BACK_KEYS = ["Escape", "Esc", "GoBack", "BrowserBack", "Back"];
  // 461: webOS Back, 10009: Tizen Return.
  var BACK_CODES = [27, 461, 10009];
  var FOCUSABLE =
    "button, select, summary, input, a[href], [tabindex]:not([tabindex='-1'])";
  var TYPING = "textarea, input[type='text'], input:not([type])";
  // Shared dialogs, topmost first, with the control Back presses.
  var SHARED_OVERLAYS = [
    {
      open: ".mg-match-dialog:not([hidden])",
      cancel:
        ".mg-match-dialog__cancel:not([hidden]), .mg-match-dialog__confirm"
    },
    { open: ".mg-feedback:not([hidden])", cancel: "[data-feedback-close]" },
    { open: ".options-panel:not([hidden])", cancel: ".options-panel-close" }
  ];
  var WATCHED = "[data-tv-overlay], [data-tv-screen], .options-panel";
  var root = document.documentElement;
  var wakeLock = null;
  var wantAwake = false;

  function storageKey() {
    var match = window.location.pathname.match(/\/games\/([^/]+)\//);
    return (match ? match[1] : "muchogames") + "-tv";
  }

  function store(value) {
    try {
      localStorage.setItem(storageKey(), value);
    } catch {
      // Storage unavailable: the choice only lasts for this visit.
    }
  }

  function readStored() {
    try {
      return localStorage.getItem(storageKey());
    } catch {
      return null;
    }
  }

  // ?tv=1 / ?tv=0 wins and is remembered, then the stored choice, then the
  // user agent.
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

  function isShown(el) {
    if (!el || el.disabled || el.closest("[hidden]")) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function lastShown(scope, selector) {
    var list = [...scope.querySelectorAll(selector)].filter(isShown);
    return list[list.length - 1] || null;
  }

  function openOverlay() {
    for (var i = 0; i < SHARED_OVERLAYS.length; i += 1) {
      var el = document.querySelector(SHARED_OVERLAYS[i].open);
      if (el)
        return { el: el, cancel: el.querySelector(SHARED_OVERLAYS[i].cancel) };
    }
    var own = [...document.querySelectorAll("[data-tv-overlay]")].filter(
      (node) => !node.hidden && !node.closest("[hidden]")
    );
    var top = own[own.length - 1];
    return top ? { el: top, cancel: lastShown(top, "[data-tv-back]") } : null;
  }

  function focusIn(scope) {
    var target =
      [...scope.querySelectorAll("[data-tv-focus]")].find(isShown) ||
      [...scope.querySelectorAll(FOCUSABLE)].find(isShown);
    target?.focus({ preventScroll: true });
  }

  function focusScreen() {
    if (!isOn()) return;
    var overlay = openOverlay();
    focusIn(overlay ? overlay.el : document.body);
  }

  function focusIsLost() {
    var current = document.activeElement;
    return !current || current === document.body || !isShown(current);
  }

  function gap(start1, end1, start2, end2) {
    return Math.max(0, start2 - end1, start1 - end2);
  }

  // Distance along the direction, plus a heavy penalty for sideways offset.
  // Infinity when the candidate is not on that side.
  function measure(from, to, dir) {
    var dx = (to.left + to.right - from.left - from.right) / 2;
    var dy = (to.top + to.bottom - from.top - from.bottom) / 2;
    var vertical = dir === "up" || dir === "down";
    var forward = { up: -dy, down: dy, left: -dx, right: dx }[dir];
    if (forward <= 1) return { main: Infinity, score: Infinity };
    var main = Math.max(
      0,
      {
        up: from.top - to.bottom,
        down: to.top - from.bottom,
        left: from.left - to.right,
        right: to.left - from.right
      }[dir]
    );
    var cross = vertical
      ? gap(from.left, from.right, to.left, to.right)
      : gap(from.top, from.bottom, to.top, to.bottom);
    return {
      main: main,
      score: main + cross * 3 + Math.abs(vertical ? dx : dy) * 0.1
    };
  }

  function nearest(origin, scope, dir) {
    var from = origin.getBoundingClientRect();
    var best = null;
    scope.querySelectorAll(FOCUSABLE).forEach((el) => {
      if (el === origin || !isShown(el)) return;
      var result = measure(from, el.getBoundingClientRect(), dir);
      if (!best || result.score < best.score - 0.5) {
        best = { el: el, main: result.main, score: result.score };
      }
    });
    return best && best.score < Infinity ? best : null;
  }

  function scrollParent(el, scope) {
    for (
      var node = el.parentElement;
      node && scope.contains(node);
      node = node.parentElement
    ) {
      var overflow = getComputedStyle(node).overflowY;
      var scrolls = overflow === "auto" || overflow === "scroll";
      if (scrolls && node.scrollHeight > node.clientHeight + 1) return node;
    }
    return null;
  }

  // Long text with no control inside (the rules) scrolls instead of being
  // jumped over.
  function scrollInstead(origin, scope, dir, best) {
    if (dir !== "up" && dir !== "down") return false;
    var scroller = scrollParent(origin, scope);
    if (!scroller) return false;
    var step = scroller.clientHeight * 0.6;
    var room =
      dir === "down"
        ? scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
        : scroller.scrollTop;
    if (room <= 1 || (best && best.main <= step)) return false;
    scroller.scrollBy({
      top: dir === "down" ? step : -step,
      behavior: "smooth"
    });
    return true;
  }

  function move(dir) {
    var overlay = openOverlay();
    var scope = overlay ? overlay.el : document.body;
    var origin = document.activeElement;
    if (focusIsLost() || !scope.contains(origin)) return focusIn(scope);
    var best = nearest(origin, scope, dir);
    if (scrollInstead(origin, scope, dir, best) || !best) return;
    best.el.focus({ preventScroll: true });
    best.el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function back() {
    var overlay = openOverlay();
    if (overlay) return overlay.cancel?.click();
    lastShown(document.body, "[data-tv-back]")?.click();
  }

  function directionOf(event) {
    if (DIRECTIONS[event.key]) return DIRECTIONS[event.key];
    var unnamed = !event.key || event.key === "Unidentified";
    return unnamed ? DIRECTION_CODES[event.keyCode] : null;
  }

  function isBack(event) {
    return BACK_KEYS.includes(event.key) || BACK_CODES.includes(event.keyCode);
  }

  function handledByTarget(event, dir) {
    var keys = event.target?.dataset?.tvKeys;
    return Boolean(keys && keys.split(/\s+/).includes(dir));
  }

  // Capture phase on window: runs before the shared panels' own Escape
  // handlers, which then find their panel already closed.
  function onKeyDown(event) {
    if (!isOn() || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    var dir = directionOf(event);
    if (dir) {
      if (event.target.matches?.(TYPING) || handledByTarget(event, dir)) return;
      event.preventDefault();
      move(dir);
    } else if (isBack(event)) {
      event.preventDefault();
      back();
    }
  }

  function onShownChange(el) {
    if (!isOn()) return;
    var shown = !el.hidden && !el.closest("[hidden]");
    if (shown && el.matches(".options-panel")) return focusIn(el);
    if (shown) return focusScreen();
    if (!focusIsLost()) return;
    if (el.matches(".options-panel")) {
      var gear = document.querySelector('[data-id="game-options-button"]');
      if (isShown(gear)) return gear.focus({ preventScroll: true });
    }
    focusScreen();
  }

  function watchScreens() {
    new MutationObserver((records) => {
      var changed = records
        .map((record) => record.target)
        .filter((el) => el.matches?.(WATCHED));
      if (changed.length) setTimeout(() => changed.forEach(onShownChange), 0);
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"]
    });
  }

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

  // Call from the click that starts or resumes a match (a user gesture).
  function play() {
    if (!isOn()) return;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    }
    keepAwake();
  }

  function init() {
    watchScreens();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && isOn() && wantAwake) keepAwake();
    });
    setTimeout(focusScreen, 0);
  }

  root.classList.toggle("tv", initialChoice());
  window.addEventListener("keydown", onKeyDown, true);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.MuchogamesTv = { isOn: isOn, focusScreen: focusScreen, play: play };
})();
