import { getServiceClient } from "./supabase.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Deletes the Supabase Auth user. `muchogames_profiles` references
 * auth.users with ON DELETE CASCADE, and `muchogames_game_stats` /
 * `muchogames_launch_codes` cascade from the profile, so every hub row tied
 * to the account goes with it. Feedback is anonymous and is not touched.
 */
export async function deleteAccount(userId) {
  const { error } = await getServiceClient().auth.admin.deleteUser(userId);
  return { error };
}
