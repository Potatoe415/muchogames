"use server";

import { toCoinchappGame } from "@/lib/profileGames";
import { linkAndAddStats } from "./profileLink";

/** Links this browser to the hub profile (via a one-time launch code) and
 *  adds a win/loss delta, attributed to `game` when given. Anonymous
 *  sessions with no code stay unlinked. */
export async function syncSharedMatchResults(
  code: string | null,
  wins: number,
  losses: number,
  game: string | null = null,
): Promise<{ linked: boolean }> {
  const safeCode = typeof code === "string" && code.length > 0 ? code : null;
  const linked = await linkAndAddStats(
    safeCode,
    Number(wins),
    Number(losses),
    toCoinchappGame(game),
  );
  return { linked };
}
