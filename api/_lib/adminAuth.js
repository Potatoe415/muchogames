import { getServiceClient } from "./supabase.js";

/**
 * Admin access is a Google sign-in whose Supabase Auth user id is listed in
 * ADMIN_USER_IDS (comma-separated). Ids rather than emails: a signed-in user
 * can ask Supabase to change their email from the browser, never their id.
 * See docs/decisions/0040-admin-access-by-google-account.md.
 */
function readAdminUserIds() {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUserId(userId) {
  return Boolean(userId) && readAdminUserIds().includes(userId);
}

/**
 * Resolves the Supabase access token issued at admin login back to its user
 * id, or "" when it is missing, forged, or expired (Supabase sets 1h).
 */
export async function readSessionUserId(accessToken) {
  if (typeof accessToken !== "string" || !accessToken) return "";

  const { data, error } = await getServiceClient().auth.getUser(accessToken);
  if (error || !data?.user?.id) return "";

  return data.user.id;
}
