"use client";

import { useEffect, useState } from "react";
import { isMascotId, randomMascot, type MascotId } from "@/lib/mascots";

const STORAGE_KEY = "coinchapp-hub-name";
/** localStorage (not session): the mascot is the player's lasting avatar. */
const MASCOT_STORAGE_KEY = "coinchapp-mascot";

/** Remember `?name=` / `?mascot=` from the Muchogames hub so later in-app
 *  routes can pre-fill identity after Play Online drops the original query. */
export function captureHubName() {
  if (typeof window === "undefined") return;
  captureParam("name", STORAGE_KEY, Boolean);
  readMyMascot();
}

export function readHubPrefillName() {
  return readParam("name", STORAGE_KEY, Boolean);
}

/**
 * The player's mascot: the hub's `?mascot=` (remembered), else the one this
 * browser already has, else a random one kept from now on.
 */
export function readMyMascot(): MascotId {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("mascot");
    if (isMascotId(fromUrl)) {
      localStorage.setItem(MASCOT_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const stored = localStorage.getItem(MASCOT_STORAGE_KEY);
    if (isMascotId(stored)) return stored;
    const picked = randomMascot();
    localStorage.setItem(MASCOT_STORAGE_KEY, picked);
    return picked;
  } catch {
    return randomMascot();
  }
}

export function withHubName(href: string) {
  const name = readHubPrefillName();
  if (!name) return href;
  const url = new URL(href, "http://local.invalid");
  if (!url.searchParams.has("name")) url.searchParams.set("name", name);
  return `${url.pathname}${url.search}`;
}

export function useHubPrefillName() {
  const [name, setName] = useState("");
  useEffect(() => {
    const prefill = readHubPrefillName();
    if (!prefill) return;
    // Post-hydration browser read: deferred to after mount to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName((current) => current || prefill);
  }, []);
  return [name, setName] as const;
}

function captureParam(
  queryKey: string,
  storageKey: string,
  accept: (value: string) => boolean,
) {
  const fromUrl = new URLSearchParams(window.location.search).get(queryKey)?.trim();
  if (!fromUrl || !accept(fromUrl)) return;
  try {
    sessionStorage.setItem(storageKey, fromUrl);
  } catch {
    // Storage unavailable — the URL param is still used when present.
  }
}

function readParam(
  queryKey: string,
  storageKey: string,
  accept: (value: string) => boolean,
) {
  if (typeof window === "undefined") return "";
  try {
    const fromUrl = new URLSearchParams(window.location.search)
      .get(queryKey)
      ?.trim();
    if (fromUrl && accept(fromUrl)) {
      sessionStorage.setItem(storageKey, fromUrl);
      return fromUrl;
    }
    const stored = sessionStorage.getItem(storageKey) || "";
    return accept(stored) ? stored : "";
  } catch {
    return "";
  }
}

/** `readMyMascot` after mount (null during SSR / first render). */
export function useMyMascot(): MascotId | null {
  const [mascot, setMascot] = useState<MascotId | null>(null);
  useEffect(() => {
    // Post-hydration browser read: deferred to after mount to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMascot(readMyMascot());
  }, []);
  return mascot;
}
