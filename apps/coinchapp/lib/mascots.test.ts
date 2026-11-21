import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isMascotId, MASCOT_IDS, mascotSrc } from "./mascots";

const APP_ROOT = resolve(__dirname, "..");
const HUB_PROFILE_JS = resolve(APP_ROOT, "../../public/shared/js/player-profile.js");

describe("mascots", () => {
  it("has an image for every id", () => {
    for (const id of MASCOT_IDS) {
      expect(existsSync(resolve(APP_ROOT, "public", mascotSrc(id).slice(1))), id).toBe(true);
    }
  });

  it("matches the hub's list, which sends the pick as ?mascot=", () => {
    const source = readFileSync(HUB_PROFILE_JS, "utf8");
    const block = /const MASCOTS = \[([\s\S]*?)\];/.exec(source)?.[1] ?? "";
    const hubIds = [...block.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
    expect(hubIds).toEqual([...MASCOT_IDS]);
  });

  it("rejects anything outside the list", () => {
    expect(isMascotId("fox")).toBe(true);
    expect(isMascotId("../secret")).toBe(false);
    expect(isMascotId(null)).toBe(false);
  });
});
