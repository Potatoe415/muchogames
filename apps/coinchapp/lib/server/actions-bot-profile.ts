"use server";

import { isBotProfile, sanitizeBotProfiles, type BotProfile, type Seat } from "@/lib/coinche";
import { getUserId } from "@/lib/supabase/server";
import type { GameSettings } from "@/lib/supabase/types";
import { loadGame, updateGameSettings } from "./repo";

/** Host-only, lobby-only: set the personality of one bot seat (Coinche / Belote). */
export async function setBotProfile(gameId: string, seat: number, profile: BotProfile): Promise<void> {
  const uid = await getUserId();
  if (!uid) throw new Error("not_authenticated");
  if (!Number.isInteger(seat) || seat < 0 || seat > 3 || !isBotProfile(profile)) throw new Error("bad_input");
  const loaded = await loadGame(gameId);
  if (loaded.game.host_user_id !== uid) throw new Error("not_host");
  if (loaded.game.status !== "lobby") throw new Error("already_started");
  const gameType = loaded.game.game_type;
  if (gameType !== "coinche" && gameType !== "belote") throw new Error("bad_game_type");
  if (!loaded.players.some((p) => p.seat === seat && p.is_bot)) throw new Error("not_a_bot_seat");
  const settings = (loaded.game.settings ?? {}) as GameSettings;
  const botProfiles = { ...sanitizeBotProfiles(settings.botProfiles), [seat as Seat]: profile };
  await updateGameSettings(loaded.game, { ...settings, botProfiles });
}
