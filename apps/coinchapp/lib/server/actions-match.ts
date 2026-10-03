"use server";

import { toCoinchappGame } from "@/lib/profileGames";
import { getServiceClient } from "@/lib/supabase/server";
import { readLinkedProfileId } from "./profileLink";

// Must match DAILY_COINS in the hub's api/profile/_coins.js.
const DAILY_COINS = 10;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAdmin(profileId: string): boolean {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .includes(profileId);
}

/** Spends one hub coin for a match that just started (root
 *  docs/PLATFORM_RULES.md): from the linked hub profile when this browser is
 *  linked, else from the hub's anonymous device counter. `started: false`
 *  only when today's coins are used up — any failure lets the match go on. */
export async function startMatchCoin(
  game: string,
  deviceId: string,
): Promise<{ started: boolean }> {
  const hubGame = toCoinchappGame(game);
  if (!hubGame) return { started: true };
  const profileId = await readLinkedProfileId();
  const device = typeof deviceId === "string" && UUID_RE.test(deviceId) ? deviceId.toLowerCase() : null;
  if (!profileId && !device) return { started: true };

  const { data, error } = await getServiceClient().rpc("start_muchogames_match", {
    p_game_id: hubGame,
    p_daily: DAILY_COINS,
    p_profile_id: profileId,
    p_device_id: profileId ? null : device,
    p_unlimited: profileId ? isAdmin(profileId) : false,
  });
  if (error) return { started: true };
  return { started: data !== null };
}
