// Verifies a Google ID token by exchanging it against Supabase's own public
// GoTrue REST endpoint, instead of running the Supabase SDK (or a Google
// verification library) in any browser context. See
// docs/tasks/unified-profile-accounts.md for why: `/profile/profile.js` is
// deliberately unbundled (no npm-import resolution), so the browser only
// ever holds the short-lived Google ID token and this server does the
// verification + the durable-identity lookup in one round trip.

// Public, non-secret value — same one already committed in
// public/games/yatsy/supabase-config.js for the same Supabase project.
const SUPABASE_ANON_KEY = "sb_publishable_es6QfUaGUyVaS0nwmWg5bA_JRleLqBH";

/**
 * Exchanges a Google ID token for the durable Supabase user id behind it.
 * Requires the `multigames-db` Supabase project to have Google enabled as
 * an Auth provider (dashboard step, not code — see RUNBOOK setup).
 *
 * Returns `null` on any invalid/expired token or provider misconfiguration
 * (never throws) — callers answer 401, never trust a client-supplied id.
 */
export async function exchangeGoogleIdToken(idToken) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl || !idToken) return null;

  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ provider: "google", id_token: idToken })
    });
  } catch {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.user?.id) return null;

  return { userId: data.user.id, email: data.user.email || "" };
}
