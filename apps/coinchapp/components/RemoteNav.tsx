"use client";

import { useEffect } from "react";

/** Arrow keys / TV remote for every screen: arrows move the focus to the
 *  nearest control in that direction, OK (Enter) presses it once (held keys
 *  do not repeat), Escape or the TV Back key closes the open panel. Mounted
 *  once in the root layout. */

const FOCUSABLE =
  "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
const DIRECTIONS: Record<string, readonly [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
/** Back key of webOS (461) and Tizen (10009) TV browsers. */
const BACK_KEY_CODES = [461, 10009];
/** Fanned or overlapping cards only show a strip: centre, top-left, left edge. */
const PROBES = [[0.5, 0.5], [0.3, 0.08], [0.12, 0.5]] as const;
/** How much sideways drift costs against distance along the arrow. */
const ACROSS_WEIGHT = 2;
/** On `<html>` from the first arrow press until the next touch or click:
 *  shows the focus ring without relying on the browser's `:focus-visible`
 *  guess (`globals.css`). */
const REMOTE_ATTR = "data-remote-nav";

let lastRect: DOMRect | null = null;

function ownsArrows(el: Element | null): boolean {
  return el instanceof HTMLElement && el.matches("input, select, textarea, [contenteditable], [role='slider']");
}

/** Visible on screen and not covered (by a panel, another card...). Controls
 *  scrolled out of view count when CSS shows them. The focused card is raised
 *  over its neighbours (`globals.css`), so the hit test looks through it. */
function isReachable(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const onScreen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  if (!onScreen) return el.checkVisibility({ checkVisibilityCSS: true });
  const active = document.activeElement;
  const raised = active instanceof HTMLElement && active !== el && active.matches("[data-card]") ? active : null;
  return PROBES.some(([px, py]) => {
    const stack = document.elementsFromPoint(r.left + r.width * px, r.top + r.height * py);
    const hit = stack.find((h) => !raised?.contains(h));
    return hit !== undefined && el.contains(hit);
  });
}

/** An open full-screen panel keeps the focus inside it. */
function scopeRoot(): ParentNode {
  for (let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); el; el = el.parentElement) {
    if (getComputedStyle(el).position === "fixed") return el;
  }
  return document;
}

function center(r: DOMRect) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function nearestInDirection(from: HTMLElement, [dx, dy]: readonly [number, number], els: HTMLElement[]) {
  const o = center(from.getBoundingClientRect());
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of els) {
    const c = center(el.getBoundingClientRect());
    const along = (c.x - o.x) * dx + (c.y - o.y) * dy;
    if (el === from || along < 1) continue;
    const score = along + Math.abs((c.x - o.x) * dy + (c.y - o.y) * dx) * ACROSS_WEIGHT;
    if (score < bestScore) [best, bestScore] = [el, score];
  }
  return best;
}

function closestTo(x: number, y: number, els: HTMLElement[]) {
  const distance = (el: HTMLElement) => {
    const c = center(el.getBoundingClientRect());
    return Math.hypot(c.x - x, c.y - y);
  };
  return els.reduce<HTMLElement | null>((best, el) => (!best || distance(el) < distance(best) ? el : best), null);
}

/** With nothing focused (first press, or the focused card was just played),
 *  start from where the focus last was, else the middle of the screen. */
function moveFocus(direction: readonly [number, number]) {
  const els = [...scopeRoot().querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isReachable);
  const active = document.activeElement;
  const current = active instanceof HTMLElement && els.includes(active) ? active : null;
  const origin = lastRect ? center(lastRect) : { x: innerWidth / 2, y: innerHeight / 2 };
  const next = current ? nearestInDirection(current, direction, els) : closestTo(origin.x, origin.y, els);
  if (!next) return;
  next.focus();
  lastRect = next.getBoundingClientRect();
}

function closeTopPanel(): boolean {
  const close = [...document.querySelectorAll<HTMLElement>("[data-id$='close-button']")].filter(isReachable).at(-1);
  const backdrop = [...document.querySelectorAll<HTMLElement>("[data-id$='-overlay']")]
    .filter((el) => getComputedStyle(el).position === "fixed" && el.checkVisibility())
    .at(-1);
  const target = close ?? backdrop;
  target?.click();
  return !!target;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = DIRECTIONS[event.key];
  const active = document.activeElement;
  if (direction && !ownsArrows(active)) {
    event.preventDefault();
    document.documentElement.setAttribute(REMOTE_ATTR, "");
    moveFocus(direction);
  } else if (event.key === "Enter" && active instanceof HTMLButtonElement) {
    event.preventDefault();
    if (!event.repeat) active.click();
  } else if ((event.key === "Escape" || BACK_KEY_CODES.includes(event.keyCode)) && closeTopPanel()) {
    event.preventDefault();
  }
}

function onPointerDown() {
  document.documentElement.removeAttribute(REMOTE_ATTR);
}

export function RemoteNav() {
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);
  return null;
}
