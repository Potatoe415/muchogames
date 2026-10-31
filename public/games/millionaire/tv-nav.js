/* Remote control for the TV mode (tv.js): the arrows move the focus to the
   nearest control on screen, OK (Enter) clicks it natively, Back closes the
   open dialog or leaves the current screen. Active only under html.tv. */
(function () {
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
  var FOCUSABLE = "button, select, summary, input, a[href], [tabindex]:not([tabindex='-1'])";
  var TYPING = "textarea, input[type='text'], input:not([type])";
  // Open overlays, topmost first, with the control Back presses.
  var OVERLAYS = [
    { open: ".mg-match-dialog:not([hidden])", cancel: ".mg-match-dialog__cancel:not([hidden]), .mg-match-dialog__confirm" },
    { open: ".mg-feedback:not([hidden])", cancel: "[data-feedback-close]" },
    { open: ".options-panel:not([hidden])", cancel: ".options-panel-close" },
    { open: ".overlay-backdrop:not(.hidden)", cancel: ".modal:not(.hidden) [data-close-modal]" }
  ];
  var SCREEN_BACK = [
    ["#gameScreen", "#restartShortcut"],
    ["#resultScreen", "#backHomeButton"],
    ["#startScreen", "#homeShortcut"]
  ];

  function isTv() {
    return document.documentElement.classList.contains("tv");
  }

  function isShown(el) {
    if (el.disabled || el.closest("[hidden]")) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function openOverlay() {
    for (var i = 0; i < OVERLAYS.length; i += 1) {
      var el = document.querySelector(OVERLAYS[i].open);
      if (el) return { el: el, cancel: el.querySelector(OVERLAYS[i].cancel) };
    }
    return null;
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
      { up: from.top - to.bottom, down: to.top - from.bottom, left: from.left - to.right, right: to.left - from.right }[dir]
    );
    var cross = vertical ? gap(from.left, from.right, to.left, to.right) : gap(from.top, from.bottom, to.top, to.bottom);
    return { main: main, score: main + cross * 3 + Math.abs(vertical ? dx : dy) * 0.1 };
  }

  function nearest(origin, scope, dir) {
    var from = origin.getBoundingClientRect();
    var best = null;
    scope.querySelectorAll(FOCUSABLE).forEach((el) => {
      if (el === origin || !isShown(el)) return;
      var result = measure(from, el.getBoundingClientRect(), dir);
      if (!best || result.score < best.score) best = { el: el, main: result.main, score: result.score };
    });
    return best && best.score < Infinity ? best : null;
  }

  function scrollParent(el, scope) {
    for (var node = el.parentElement; node && scope.contains(node); node = node.parentElement) {
      var overflow = getComputedStyle(node).overflowY;
      if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 1) return node;
    }
    return null;
  }

  // Long text with no control inside (the rules) scrolls instead of being jumped over.
  function scrollInstead(origin, scope, dir, best) {
    if (dir !== "up" && dir !== "down") return false;
    var scroller = scrollParent(origin, scope);
    if (!scroller) return false;
    var step = scroller.clientHeight * 0.6;
    var room = dir === "down" ? scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop : scroller.scrollTop;
    if (room <= 1 || (best && best.main <= step)) return false;
    scroller.scrollBy({ top: dir === "down" ? step : -step, behavior: "smooth" });
    return true;
  }

  function move(dir) {
    var overlay = openOverlay();
    var scope = overlay ? overlay.el : document.body;
    var origin = document.activeElement;
    if (!origin || origin === document.body || !scope.contains(origin) || !isShown(origin)) {
      if (!overlay) return window.MillionaireTv?.focusScreen();
      var first = [...scope.querySelectorAll(FOCUSABLE)].find(isShown);
      return first?.focus();
    }
    var best = nearest(origin, scope, dir);
    if (scrollInstead(origin, scope, dir, best) || !best) return;
    best.el.focus({ preventScroll: true });
    best.el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function back() {
    var overlay = openOverlay();
    if (overlay) {
      overlay.cancel?.click();
      return;
    }
    var entry = SCREEN_BACK.find(([screen]) => document.querySelector(screen + ".active"));
    if (entry) document.querySelector(entry[1])?.click();
  }

  function directionOf(event) {
    if (DIRECTIONS[event.key]) return DIRECTIONS[event.key];
    return !event.key || event.key === "Unidentified" ? DIRECTION_CODES[event.keyCode] : null;
  }

  function isBack(event) {
    return BACK_KEYS.includes(event.key) || BACK_CODES.includes(event.keyCode);
  }

  // Capture phase on window: runs before the shared panels' own Escape handlers,
  // which then find their panel already closed.
  function onKeyDown(event) {
    if (!isTv() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    var typing = event.target.matches?.(TYPING);
    var dir = directionOf(event);
    if (dir) {
      if (typing) return;
      event.preventDefault();
      move(dir);
    } else if (isBack(event)) {
      event.preventDefault();
      back();
    }
  }

  window.addEventListener("keydown", onKeyDown, true);
})();
