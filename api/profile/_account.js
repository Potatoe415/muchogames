// "My data" actions for api/profile/index.js. Not a route itself.
import { deleteAccount } from "../_lib/accounts.js";
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

/** Everything the hub stores about the signed-in player, as one JSON. */
export async function handleExport(res, identity) {
  const client = getServiceClient();
  const [profile, games] = await Promise.all([
    client
      .from("muchogames_profiles")
      .select("name, avatar_url, wins, losses, created_at, updated_at")
      .eq("id", identity.userId)
      .maybeSingle(),
    client
      .from("muchogames_game_stats")
      .select("game_id, wins, losses, best_score, last_played_at")
      .eq("profile_id", identity.userId)
  ]);

  if (profile.error) {
    sendError(res, "server-error", profile.error.message);
    return;
  }

  sendJson(res, 200, {
    exportedAt: new Date().toISOString(),
    account: { id: identity.userId, email: identity.email },
    profile: profile.data,
    // Missing until 0005_game_stats.sql runs; not a reason to fail the export.
    gameStats: games.error ? [] : games.data
  });
}

/** Requires `confirm: true` so a stray call can never wipe an account. */
export async function handleDeleteAccount(res, identity, body) {
  if (body.confirm !== true) {
    sendError(res, "invalid-profile", "confirm: true is required.");
    return;
  }

  const { error } = await deleteAccount(identity.userId);
  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { deleted: true });
}
