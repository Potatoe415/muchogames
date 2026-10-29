const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const ELEMENTS = [
  ["html", "html"],
  ["body", "body"],
  ["nav", ".game-nav"],
  ["app", ".memory-app"],
  ["setup", ".memory-setup"],
  ["setup panel", ".memory-setup-panel"],
  ["theme list", ".memory-theme-list"],
  ["start button", "[data-id='memory-start-button']"],
  ["wait", ".memory-wait"],
  ["play", ".memory-play"],
  ["bar top (p2)", ".memory-bar-top"],
  ["pill p2", ".memory-bar-top .memory-who"],
  ["stage", ".memory-stage"],
  ["board", ".memory-board"],
  ["bar bottom (p1)", ".memory-bar-bottom"],
  ["pill p1", ".memory-bar-bottom .memory-who"],
  ["mute button", "[data-id='memory-mute-button']"],
  ["end overlay", ".memory-end"],
  ["options sheet", ".options-panel-sheet"]
];

const UNITS = [
  "100vh",
  "100svh",
  "100lvh",
  "100dvh",
  "env(safe-area-inset-top, 0px)",
  "env(safe-area-inset-right, 0px)",
  "env(safe-area-inset-bottom, 0px)",
  "env(safe-area-inset-left, 0px)"
];

const MEDIA = [
  "(pointer: coarse)",
  "(pointer: fine)",
  "(any-pointer: coarse)",
  "(hover: hover)",
  "(orientation: landscape)",
  "(display-mode: standalone)",
  "(display-mode: browser)",
  "(prefers-reduced-motion: reduce)",
  "(max-height: 640px)",
  "(orientation: landscape) and (min-width: 640px)"
];

const VARS = [
  "--memory-nav-height",
  "--memory-obstructed",
  "--memory-obstructed-top"
];

export const px = (value) => `${Math.round(value * 10) / 10}`;

export function shownArea() {
  const vv = window.visualViewport;
  const top = vv ? vv.offsetTop : 0;
  const height = vv ? vv.height : window.innerHeight;
  return { top, bottom: top + height };
}

function probe(length) {
  const node = document.createElement("div");
  node.style.cssText = `position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:${length}`;
  document.body.append(node);
  const height = node.getBoundingClientRect().height;
  node.remove();
  return height;
}

function isRendered(node) {
  return node.getClientRects().length > 0;
}

function cuts(box, area) {
  const flags = [];
  if (box.bottom > area.bottom + 0.5)
    flags.push(`CUT ${px(box.bottom - area.bottom)} below`);
  if (box.top < area.top - 0.5)
    flags.push(`CUT ${px(area.top - box.top)} above`);
  if (box.right > window.innerWidth + 0.5)
    flags.push(`CUT ${px(box.right - window.innerWidth)} right`);
  return flags.length ? `  !! ${flags.join(", ")}` : "";
}

function sectionElements() {
  const area = shownArea();
  const lines = ["== elements (top→bottom h, left→right; vs visible area)"];
  ELEMENTS.forEach(([label, selector]) => {
    const node = document.querySelector(selector);
    if (!node) return lines.push(`${label}: missing`);
    if (!isRendered(node)) return lines.push(`${label}: hidden`);
    const box = node.getBoundingClientRect();
    lines.push(
      `${label}: ${px(box.top)}→${px(box.bottom)} h${px(box.height)}, ${px(box.left)}→${px(box.right)}${cuts(box, area)}`
    );
  });
  return lines;
}

function sectionViewport() {
  const vv = window.visualViewport;
  const doc = document.documentElement;
  const area = shownArea();
  const angle = screen.orientation?.angle ?? window.orientation ?? "";
  return [
    "== viewport",
    `inner ${window.innerWidth}x${window.innerHeight}  outer ${window.outerWidth}x${window.outerHeight}`,
    `docEl client ${doc.clientWidth}x${doc.clientHeight}  scrollH ${doc.scrollHeight}`,
    vv
      ? `visualViewport ${px(vv.width)}x${px(vv.height)} offset ${px(vv.offsetLeft)},${px(vv.offsetTop)} page ${px(vv.pageLeft)},${px(vv.pageTop)} scale ${vv.scale}`
      : "visualViewport: unsupported",
    `visible area y ${px(area.top)}→${px(area.bottom)}`,
    `innerHeight - vv.height = ${vv ? px(window.innerHeight - vv.height) : "n/a"}`,
    `docEl.clientHeight - vv.height = ${vv ? px(doc.clientHeight - vv.height) : "n/a"}`,
    `body bottom - visible bottom = ${px(document.body.getBoundingClientRect().bottom - area.bottom)}`,
    `scroll window ${px(window.scrollX)},${px(window.scrollY)}  docEl ${doc.scrollTop}  body ${document.body.scrollTop}`,
    `screen ${screen.width}x${screen.height} avail ${screen.availWidth}x${screen.availHeight} dpr ${window.devicePixelRatio}`,
    `orientation ${screen.orientation?.type ?? "n/a"} ${angle}`
  ];
}

function sectionUnits() {
  const lines = ["== css units (px)"];
  UNITS.forEach((unit) => {
    const ok = CSS.supports("height", unit);
    lines.push(`${unit} = ${ok ? px(probe(unit)) : "unsupported"}`);
  });
  const style = getComputedStyle(document.documentElement);
  VARS.forEach((name) => {
    lines.push(`${name} = ${style.getPropertyValue(name).trim() || "(unset)"}`);
  });
  return lines;
}

function sectionStyles() {
  const lines = ["== computed"];
  const pick = (label, selector, props) => {
    const node = document.querySelector(selector);
    if (!node) return;
    const style = getComputedStyle(node);
    lines.push(`${label}: ${props.map((p) => `${p} ${style[p]}`).join("; ")}`);
  };
  pick("body", "body", ["position", "height", "paddingTop", "overflow"]);
  pick("nav", ".game-nav", ["height", "paddingTop", "position"]);
  pick("app", ".memory-app", ["paddingTop", "paddingBottom", "overflow"]);
  pick("setup panel", ".memory-setup-panel", ["flexDirection", "padding"]);
  const panel = document.querySelector(".memory-setup-panel");
  if (panel && isRendered(panel))
    lines.push(
      `setup panel scroll: top ${panel.scrollTop} / ${panel.scrollHeight - panel.clientHeight} overflow`
    );
  const board = $("memory-board");
  if (board && isRendered(board)) {
    const style = getComputedStyle(board);
    const cell = board.firstElementChild?.getBoundingClientRect().height;
    lines.push(
      `board: rows ${style.getPropertyValue("--rows")} cols ${style.getPropertyValue("--cols")} cell ${cell ? px(cell) : "-"}`
    );
  }
  const meta = document.querySelector("meta[name='viewport']");
  lines.push(`viewport meta: ${meta?.content ?? "missing"}`);
  return lines;
}

function sectionMedia() {
  return [
    "== media",
    ...MEDIA.map(
      (query) => `${matchMedia(query).matches ? "yes" : "no "} ${query}`
    )
  ];
}

function sectionGame(page) {
  const view = ["setup", "wait", "play"].find((name) => {
    const node = $(`memory-${name}`);
    return node && !node.hidden;
  });
  const state = page?.state;
  const online = page?.online ?? {};
  return [
    "== game",
    `view ${view ?? "?"}  lang ${page?.lang}  muted ${page?.muted}`,
    `setup ${JSON.stringify(page?.setup ?? {})}`,
    state
      ? `match mode ${state.config.mode} grid ${state.config.grid} phase ${state.phase} active ${state.active} scores ${JSON.stringify(state.scores)}`
      : "match none",
    `online ${JSON.stringify({ code: online.code, seat: page?.seat, error: online.error })}`,
    `match in progress (platform) ${window.MuchogamesMatch?.isInProgress?.() ?? "n/a"}`
  ];
}

function sectionDevice(started) {
  const nav = navigator;
  const data = nav.userAgentData;
  return [
    "== device",
    `ua ${nav.userAgent}`,
    `uaData ${data ? `${data.platform} mobile ${data.mobile}` : "n/a"}`,
    `platform ${nav.platform}  touchPoints ${nav.maxTouchPoints}  standalone ${nav.standalone ?? "n/a"}`,
    `lang ${nav.language}  online ${nav.onLine}  visibility ${document.visibilityState}`,
    `url ${location.href}`,
    `time ${new Date().toISOString()}  up ${Math.round((performance.now() - started) / 1000)}s`
  ];
}

export function buildReport({ page, log, started }) {
  return [
    ...sectionElements(),
    ...sectionViewport(),
    ...sectionUnits(),
    ...sectionStyles(),
    ...sectionMedia(),
    ...sectionGame(page),
    ...sectionDevice(started),
    "== events (newest first)",
    ...log.slice().reverse()
  ].join("\n");
}
