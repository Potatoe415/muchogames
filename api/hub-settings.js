import { readHubSettings } from "./_lib/hubSettings.js";
import { sendError, sendJson, withErrorHandling } from "./_lib/http.js";

/**
 * Public, read-only hub settings (hidden / pinned / "new" games, banner).
 * Cached on Vercel's CDN for a minute, so an admin edit shows up within
 * about that long and hub traffic barely reaches Supabase.
 * `Cache-Control` itself stays `no-store` (vercel.json, all of /api).
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    sendError(res, "method-not-allowed", "Use GET for /api/hub-settings.");
    return;
  }

  const { settings, error } = await readHubSettings();
  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  res.setHeader(
    "Vercel-CDN-Cache-Control",
    "max-age=60, stale-while-revalidate=300"
  );
  sendJson(res, 200, { settings });
}

export default withErrorHandling(handler);
