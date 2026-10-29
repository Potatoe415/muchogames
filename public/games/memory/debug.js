import { buildReport, px, shownArea } from "./debug-report.js";

const KEY = "muchogames_memory_debug";
const LOG_MAX = 40;
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const debug = {
  on: false,
  page: null,
  log: [],
  root: null,
  out: null,
  marks: null,
  frame: 0,
  timer: 0,
  started: performance.now()
};

function readOn() {
  if (new URLSearchParams(location.search).get("debug") === "1") return true;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function storeOn(on) {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable.
  }
}

function report() {
  return buildReport(debug);
}

function placeMarks() {
  const area = shownArea();
  const top = document.body.getBoundingClientRect().top;
  debug.marks.top.style.top = `${area.top - top}px`;
  debug.marks.bottom.style.top = `${area.bottom - top - 2}px`;
}

function render() {
  debug.frame = 0;
  if (!debug.on || !debug.out) return;
  placeMarks();
  debug.out.textContent = report();
}

function schedule() {
  if (debug.on && !debug.frame) debug.frame = requestAnimationFrame(render);
}

function note(type) {
  const vv = window.visualViewport;
  const style = getComputedStyle(document.documentElement);
  const time = new Date().toISOString().slice(11, 23);
  const seen = vv ? `${px(vv.height)} off ${px(vv.offsetTop)}` : "-";
  const covered = style.getPropertyValue("--memory-obstructed").trim();
  debug.log.push(
    `${time} ${type} inner ${window.innerWidth}x${window.innerHeight} vv ${seen} obstructed ${covered}`
  );
  if (debug.log.length > LOG_MAX) debug.log.shift();
  schedule();
}

function flash(message) {
  const title = debug.root?.querySelector(".memory-debug-title");
  if (!title) return;
  title.textContent = message;
  setTimeout(() => (title.textContent = "debug"), 1200);
}

async function copy() {
  const text = report();
  try {
    await navigator.clipboard.writeText(text);
    flash("copied");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    flash("copied (fallback)");
  }
}

function button(label, id, onClick) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "memory-debug-button";
  node.dataset.id = id;
  node.textContent = label;
  node.addEventListener("click", onClick);
  return node;
}

function mark(className, id) {
  const node = document.createElement("div");
  node.className = `memory-debug-mark ${className}`;
  node.dataset.id = id;
  document.body.append(node);
  return node;
}

function build() {
  const root = document.createElement("section");
  root.className = "memory-debug";
  root.dataset.id = "memory-debug-panel";
  const head = document.createElement("div");
  head.className = "memory-debug-head";
  const title = document.createElement("strong");
  title.className = "memory-debug-title";
  title.textContent = "debug";
  head.append(
    title,
    button("copy", "memory-debug-copy", () => void copy()),
    button("fold", "memory-debug-fold", () =>
      root.classList.toggle("is-folded")
    ),
    button("move", "memory-debug-move", () =>
      root.classList.toggle("is-bottom")
    ),
    button("×", "memory-debug-close", () => setOn(false))
  );
  const out = document.createElement("pre");
  out.className = "memory-debug-out";
  out.dataset.id = "memory-debug-output";
  root.append(head, out);
  document.body.append(root);
  debug.root = root;
  debug.out = out;
  debug.marks = {
    top: mark("memory-debug-mark-top", "memory-debug-visible-top"),
    bottom: mark("memory-debug-mark-bottom", "memory-debug-visible-bottom")
  };
}

function teardown() {
  debug.root?.remove();
  debug.marks?.top.remove();
  debug.marks?.bottom.remove();
  debug.root = null;
  debug.out = null;
  debug.marks = null;
}

function paintToggle() {
  const toggle = $("memory-debug-toggle");
  if (!toggle) return;
  toggle.classList.toggle("is-selected", debug.on);
  toggle.setAttribute("aria-pressed", String(debug.on));
}

function setOn(on) {
  debug.on = on;
  storeOn(on);
  document.documentElement.classList.toggle("memory-debug-on", on);
  clearInterval(debug.timer);
  if (on) {
    if (!debug.root) build();
    debug.timer = setInterval(schedule, 1000);
    note("debug on");
  } else {
    teardown();
  }
  paintToggle();
}

function listen() {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", () => note("vv resize"));
  vv?.addEventListener("scroll", () => note("vv scroll"));
  window.addEventListener("resize", () => note("resize"));
  window.addEventListener("orientationchange", () => note("orientation"));
  window.addEventListener("scroll", () => note("scroll"), { passive: true });
  window.addEventListener("pageshow", () => note("pageshow"));
  document.addEventListener("visibilitychange", () => note("visibility"));
  document.addEventListener("focusin", () => note("focusin"));
  document.addEventListener("click", schedule);
}

export function mountDebug(page) {
  debug.page = page;
  $("memory-debug-toggle")?.addEventListener("click", () => setOn(!debug.on));
  listen();
  note("load");
  setOn(readOn());
}
